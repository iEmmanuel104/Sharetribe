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
const { sequelize, Sequelize } = require('../../models');
const { sendMail } = require("../utils/sendMail.js");

const bookride = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { startDate, endDate, fromLocation, toLocation, bookingRate, bookingAmount } = req.body;
        const { userId, vehicleId } = req.params;

        const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
        const Hostuser = await vehicle.user_id;
        if (!vehicle) {
            return next(new CustomError.BadRequestError(!Hostuser ? `No vehicle matches found ` : `No vehicle matches found for host`));
        }
        if (vehicle.vehicleStatus === "UNAVAILABLE" || vehicle.isverified === "false" ) {
            return next(new CustomError.BadRequestError("Vehicle is not available for booking"));
        }
        if (Hostuser === userId) {
            return next(new CustomError.BadRequestError("You cannot book your own vehicle"));
        }

        // generate payment reference
        const paymentReference = `TAXIMANIA_${Math.floor(Math.random() * 1000000000) + 1}`;

        const booking = await Booking.create({
            vehicle_id: vehicleId,
            user_id: userId,
            startDate,
            endDate,
            fromLocation,
            toLocation,
            bookingRate,
            hostUser: `${Hostuser}`,
            bookingAmount,
            paymentReference
        }, { transaction: t });
        if (!booking) {
            return next(new CustomError.BadRequestError("Error booking vehicle"));
        }
        res.status(201).json({
            message: "please make payment to complete booking process",
            booking
        });
    });
});

const cancelbooking = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { bookingId } = req.params;
        const { userId } = req.body;
        const booking = await Booking.findOne({ where: { booking_id: bookingId } });
        if (!booking) return next(new CustomError.BadRequestError("No booking found"));

        if (booking.userApproval === "Approved" || booking.hostApproval === "Approved") return next(new CustomError.BadRequestError("Booking already approved"));

        if (booking.bookingStatus === "cancelled") return next(new CustomError.BadRequestError(booking.bookingStatus === "approved" ? "Booking already completed" : "Booking already cancelled"));

        if (booking.paymentStatus === "paid") return next(new CustomError.BadRequestError("Booking already approved"));

        if (booking.user_id !== userId  && booking.hostUser !== userId) return next(new CustomError.BadRequestError("You are not authorized to cancel this booking"));

        const cancelledbooking = await Booking.update({ bookingStatus: "cancelled" }, { where: { booking_id: bookingId } }, { transaction: t });
        if (!cancelledbooking) return next(new CustomError.BadRequestError("Error cancelling booking"));
  
        res.status(200).json({
            message: "Booking cancelled successfully",
            cancelledbooking
        });

    });
});

const approvebooking = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {  
        const { bookingId } = req.params;
        const booking = await Booking.findOne({ where: { booking_id: bookingId } });    
        if (!booking) {
            return next(new CustomError.BadRequestError("No booking found"));
        }
        if (booking.bookingStatus === "cancelled") {
            return next(new CustomError.BadRequestError("Booking already cancelled"));
        }
        if (booking.bookingStatus === "approved") {
            return next(new CustomError.BadRequestError("Booking already completed"));
        }
        if (booking.paymentStatus === "paid") {
            return next(new CustomError.BadRequestError("Booking already approved"));
        }
        if (booking.bookingStatus === "pending") {
            const booking = await Booking.update({ bookingStatus: "approved" }, { where: { booking_id: bookingId } }, { transaction: t });
            if (!booking) {
                return next(new CustomError.BadRequestError("Error approving booking"));
            }
            res.status(200).json({
                message: "Booking approved successfully",
                booking
            });
        }
    });
});


module.exports = {
    bookride,
    cancelbooking,
}

        


