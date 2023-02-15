const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
const Booking = db.Booking;
const Rating = db.Rating;
const UserData = db.UserData;
require('dotenv').config();
const asyncWrapper = require('../middlewares/async')
const CustomError = require("../utils/customErrors.js");
const makepayment = require('../utils/makepayment.js');
const FlutterwavePay = require('../utils/flutterwavepay.js');
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
const Op = require("sequelize").Op;
const path = require('path');
const { sequelize, Sequelize } = require('../../models');
const { sendMail } = require("../utils/sendMail.js");
const calculateBookingAmount = require("../utils/bookingcalc.js");

const bookride = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { startDate, endDate, fromLocation, toLocation } = req.body;
        const { userId, vehicleId } = req.params;

        const userData = await UserData.findOne({ where: { user_id: userId } });
        // check userdata if user is verified
        if (!userData) {
            return next(new CustomError.BadRequestError(userData.verifyStatus !== 'Verified' ? " Please complete user verification before registering a vehicle" : "No user data found"));
        }

        const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });
        const Hostuser = await vehicle.user_id;
        const rate = await vehicle.vehiclerate;
        const vehiclepickup = await vehicle.vehicleLocation;
        if (!vehicle) {
            return next(new CustomError.BadRequestError(!Hostuser ? `No vehicle matches found ` : `No vehicle matches found for host`));
        }
        if (vehicle.vehicleStatus === "UNAVAILABLE" || vehicle.isverified === false || vehicle.isbooked === true ) {
            return next(new CustomError.BadRequestError("Vehicle is not available for booking"));
        }
        if (Hostuser === userId) {
            return next(new CustomError.BadRequestError("You cannot book your own vehicle"));
        }

        const bookdetails = {
            startDate,
            endDate,
            fromLocation,
            toLocation,
            rate,
            vehiclepickup
        }

        const data = calculateBookingAmount(bookdetails);
        console.log(data);
        if (!data) {
            return next(new CustomError.BadRequestError("Error booking vehicle"));
        }

        // calculate booking duration
        if (data.bookingDuration < 1) {
            return next(new CustomError.BadRequestError(data.bookingDuration > vehicle.rentperiod ? `Booking duration cannot be less than ${vehicle.rentperiod} day` : "Booking duration cannot be less than 1 day"));
        }

        const booking = await Booking.create({
            vehicle_id: vehicleId,
            user_id: userId,
            startDate,
            endDate,
            fromLocation,
            toLocation,
            bookingRate: rate,
            hostUser: `${Hostuser}`,
            bookingAmount: `${data.bookingAmount}`,
            paymentReference: `${data.paymentReference}`,
        }, { transaction: t });


        if (!booking) {
            return next(new CustomError.BadRequestError("Error booking vehicle"));
        }
        res.status(201).json({
            message: "success",
            booking,
            duration: data.bookingDuration,
        });
    });
});

const cancelbooking = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { bookingId, userId } = req.params;
        const booking = await Booking.findOne({ where: { booking_id: bookingId } });
        if (!booking) return next(new CustomError.BadRequestError("No booking found"));

        let thisuser = booking.user_id === userId ? "Host" : "user";

        if (booking.userApproval === "Approved" || booking.hostApproval === "Approved") return next(new CustomError.BadRequestError("Booking already approved by " + thisuser));

        if (booking.bookingStatus === "Cancelled") return next(new CustomError.BadRequestError(booking.bookingStatus === "Approved" ? "Booking already completed" : "Booking already cancelled"));

        if (booking.paymentStatus === "Paid" && booking.user_id !== userId) return next(new CustomError.BadRequestError("Booking already approved and paid for"));

        if (booking.user_id !== userId  && booking.hostUser !== userId) return next(new CustomError.BadRequestError("You are not authorized to cancel this booking"));

        const vehicle = await Vehicle.findOne({ where: { vehicle_id: booking.vehicle_id } });
        if (!vehicle) return next(new CustomError.BadRequestError("No vehicle found"));
        // if vehicle isbooked is true prevent cancellation
        if (vehicle.isbooked === true) return next(new CustomError.BadRequestError("Vehicle is booked and cannot be cancelled"));

        const cancelledbooking = await Booking.update({ bookingStatus: "Cancelled" }, { where: { booking_id: bookingId } }, { transaction: t });
        if (!cancelledbooking) return next(new CustomError.BadRequestError("Error cancelling booking"));
  
        res.status(200).json({
            message: "Booking cancelled successfully",
            cancelledbooking
        });

    });
});

const approvebooking = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {  
        const { bookingId, userId } = req.params;
        console.log(userId)

        const booking = await Booking.findOne({ where: { booking_id: bookingId } }); 
        if (!booking) {
            return next(new CustomError.BadRequestError("No booking found"));
        }
        if (booking.bookingStatus === "cancelled") {
            return next(new CustomError.BadRequestError(booking.bookingStatus === "Approved" ? "Booking already completed" : "Booking already cancelled"));
        }
        if (booking.paymentStatus === "paid") {
            return next(new CustomError.BadRequestError("Booking already approved"));
        }

        // check if request is from user 
        if (booking.user_id === userId) {
            if (booking.hostApproval !== "Approved") {
                return next(new CustomError.BadRequestError("Booking has not been approved by the Vehicle Host"));
            }
            if (booking.userApproval === "Approved") {
                return next(new CustomError.BadRequestError("Booking already approved"))
            }
            const vehicle = await Vehicle.findOne({ where: { vehicle_id: booking.vehicle_id } });
            //  set isbooked to false
            vehicle.isbooked = false;
            await vehicle.save({ transaction: t });            
            
            booking.userApproval = "Approved";
            await booking.save({ transaction: t });
            res.status(200).json({
                success: 'true',
                message: "Booking approved successfully please drop a review",
                booking
            });
        } else if (booking.hostUser === userId) {
            if (booking.hostApproval === "Approved") {
                return next(new CustomError.BadRequestError(" Booking already approved and completed"));
            }


            // update host approval
            booking.hostApproval = "Approved";

            await booking.save({ transaction: t });
            res.status(200).json({
                success: 'true',
                message: "Booking approved successfully",
                booking
            });
        } else {
            return next(new CustomError.BadRequestError("You are not authorized to approve this booking"));
        }
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

const rateride = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { bookingId } = req.params;  
        const { vehicleId, rating, comment } = req.body;
        const booking = await Booking.findOne({ where: { booking_id: bookingId } });
        const vehicle = await Vehicle.findOne({ where: { vehicle_id: vehicleId } });

        if (booking.vehicle_id !== vehicleId) {
            return next(new CustomError.BadRequestError("Vehicle does not match booking"));
        }

        if (!booking) {
            return next(new CustomError.BadRequestError(Booking.hostApproval !== "Approved" ? "Booking has not been approved by Host" : "No active booking found for this vehicle"));
        }
        const ratingTable = await Rating.create({ booking_id: bookingId, rating, comment }, { transaction: t });

        const totalRatingratio = vehicle.rating + ratingTable.rating
        const totalRating = totalRatingratio / 2;
        await Vehicle.update({ rating: totalRating }, { where: { vehicle_id: vehicleId } }, { transaction: t });

        res.status(200).json({
            success: 'true',
            message: "Ride review submitted successfully",
        });
    });
});






module.exports = {
    bookride,
    cancelbooking,
    approvebooking,
    getbooking,
    rateride
}

        


