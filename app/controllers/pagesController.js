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

const loadDashboard = asyncWrapper(async (req, res) => {
    // ensure user token is valid
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await authService.verifyToken(token);
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
        throw new CustomError(`No user with id : ${decoded.id}`, 404);
    }
    const vehicle = await Vehicle.findAll({ where: { userId: decoded.id } });
    const blacklist = await Blacklist.findAll({ where: { userId: decoded.id } });
    res.status(200).json({ vehicle, blacklist });

});

module.exports = {
    loadDashboard
}