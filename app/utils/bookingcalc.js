const crypto = require('crypto');
const calculateBookingAmount = (bookdetails) => {

    const { startDate, endDate, fromLocation, toLocation, rate, vehiclepickup } = bookdetails;

    let percent;

    // if location is different from host location, add 5% of the total amount to the booking amount
    if (fromLocation !== vehiclepickup || toLocation !== fromLocation) {
        percent = 1.05;
    } else {
        percent = 1;
    }

    //calculate booking duration in hours 
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffHrs = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    //  calculate booking amount
    const calculatedBookingAmount = diffHrs * rate * percent;
    // reduce to 2 decimal places
    const bookingAmount = calculatedBookingAmount.toFixed(2);

    // generate payment reference
    const paymentReference = `TAXIMANIA_${crypto.randomBytes(8).toString('hex')}`;

    const data = {
        bookingDuration: diffHrs,
        bookingAmount,
        paymentReference
    };

    return data;
}

module.exports = calculateBookingAmount;