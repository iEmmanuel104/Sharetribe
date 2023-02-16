const db = require("../../models");
const User = db.User;
const Vehicle = db.Vehicle;
const Booking = db.Booking;
const Paymentref = db.Paymentref; 
const Rating = db.Rating;
const AccountDetails = db.AccountDetails;
const PaymentDetails = db.PaymentDetails;
require('dotenv').config();
const asyncWrapper = require('../middlewares/async')
const CustomError = require("../utils/customErrors.js");
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;
// const FlutterwavePay = require('../utils/flutterwavePay.js');
// const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);
const Op = require("sequelize").Op;
const path = require('path');
const { sequelize, Sequelize } = require('../../models');
const { senduserbookingconfirmationMail,
    sendhostbookingconfirmationMail } = require('../utils/mailTemplates.js');
const { use } = require("../routes/hostRoute");

// update account details
 
const updateAccountDetails = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { accountNumber, bankName } = req.body;
        const { userId } = req.params;
        const user = await User.findOne({ where: { user_id: userId } });

        // check if account details already exist
        const accountDetails = await AccountDetails.findOne({ where: { user_id: userId } });

        const acctName = user.fullName

        if (!accountDetails) {
            // create new account details
           await AccountDetails.create({
                accountNumber,
                accountName: acctName,
                bankName,
                user_id: userId
            }, { transaction: t });

            return res.status(201).json({
                status: 'success',
                message: 'Account details created successfully',
            });
        } else {
            // update account details
            await AccountDetails.update({
                accountNumber,
                bankName,
            }, {
                where: { user_id: userId }
            }, { transaction: t });

            return res.status(200).json({
                status: 'success',
                message: 'Account details updated successfully',
            });
        }
    });
});

const getAccountDetails = asyncWrapper(async (req, res, next) => {
    const { userId } = req.params;
    const user = await User.findOne({ where: { user_id: userId } });

    // check is user is host
    if (user.role !== 'host') {
        return next(new CustomError.BadRequestError('you need to be a host to get your account details'));
    }

    const accountDetails = await AccountDetails.findOne({ where: { user_id: userId } });

    if (!accountDetails) {
        return next(new CustomError.NotFoundError('Account details not found'));
    }

    return res.status(200).json({
        status: 'success',
        message: 'Account details retrieved successfully',
        data: accountDetails
    });
});

const makeflutterwavepayment = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { bookingId, userId } = req.params;
        console.log(userId)

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
            const user = await User.findOne({
                where: { user_id: userId },
                attributes: ['email', 'fullName', 'phone']
            });
            // make flutterwave payment
            const { bookingAmount, paymentReference, vehicle_id, hostuser, bookingId, user_Id } = booking;
            const { email, phone, fullName } = user;
            const paydetails = {
                amount: bookingAmount,
                email,
                phone,
                fullName,
                tx_ref: paymentReference,
                vehicle_id,
                HostUser: hostuser,
                BookingId: bookingId,
                user_Id,
                publicKey: process.env.FLW_PUBLIC_KEY,
                logo: process.env.LOGO
            }
            //  implementation for standard flutterwave payment


            // const payment = await FlutterwavePay(paydetails);
            // // const payment = makepayment(booking, user);
            // if (!payment || payment.status !== "success") {
            //     return next(new CustomError.BadRequestError("Error making payment"));
            // }
            // redirect link to flutterwave payment page
            res.status(200).json({
                success: 'true',
                message: "Payment details",
                paydetails
            });
        } else {
            return next(new CustomError.BadRequestError("You are not authorized to make payment for this booking"));
        }
    });
});

const verifyflutterwavepayment = asyncWrapper(async (req, res, next) => {
    const { tx_ref, transaction_id, status} = req.body; 
    const {userId} = req.params;
    const booking = await Booking.findOne({ where: { paymentReference : tx_ref } });
    const user = await User.findOne({ where: { user_id: userId } });
    const bookingId = booking.booking_id;
    console.log('-------------------------------------',booking)

    if (!user) {
        return next(new CustomError.NotFoundError("oops! Unknow identity"));
    }

    if (!booking) {
        return next(new CustomError.NotFoundError( booking.user_id !== userId ? "Unauthorized Action" : "No booking found"));
    }
    if (status === 'successful') {
        console.log('payment successful')
        const payment = await flw.Transaction.verify({id :transaction_id}); 

        if (payment.status === 'success') {
            await sequelize.transaction(async (t) => {
                await Booking.update({
                    // userApproval : 'Approved',
                    paymentStatus : 'Paid',
                }, {
                    where: { paymentReference : tx_ref }
                }, { transaction: t });

                await Paymentref.create({ flwRef : transaction_id }, { transaction: t });

                const vehicle = await Vehicle.findOne({ where: { vehicle_id: booking.vehicle_id } }); 
                    // update vehicle availability
                await Vehicle.update({
                    vehicleStatus : 'UNAVAILABLE',
                    isbooked : true
                }, { where: { vehicle_id: booking.vehicle_id } }, { transaction: t });
                // send email to user
                const user = await User.findOne({ where: { user_id: booking.user_id }, attributes: ['email', 'fullName'] });
                const host = await User.findOne({ where: { user_id: vehicle.user_id }, attributes: ['email', 'fullName'] });
                const { email, fullName } = user;
                const { email: hostEmail, fullName: hostName } = host;
                const { vehicleMake, vehicleModel , vehiclePlateNumber } = vehicle;
                const vehicleName = `${vehicleMake} ${vehicleModel}`;
                // send email to user
                await senduserbookingconfirmationMail(email, fullName, vehicleName);
                // send email to host
                await sendhostbookingconfirmationMail(hostEmail, hostName, vehicleName, vehiclePlateNumber);
                return res.status(200).json({
                    status: 'success',
                    message: 'Payment verified successfully',
                    booking
                });
            });
        } else {
            console.log(payment)
            console.log(payment.status)
            return next(new CustomError.BadRequestError('Payment verification failed'));
        }
    } else {
        return next(new CustomError.BadRequestError('Payment failed, please try again'));
    }
});





module.exports = {
    updateAccountDetails,
    getAccountDetails,
    makeflutterwavepayment,
    verifyflutterwavepayment
}