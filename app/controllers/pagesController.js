const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
const Booking = db.Booking;
const AccountDetails = db.AccountDetails;
const UserData = db.UserData;
require('dotenv').config();
const asyncWrapper = require('../middlewares/async')
const CustomError = require("../utils/customErrors.js"); 
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
const uploadresizeToCloudinary = require('../middlewares/cloudinary').uploadresizeToCloudinary;
const makepayment = require('../utils/makepayment.js')
const Op = require("sequelize").Op;
const path = require('path');
const Blacklist = db.Blacklist;
require('dotenv').config();
const authService = require("../utils/auth.service.js");
const { sendMail } = require("../utils/sendMail.js");
const generatePassword = require('../utils/StringGenerator.js');
const bcrypt = require('bcryptjs');
const { sequelize } = require("../../models");
const vehicleModel = require("../../models/vehicleModel");

const loadDashboard = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const vehicle = await Vehicle.findAll({ where: { 
            vehicle_status: 'AVAILABLE',
            isverified: true } });
        if (!vehicle) {
            return next(new CustomError.BadRequestError("No vehicle available for booking"));
        }
        res.status(200).json({
            message: "Available vehicles",
            vehicle
        });
    });
});

const profiledata = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { userId } = req.params;
        // user info
        const user = await User.findOne({
            where: { user_id: userId },
            include: [{
                model: Vehicle,
                attributes: ['vehicleMake', 'vehicleModel', 'vehiclePlateNumber', 'vehicleStatus', 'isverified', 'vehicle_id', 'vehicleLocation', 'vehicleDescription',],
                required: false,
                raw: true,
            }, {
                model: Booking,
                attributes: ['vehicle_id', 'startDate', 'endDate', 'bookingStatus', 'booking_id', 'fromLocation', 'toLocation', 'updatedAt', 'createdAt', 'paymentStatus', 'user_id', 'hostUser'],
                order: [ ['updatedAt', 'DESC'] ],
                raw: true,
                required: false,
            }, {
                model: AccountDetails,
                attributes: ['accountNumber', 'bankName'],
                required: false,
                raw: true,
            }, {
                model: UserData,
                attributes: ['city', 'state', 'country', 'verifyStatus'],
                required: false,
                raw: true,
            }]
        });
        if (!user) {
            return next(new CustomError.BadRequestError("User not found"));
        }
        const userJson = user.toJSON();
        // check if user is host
        if (userJson.role !== 'HOST') {
            // remove account details
            delete userJson.AccountDetails;
        }      

        const info = {
            Name: userJson.fullName,
            Phone: userJson.phone,
            Address: userJson.address,
        }
        let vehicles = userJson.Vehicles;
        let verifiedVehicles = vehicles.filter(vehicle => vehicle.isverified);
        let unverifiedVehicles = vehicles.filter(vehicle => !vehicle.isverified);
        let bookings = userJson.Bookings;
        let accountDetails = userJson.AccountDetail;
        let userData = userJson.UserDatum;
        console.log(userData)   
        // return empty array if user data is null
        if (!userData || !accountDetails || !bookings || !vehicles ||  !verifiedVehicles || !unverifiedVehicles ) {
            userData = []; accountDetails = []; bookings = []; vehicles = []; verifiedVehicles = []; unverifiedVehicles = [];
        }
        console.log(accountDetails)
        // if bookings is empty
        if (bookings.length === 0) {
            return res.status(200).json({
                message: "success",
                info,
                verifiedVehicles,
                unverifiedVehicles,
                accountDetails,
                userData,
                bookings,
            });
        }
        const vehiclebookedid = bookings.map(booking => booking.vehicle_id);
        // get vehicle name for each vehiclebookedid
        await Promise.all(vehiclebookedid.map(async (vehiclebid) => {
            let vehicle = await Vehicle.findOne({ where: { vehicle_id: vehiclebid } });
            let vehicleJson = vehicle.toJSON();
            let vehicleName = vehicleJson.vehicleMake + " " + vehicleJson.vehicleModel;
            let vehiclebooked = bookings.filter(booking => booking.vehicle_id === vehiclebid);
            vehiclebooked.forEach((booking) => {
                // add vehicleName as a new key to booking object
                booking.dataValues.vehicleName = vehicleName;
                booking.dataValues.thisUser = booking.user_id === userId ? "user" : booking.hostUser === userId ? "host" : "";
            });
        }));
        // sort 
        bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.updatedAt));        
        res.status(200).json({
            message: "success",
            info,
            verifiedVehicles,
            unverifiedVehicles,
            bookings,
            accountDetails,
            userData
        });


    });
});

const suggestvehicle = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { vehicleMake, vehicleLocation, rating } = req.query;
        const vehicles = await Vehicle.findAll({
            where: {[Op.or]: [
                    { vehicleMake: { [Op.like]: `% ${ vehicleMake } %` }},
                    { vehicleLocation: { [Op.like]: `% ${ vehicleLocation } %` }},
                    { rating: { [Op.eq]: rating } },
                ], 
                isverified: true,
                vehicle_status: 'AVAILABLE'
            },
            order: [
                ['createdAt', 'ASC'],
            ]
            }, { transaction: t });
        return res.status(200).json({
            success: true,
            slides: vehicles
        });
    });
});

const getallusers = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const users = await User.findAll({
            attributes: ['user_id','email'],
            order: [
                ['createdAt', 'ASC'],
            ]
        }, { transaction: t });
        return res.status(200).json({
            success: true,
            data: users
        });
    });
});

const checkoutpagedata = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { bookingId, userId } = req.params;
        const booking = await Booking.findOne({ where: { booking_id: bookingId },
            attributes: ['bookingRate', 'bookingAmount', 'vehicle_id', 'user_id' ]      
        });
        if (!booking) {
            return next(new CustomError.BadRequestError(booking.user_id !== userId ? "Booking not found" : "You are not authorized to view this booking"));
        }
        const vehiclebid = booking.vehicle_id;
        const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehiclebid},
            attributes: ['vehicleMake', 'vehicleModel' ]
         });
        const user = await User.findOne({ where: { user_id: booking.user_id },
            attributes: ['fullName', 'phone', 'address' ] }); 
        const remainder = booking.bookingAmount % booking.bookingRate;
        const days = (booking.bookingAmount - remainder) / booking.bookingRate;
        const vehicleName = vehicle.vehicleMake + " " + vehicle.vehicleModel;
        const charge = booking.bookingAmount - remainder;

        return res.status(200).json({ 
            success: true,
            checkoutdata: {
                bookingRate: booking.bookingRate,
                bookingAmount: booking.bookingAmount,
                days,
                vehicleName,
                charge,
                user
            }
        });



    });
});

const ridedetailspageData = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { bookingId, userId } = req.params;
        const booking = await Booking.findOne({
            where: { booking_id: bookingId },
            attributes: ['startDate', 'endDate', 'fromLocation', 'toLocation', 'vehicle_id', 'user_id', 'hostUser', 'bookingStatus', 'paymentStatus', 'paymentReference']
        });
        if (!booking) {
            return next(new CustomError.BadRequestError(booking.user_id !== userId ? "Booking not found" : "You are not authorized to view this booking"));
        }
        const user = await User.findOne({
            where: { user_id: booking.user_id === userId ? booking.hostUser : booking.user_id },
            attributes: ['fullName', 'phone']
        });
        let thisuser = booking.user_id === userId ? "user" : "host";

        const vehicle = await Vehicle.findOne({
            where: { vehicle_id: booking.vehicle_id },
            attributes: ['vehicleMake', 'vehicleModel', 'vehiclePlateNumber', 'vehicleImages']
        });
        const vehicldata = {
            vehicleName: `${vehicle.vehicleMake} ${vehicle.vehicleModel}`,
            vehiclePlateNumber: vehicle.vehiclePlateNumber,
            vehicleImage: vehicle.vehicleImage,
        }
        const bookingdata = {
            booking: booking,
            user: user,
            vehicle: vehicldata,
            thisuser
        }
        return res.json({
            success: true,
            bookingdata,
        });
    });
});

const updateuserprofile = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { userId } = req.params;
        const { username, phone, address, city, state, country } = req.body;
        const user = await User.findOne({ where: { user_id: userId } });
        if (!user) {
            return next(new CustomError.BadRequestError("User not found"));
        }
        const userisBooked = await Booking.findOne({
            where: {
                [Op.or]: [{ user_id: userId }, { hostUser: userId }],
                paymentStatus: 'Paid'
            },
        });
        if (userisBooked) {
            return next(new CustomError.BadRequestError("You cannot update your profile while you have an active booking"));
        }

        const vehicle = await Vehicle.findOne({ where: { user_id: userId, vehicleStatus: 'AVAILABLE' } });
        if (vehicle) {
            return next(new CustomError.BadRequestError("You cannot update your profile while you have an available vehicle"));
        }

        await User.update({
            username,
            phone,
            address
        }, { where: { user_id: userId } }, { transaction: t });

        await UserData.update({
            city,
            state,
            country
        }, { where: { user_id: userId } }, { transaction: t });

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
        });
    });
});


const submitverificationDoc = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { userId } = req.params;
        const {employer, branch} = req.body;
        if (!req.files) {
            return next(new CustomError.BadRequestError("No file uploaded"));
        }

        const userhasData = await UserData.findOne({ where: { user_id: userId } });

        // upload file to cloudinary
        var bufferarray = [];
        for (let i = 0; i < req.files.length; i++) {
            var localfilepath = req.files[i].path;
            var originalname = req.files[i].originalname;
            const details = {
                user: userId,
                name: originalname,
                folder: "verificationdocs",
            }
            var uploadresult = await uploadtocloudinary(localfilepath, details);
            // check for success response
            if (uploadresult.message === 'error') {
                return next(new CustomError.BadRequestError(uploadresult.message));
            }
            if (uploadresult.message === 'success') {
                bufferarray.push(uploadresult.url);
            }
        }

        if (bufferarray.length === 0) {
            return next(new CustomError.BadRequestError("Error uploading images to cloudinary")); 
        }
        if (!userhasData) {
            const created = await UserData.create({
                user_id: userId,
                employer,
                branch,
                licenseDocument: bufferarray,
                verifyStatus: "Submitted"
            }, { transaction: t });
            if (!created) {
                return next(new CustomError.BadRequestError("Error uploading verification document"));
            }
            return res.status(200).json({
                success: true,
                message: "Verification document uploaded successfully",
            });   
        } else {    
            const uploaded = await UserData.update({
                employer,
                branch,
                licenseDocument: bufferarray,
                verifyStatus: "Submitted"
            }, { where: { user_id: userId } }, { transaction: t });
            if (!uploaded) {
                return next(new CustomError.BadRequestError("Error uploading verification document"));
            }
            
            return res.status(200).json({
                success: true,
                message: "Verification document uploaded successfully",
            });
            }
    });
});

const uploadprofileimage = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { userId } = req.params;
        if (!req.file) {
            return next(new CustomError.BadRequestError("No file uploaded"));
        }
        const userhasData = await UserData.findOne({ where: { user_id: userId } });
        if (!userhasData) {
            return next(new CustomError.BadRequestError(userhasData.verifyStatus !== "Approved" ? "You cannot upload a profile image until your verification is approved" : "User not found")); 
        }
        const userisBooked = await Booking.findOne({
            where: {
                [Op.or]: [{ user_id: userId }, { hostUser: userId }],
                paymentStatus: 'Paid'
            },
        });
        if (userisBooked) {
            return next(new CustomError.BadRequestError("You cannot update your profile while you have an active booking"));
        }
        

        const details = {
            user: userId,
            folder: 'profile_images',
            name: `profile_image_${userId}`,
        }


        const imageBuffer = await resizeImage(req.file.path);
        const uploadResult = await uploadresizeToCloudinary(imageBuffer, details );

        if (uploadResult.message === 'success') {
            await userHasData.update({ profile_image: uploadResult.url }, { transaction: t });
            return res.status(200).json({
                message: 'Profile image uploaded successfully',
                data: uploadResult.url,
            });
        } else {
            return next(new CustomError.InternalServerError(uploadResult.error));
        }
    });
});





        



module.exports = {
    loadDashboard,
    profiledata,
    suggestvehicle,
    getallusers,
    checkoutpagedata,
    ridedetailspageData,
    updateuserprofile,
    submitverificationDoc,
    uploadprofileimage,
}