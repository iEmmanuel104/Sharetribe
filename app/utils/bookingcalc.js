const CustomError = require("../utils/customErrors.js");

const calculateBookingAmount = (bookdetails) => {

    const { startDate, endDate, fromLocation, toLocation, rate, vehiclepickup } = bookdetails;

    let percent;

    // if location is different from host location, add 5% of the total amount to the booking amount
    if (fromLocation !== vehiclepickup || toLocation !== fromLocation) {
        percent = 1.05;
    } else {
        percent = 1;
    }
    

    const bookingDuration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

    if (bookingDuration < 1) {
        return next(new CustomError.BadRequestError("Booking duration cannot be less than 1 day"));
    }

    //  calculate booking amount
    const calculatedBookingAmount = bookingDuration * rate * percent;

    // generate payment reference
    const paymentReference = `TAXIMANIA_${Math.floor(Math.random() * 1000000000) + 1}_${Date.now}`;

    return calculatedBookingAmount;

}

module.exports = calculateBookingAmount;