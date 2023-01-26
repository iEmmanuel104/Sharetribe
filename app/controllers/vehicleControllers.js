const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
const Booking = db.Booking;
require('dotenv').config();
const asyncWrapper = require('../middlewares/async')
const CustomError = require("../utils/customErrors.js"); 
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
const Op = require("sequelize").Op;
const path = require('path');
const { vehicleRegristrationMail,
        verifiedvehicleMail } = require("../utils/mailTemplates.js");
const { sequelize, Sequelize } = require('../../models');


const registerVehicle = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {

        const { vehicleMake, vehicleModel, vehicleCondition, vehicleType, vehicleYear, vehicleTransmission, vehicleFuel, vehicleColor, vehicleDoors, vehicleCapacity, vehiclerate, vehicleDescription, vehiclePlateNumber, vehicleIdNumber, vehicleRegistrationDate, vehicleLocation } = req.body;     
        const { userId } = req.params;
        // const { } = req.files;
        // const filepath = req.files.image.tempFilePath;
        const user = await User.findOne({ where: { user_id: userId } });
        const vehicleExist = await Vehicle.findOne({ where: { 
            vehicle_plate_number : vehiclePlateNumber, 
            vehicle_id_number: vehicleIdNumber 
        } });   
        if (!user) {
            return next(new CustomError.BadRequestError(`No user with id : ${userId}`));
        }
        if (!req.files) {
            return next(new CustomError.BadRequestError("No image uploaded please upload an image"));
        }
        if (!req.files.length > 5) {
            throw new Error("Maximum of 5 images allowed");
        }  
        if (vehicleExist) {
        return next(new CustomError.BadRequestError(vehicleExist.user_id === userId ? "You already have a vehicle with this plate number and id number" : "Another user already has a vehicle with this plate number and id number"));
        }

        var bufferarray = [];
        for (let i = 0; i < req.files.length; i++) {
            var localfilepath = req.files[i].path;
            var originalname = req.files[i].originalname;
            var uploadresult = await uploadtocloudinary(localfilepath, originalname);
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
         const vehicle = await Vehicle.create({
            user_id: userId,
            vehicleMake,
            vehicleModel,
            vehicleCondition,
            vehicleType,
            vehicleYear,
            vehicleTransmission,
            vehicleFuel,
            vehicleColor,
            vehicleDoors,
            vehicleCapacity,
            vehiclerate,
            vehicleDescription,
            vehiclePlateNumber,
            vehicleIdNumber,
            vehicleRegistrationDate,
            vehicleLocation,
            vehicleImages: bufferarray
        }, { transaction: t });

        if (!vehicle) {
            return next(new CustomError.BadRequestError("Error creating vehicle"));
        }
        // send mail to user
        await vehicleRegristrationMail(user.email, user.fullName, vehicle.vehiclePlateNumber);

        res.status(201).json({
            message: 'success',
            data: {
                vehicle,
                cloudinaryupload: {message: 'successfully uploaded to cloudinary', url: bufferarray}
            }
        });
    });
});

const getuserVehicles = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { userId } = req.params;
        const user = await User.findOne({ where: { user_id: userId } });

        if (!user) {
            return next(new CustomError.BadRequestError(`No user with id : ${userId}`));
        }

        const vehicle = await Vehicle.findAll({ where: { user_id: userId } });
        res.status(200).json({message: 'success', vehicle });
    });
});

const updateVehicle = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { userId, vehicleId } = req.params;
        const { vehicleStatus, vehicleDescription, vehicleLocation,  } = req.body;

        const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
        if (!vehicle) return next(new CustomError.BadRequestError("Oops! No vehicle found"));
        if (vehicle.user_id !== userId) return next(new CustomError.BadRequestError("Oops! You are not authorized to update this vehicle"));
        if (vehicleStatus === 'AVAIALABLE' && vehicle.isbooked === true) return next(new CustomError.BadRequestError("Oops! You cannot make this vehicle available while it is booked"));
        // check request type either patch or delete request
        if (req.method === 'PATCH') {
            const updatevehicle = await Vehicle.update({  
                vehicleStatus,
                vehicleDescription,
                vehicleLocation,
            }, { where: { user_id: userId, vehicle_id: vehicleId } }, { transaction: t });
            res.status(200).json({ message: 'success', updatevehicle });
        }
        if (req.method === 'DELETE') {
            const deletevehicle = await Vehicle.destroy({ where: { user_id: userId, vehicle_id: vehicleId } }, { transaction: t });
            res.status(200).json({ message: 'success', deletevehicle });    
        };
    });
});

const getAllVehicle = asyncWrapper(async (req, res, next) => {
    const vehicle = await Vehicle.findAll({where: { 
        vehicle_status: 'AVAILABLE',
        isverified: true
    }}, 
    // return vehicle in order of latest update
    {order: [['updatedAt', 'DESC']]});

    res.status(200).json({ message: 'success', vehicle });
});

const getAll = asyncWrapper(async (req, res, next) => {
    const vehicle = await Vehicle.findAll({
        attributes: [ 'user_id', 'vehicleId', 'vehicleMake', 'vehicleModel', 'vehiclePlateNumber', 'vehicleIdNumber', 'vehicleLocation', 'vehicleStatus', 'isverified', 'isbooked', 'createdAt', 'updatedAt']
    });
    res.status(200).json({ message: 'success', vehicle });
});

const getVehicleById = asyncWrapper(async (req, res, next) => {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
    res.status(200).json({ message: 'success', vehicle });
});

const searchVehicle = asyncWrapper(async (req, res, next) => {
    const {vehicleName, vehicleType, vehicleModel, numericFilters} = req.query
    const queryobject = {};
    if (numericFilters) {
        const operatorMap = {
            ">": "$gt",
            ">=": "$gte",
            "=": "$eq",
            "<": "$lt",
            "<=": "$lte",
        };
        const regEx = /\b(<|>|>=|=|<|<=)\b/g;
        let filters = numericFilters.replace(
            regEx,
            (match) => `-${operatorMap[match]}-`
        );
        const options = ["price", "rating"];
        filters = filters.split(",").forEach((item) => {
            const [field, operator, value] = item.split("-");
            if (options.includes(field)) {
                queryobject[field] = { [operator]: parseFloat(value) };
            }
        });
    const vehicle = await Vehicle.findAll({
        where: {
            [Op.and]: [
                { vehicleName: { [Op.like]: `%${vehicleName}%` } },
                { vehicleType: { [Op.like]: `%${vehicleType}%` } },
                { vehicleModel: { [Op.like]: `%${vehicleModel}%` } },
                queryobject,
            ],
        },
    });
        res.status(200).json({ message: 'success', vehicle });
    }   
});

const getVehicleImages = asyncWrapper(async (req, res, next) => {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ where: { vehicleId } });
    if (vehicle.vehicleImages) {
        return res.status(200).json({ message: 'success', vehicleImages: vehicle.vehicleImages });
    }
    res.status(404).json({ message: "No image found" });
});

const verifyVehicle = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { vehicleId } = req.params;
        const vehicle = await Vehicle.findOne({ where: { vehicleId } });

        if (!vehicle) {
            return next(new CustomError.BadRequestError(`No vehicle with id : ${vehicleId}`));
        }
        if (vehicle.isverified === true) {
            return next(new CustomError.BadRequestError(`Vehicle with id : ${vehicleId} is already verified`));
        }

        const verify = await Vehicle.update({ isverified: true }, { where: { vehicleId } }, { transaction: t });
        // send email to user
        const user = await User.findOne({ where: { user_id: vehicle.user_id } });
        const { email, fullName } = user;
        const vehicleNumber = vehicle.vehiclePlateNumber;
        await verifiedvehicleMail(email, fullName, vehicleNumber);
        res.status(200).json({ message: 'success', verify });
    });
});


  
        


module.exports = {
    registerVehicle,
    getuserVehicles,
    updateVehicle,
    // deleteVehicle,
    getAllVehicle,
    getAll,
    getVehicleById,
    searchVehicle,
    getVehicleImages,
    verifyVehicle
};



