const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
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

module.exports = {
    loadDashboard
}