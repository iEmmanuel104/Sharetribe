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
const Op = require("sequelize").Op;
const sharp = require('sharp');
require('dotenv').config();

const { sequelize } = require("../../models");

async function getBookingsWithVehicleName(bookings, userId) {
    const vehiclebookedid = bookings.map(booking => booking.vehicle_id);
    await Promise.all(vehiclebookedid.map(async (vehiclebid) => {
        let vehicle = await Vehicle.findOne({ where: { vehicle_id: vehiclebid } });
        let vehicleJson = vehicle.toJSON();
        let vehicleName = vehicleJson.vehicleMake + " " + vehicleJson.vehicleModel;
        let vehiclebooked = bookings.filter(booking => booking.vehicle_id === vehiclebid);
        console.log('---------------------------------------------------')
        // console.log(vehiclebooked)        
        vehiclebooked.forEach((booking) => {
            booking.vehicleName = vehicleName;
            console.log(booking.vehicleName)
            booking.thisUser = booking.user_id === userId ? "user" : booking.hostUser === userId ? "host" : "";
            console.log(booking.thisUser)
        });
        console.log('---------------------------------------------------')
        // console.log(booking)
    }));

    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.updatedAt));

    return bookings;
}


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
                attributes: ['vehicleMake', 'vehicleModel', 'vehiclePlateNumber', 'vehicleStatus', 'isverified', 'vehicle_id', 'vehicleLocation', 'vehicleDescription','vehiclerate', 'rentperiod'],
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
                attributes: ['accountNumber', 'bankName', 'accountName'],
                required: false,
                raw: true,
            }, {
                model: UserData,
                attributes: ['city', 'state', 'country', 'verifyStatus', 'userImage'],
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

        if (bookings.length === 0) {
            let bookings = await Booking.findAll({
                where: { hostUser: userId },
                attributes: ['vehicle_id', 'startDate', 'endDate', 'bookingStatus', 'booking_id', 'fromLocation', 'toLocation', 'updatedAt', 'createdAt', 'paymentStatus', 'user_id', 'hostUser'],
                order: [ ['updatedAt', 'DESC'] ],
                raw: true,
            });
            bookings = await getBookingsWithVehicleName(bookings, userId);
            return res.status(200).json({
                message: "success",
                info,
                verifiedVehicles,
                unverifiedVehicles,
                accountDetails,
                userData,
                bookings,
            });
        } else {
            let bookings = await Booking.findAll({
                where: { user_id: userId },
                attributes: ['vehicle_id', 'startDate', 'endDate', 'bookingStatus', 'booking_id', 'fromLocation', 'toLocation', 'updatedAt', 'createdAt', 'paymentStatus', 'user_id', 'hostUser'],
                order: [['updatedAt', 'DESC']],
                raw: true,
            });            
            bookings = await getBookingsWithVehicleName(bookings, userId);      
            res.status(200).json({
                message: "success",
                info,
                verifiedVehicles,
                unverifiedVehicles,
                bookings,
                accountDetails,
                userData
            });
        }


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
            attributes: ['fullName', 'phone'],
            include: [{ 
                model: UserData,
                attributes: ['userImage']
            }]

        });
        
        let thisuser = booking.user_id === userId ? "user" : "host";
        // remove userData from user object if bookingStatus is approved or cancelled
        if (booking.bookingStatus === 'Approved' || booking.bookingStatus === 'Cancelled') {
            delete user.dataValues.UserData;
        }

           

        // console.log(user);

        const vehicle = await Vehicle.findOne({
            where: { vehicle_id: booking.vehicle_id },
            attributes: ['vehicleMake', 'vehicleModel', 'vehiclePlateNumber', 'vehicleImages'],
        });
        const vehicldata = {
            vehicleName: `${vehicle.vehicleMake} ${vehicle.vehicleModel}`,
            vehiclePlateNumber: vehicle.vehiclePlateNumber,
            // get image that that has banner included in it name else get the first image
            vehicleImage: vehicle.vehicleImages.find(image => image.includes('banner')) || vehicle.vehicleImages[0]
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
        const { phone, address, city, state, country } = req.body;
        const user = await User.findOne({ where: { user_id: userId } });
        if (!user) {
            return next(new CustomError.BadRequestError("User not found"));
        }
        const userisBooked = await Booking.findOne({
            where: {
                [Op.or]: [{ user_id: userId }, { hostUser: userId }],
                paymentStatus: 'Paid',
                bookingStatus: 'Pending',
            },
        });
        if (userisBooked) {
            return next(new CustomError.BadRequestError("You cannot update your profile while you have an active booking"));
        }

        const vehicle = await Vehicle.findOne({ where: { user_id: userId, vehicleStatus: 'AVAILABLE' } });
        if (vehicle) {
            return next(new CustomError.BadRequestError("Please deactivate all AVAILABLE vehicles before updating your profile"));
        }

        await User.update({
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
                paymentStatus: 'Paid',
                bookingStatus: 'Pending'
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
        const filepath = req.file.path;
        
        const uploadResult = await uploadresizeToCloudinary(filepath, details );

        console.log('upload result from controler', uploadResult);

        if (uploadResult.message === 'success') {
            await UserData.update({ userImage: uploadResult.url }, { where: { user_id: userId } }, { transaction: t });
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