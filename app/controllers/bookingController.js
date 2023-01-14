const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
const Booking = db.Booking;
require('dotenv').config();
const asyncWrapper = require('../middlewares/async')
const CustomError = require("../utils/customErrors.js");
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
const FlutterwavePay = require('../utils/flutterwavePay.js');
const Op = require("sequelize").Op;
const path = require('path');
const { sequelize, Sequelize } = require('../../models');
const { sendMail } = require("../utils/sendMail.js");

const bookride = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { startDate, endDate, fromLocation, toLocation } = req.body;
        const { userId, vehicleId } = req.params;

        const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
        const Hostuser = await vehicle.user_id;
        const rate = await vehicle.vehiclerate;
        if (!vehicle) {
            return next(new CustomError.BadRequestError(!Hostuser ? `No vehicle matches found ` : `No vehicle matches found for host`));
        }
        // if (vehicle.vehicleStatus === "UNAVAILABLE" || vehicle.isverified === "false" ) {
        //     return next(new CustomError.BadRequestError("Vehicle is not available for booking"));
        // }
        if (Hostuser === userId) {
            return next(new CustomError.BadRequestError("You cannot book your own vehicle"));
        }
        // calculate booking duration
        const bookingDuration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        if (bookingDuration < 1) {
            return next(new CustomError.BadRequestError("Booking duration cannot be less than 1 day"));
        }
        //  calculate booking amount
        const calculatedBookingAmount = bookingDuration * rate;


        // generate payment reference
        const paymentReference = `TAXIMANIA_${Math.floor(Math.random() * 1000000000) + 1}_${Date.now}`;

        const booking = await Booking.create({
            vehicle_id: vehicleId,
            user_id: userId,
            startDate,
            endDate,
            fromLocation,
            toLocation,
            bookingRate: rate,
            hostUser: `${Hostuser}`,
            bookingAmount: calculatedBookingAmount,
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
        const { userId } = req.body;

        const booking = await Booking.findOne({ where: { booking_id: bookingId } }); 
        if (!booking) {
            return next(new CustomError.BadRequestError("No booking found"));
        }
        if (booking.bookingStatus === "cancelled") {
            return next(new CustomError.BadRequestError(booking.bookingStatus === "approved" ? "Booking already completed" : "Booking already cancelled"));
        }
        if (booking.paymentStatus === "paid") {
            return next(new CustomError.BadRequestError("Booking already approved"));
        }

        // check if request is from user 
        if (booking.user_id === userId) {
            if (booking.userApproval === "Approved") {
                return next(new CustomError.BadRequestError("Booking already completed"));
            }
            // update user approval
            booking.userApproval = "Approved";
        } else if (booking.hostUser === userId) {
            if (booking.hostApproval === "Approved") {
                return next(new CustomError.BadRequestError(Booking.userApproval !== "Approved" ? "Booking has not been approved by User" : "Booking already completed"));
            }
            // update host approval
            booking.hostApproval = "Approved";
        } else {
            return next(new CustomError.BadRequestError("You are not authorized to approve this booking"));
        }
        await booking.save({ transaction: t });
        res.status(200).json({
            success: 'true',
            message: "Booking approved successfully",
            booking
        });
    });
});

const getbooking = asyncWrapper(async (req, res, next) => {
    const { bookingId, userId } = req.params;
    const booking = await Booking.findOne({ 
        where: { booking_id: bookingId },
        attributes: ['booking_id', 'bookingRate', 'bookingAmount', 'paymentReference'],
        include: [ { 
            model: User, 
            where: { user_id: Sequelize.col('booking.user_id') }, 
            attributes: ['user_id', 'firstname', 'lastname', 'email', 'phone','address']
            } ] 
        });

    if (!booking) {
        return next(new CustomError.BadRequestError("No booking found"));
    }
    if (booking.user_id !== userId) {
        return next(new CustomError.BadRequestError("You are not authorized to view this booking"));
    }

    res.status(200).json({
        success: 'true',
        message: "Booking found",
        booking
    });
});


module.exports = {
    bookride,
    cancelbooking,
    approvebooking,
    getbooking
}

        


