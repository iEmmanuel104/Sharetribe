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
const sharp = require('sharp');
require('dotenv').config();

const { sequelize } = require("../../models");

const getAdminDashboardData = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const userHasData = await UserData.findAll({
            where: { verifyStatus: 'Submitted' },
            attributes: ['user_id', 'licenseDocument', 'createdAt', 'verifyStatus'],
        });
        // get the user name from the user table
        for (let i = 0; i < userHasData.length; i++) {
            const user = await User.findOne({ where: { user_id: userHasData[i].user_id } });
            userHasData[i].dataValues.name = user.fullName;
        }

        const vehicle = await Vehicle.findAll({
            where: { isverified: false },
            attributes: ['vehicle_id','vehiclePlateNumber', 'vehicleIdNumber', 'vehicleMake','vehicleModel', 'vehicleImages', 'createdAt', 'user_id'],
        });
        // get the user name from the user table
        for (let i = 0; i < vehicle.length; i++) {
            const user = await User.findOne({ where: { user_id: vehicle[i].user_id } });
            vehicle[i].dataValues.name = user.fullName;
        }


        return res.status(200).json({
            success: true,
            message: "Admin Dashboard Data",
            Userdata: userHasData,
            Vehicle: vehicle,
        });
    });

});

const AccountDocsVerify = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { UserId } = req.params;
        const { action } = req.query;
        const user = await User.findOne({ where: { user_id : UserId } });
        if (!user) {
            return next(new CustomError.BadRequestError("User not found"));
        }
        const userData = await UserData.findOne({ where: {user_id: UserId} })
        if (!userData) {
            return next(new CustomError.BadRequestError("User data not found"));
        }
        if (userData.verifyStatus === 'Verified') {
            return next(new CustomError.BadRequestError("User data already verified"));
        }

        // check if action is to verify or reject   
        if (action === 'verify') {
                userData.verifyStatus = 'Verified';
                await userData.save({ transaction: t });
                res.status(200).json({
                success: true,
                message: "User data Verified successfully"
            });
        } else if (action === 'reject') {
                userData.verifyStatus = 'Rejected';
                await userData.save({ transaction: t });
                res.status(200).json({
                success: true,
                message: "User data Rejected"
            });
        }
    });
});

const vehicleverify = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { VehicleId } = req.params;

        const vehicle = await Vehicle.findOne({ where: { vehicle_id: VehicleId } });
        if (!vehicle) {
            return next(new CustomError.BadRequestError("Vehicle not found"));
        }
        if (vehicle.isverified === true) {
            return next(new CustomError.BadRequestError("Vehicle already verified"));
        }

        vehicle.isverified = true;
        await vehicle.save({ transaction: t });
        res.status(200).json({
            success: true,
            message: "Vehicle Verified successfully"
        });
    });
});



module.exports = {
    getAdminDashboardData,
    AccountDocsVerify,
    vehicleverify,
}
