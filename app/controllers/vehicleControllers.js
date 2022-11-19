const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
require('dotenv').config();
const asyncWrapper = require('../middlewares/async')
const CustomError = require("../utils/customErrors.js"); 
const Op = require("sequelize").Op;
const path = require('path');


const registerVehicle = asyncWrapper(async (req, res) => {
    const { vehicleName, vehicleType, vehicleNumber, vehicleModel, vehicleColor, vehicleStatus, vehicleDescription, vehicleLocation, vehicleCapacity, type, imagename, data } = req.body;
    const { userId } = req.params;
    const { mimetype, originalname, filename } = req.file;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
        throw new CustomError(`No user with id : ${userId}`, 404);
    }
    if (!mimetype.startsWith('image')) {
        throw new Error('Please upload an image file');
    }
    const vehicle = await Vehicle.create({ 
        userId,
        vehicleName,
        vehicleType,
        vehicleNumber,
        vehicleModel,
        vehicleColor,
        vehicleStatus,
        vehicleDescription,
        vehicleLocation,
        vehicleCapacity,
        type: mimetype,
        imagename: originalname,
        data: filename,
    });

    res.status(200).json({message: "Vehicle registered successfully", vehicle});
});

const getVehicle = asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
        throw new CustomError(`No user with id : ${userId}`, 404);
    }

    const vehicle = await Vehicle.findAll({ where: { userId: userId } });
    res.status(200).json({ vehicle });
});

const updateVehicle = asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const { vehicleName, vehicleType, vehicleNumber, vehicleModel, vehicleColor, vehicleStatus, vehicleDescription, vehicleLocation, vehicleCapacity, type, imagename, data } = req.body;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
        throw new CustomError(`No user with id : ${userId}`, 404);
    }

    const vehicle = await Vehicle.update({  
        vehicleName,
        vehicleType,
        vehicleNumber,
        vehicleModel,
        vehicleColor,
        vehicleStatus,
        vehicleDescription,
        vehicleLocation,
        vehicleCapacity,
        type,
        imagename,
        data
    }, { where: { userId: userId } });

    res.status(200).json({ vehicle });
});

const deleteVehicle = asyncWrapper(async (req, res) => {
    const { userId } = req.params;
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
        throw new CustomError(`No user with id : ${userId}`, 404);
    }

    const vehicle = await Vehicle.destroy({ where: { userId: userId } });
    res.status(200).json({ vehicle });
});

const getAllVehicle = asyncWrapper(async (req, res) => {
    const vehicle = await Vehicle.findAll();
    res.status(200).json({ vehicle });
});

const getVehicleById = asyncWrapper(async (req, res) => {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId } });
    res.status(200).json({ vehicle });
});

const searchVehicle = asyncWrapper(async (req, res) => {
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
    res.status(200).json({ vehicle });
    }   
});

const getVehicleImages = asyncWrapper(async (req, res) => {
    const { vehicleId } = req.params;
    const vehicle = await Vehicle.findOne({ where: { id: vehicleId } });
    if (vehicle.data) {
        return res.sendFile(path.join(__dirname, `../../uploads/${vehicle.data}`));
    }
    res.status(404).json({ message: "No image found" });
});



module.exports = {
    registerVehicle,
    getVehicle,
    updateVehicle,
    deleteVehicle,
    getAllVehicle,
    getVehicleById,
    searchVehicle,
    getVehicleImages
};



