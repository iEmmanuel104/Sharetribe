// const FlutterwavePay = require('../utils/flutterwavePay.js'); 
// const CustomError = require("../utils/customErrors.js"); 

// const makepayment = async (booking, user) => {
//     const { bookingAmount, paymentReference, vehicle_id, hostuser, bookingId, user_Id } = booking;
//     const { email, phone, fullName } = user;
//     const paydetails = {
//         amount: bookingAmount,
//         email,
//         phone,
//         fullName,
//         tx_ref: paymentReference,
//         vehicle_id,
//         HostUser: hostuser,
//         BookingId: bookingId,
//         user_Id
//     }
//     const payment = await FlutterwavePay(paydetails);
//     console.log('payment response',payment)

//     return payment;
// }

// module.exports = makepayment;