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
const Blacklist = db.Blacklist;
require('dotenv').config();
const authService = require("../utils/auth.service.js");
const { sendMail } = require("../utils/sendMail.js");
const generatePassword = require('../utils/StringGenerator.js');
const bcrypt = require('bcryptjs');
const { sequelize } = require("../../models");
const vehicleModel = require("../../models/vehicleModel");

const loadDashboard = asyncWrapper(async (req, res) => {
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

const profiledata = asyncWrapper(async (req, res) => {
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
                attributes: ['vehicle_id', 'startDate', 'endDate', 'bookingStatus', 'booking_id'],
                required: false,
            }]
        });
        if (!user) {
            return next(new CustomError.BadRequestError("User not found"));
        }
        const userJson = user.toJSON();
        const info = {
            Name: userJson.fullName,
            Phone: userJson.phone,
            Address: userJson.address,
        }
        const vehicles = userJson.Vehicles;
        console.log(vehicles);
        const verifiedVehicles = vehicles.filter(vehicle => vehicle.isverified);
        const unverifiedVehicles = vehicles.filter(vehicle => !vehicle.isverified);
        const bookings = userJson.Bookings;
        console.log(bookings, "bookings");
        // if bookings is empty
        if (bookings.length === 0) {
            return res.status(200).json({
                message: "success",
                info,
                verifiedVehicles,
                unverifiedVehicles,
                bookings
            });
        }
        const vehiclebooked = bookings.map(booking => booking.vehicle_id);
        // if undefined
        const vehiclebookedname = await Vehicle.findOne({ where: { vehicle_id: vehiclebooked[0] },
            attributes: ['vehicleMake','vehicleModel', 'vehiclePlateNumber', 'vehicleStatus', 'isverified',  'vehicle_id'],
            required: false,
         });
        console.log(vehiclebookedname , "vehiclebookedname");

        res.status(200).json({
            message: "success",
            info,
            verifiedVehicles,
            unverifiedVehicles,
            bookings
            
        });
    });
});

const suggestvehicle = asyncWrapper(async (req, res) => {
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
            data: vehicles
        });
    });
});

const getallusers = asyncWrapper(async (req, res) => {
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


module.exports = {
    loadDashboard,
    profiledata,
    suggestvehicle,
    getallusers
}