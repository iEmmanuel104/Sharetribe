// const axios = require('axios');
// require('dotenv').config();

// const FlutterwavePay = (paydetails) => {
//     console.log(process.env.FLW_SECRET_KEY);

//     return axios
//         .post("https://api.flutterwave.com/v3/payments", {
//             headers: {
//                 Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
//             },
//             json: {
//                 tx_ref: paydetails.tx_ref,
//                 amount: paydetails.amount,
//                 currency: "NGN",
//                 redirect_url: process.env.FLW_REDIRECT_URL,
//                 meta: {
//                     vehicle_id: paydetails.vehicle_id,
//                     HostUser: paydetails.HostUser,
//                     BookingId: paydetails.BookingId,
//                     user_id: paydetails.user_id,
//                 },
//                 customer: {
//                     email: paydetails.email,
//                     phonenumber: paydetails.phone,
//                     name: paydetails.fullname
//                 },
//                 customizations: {
//                     title: "Taximania Ride Payment",
//                     logo: "https://res.cloudinary.com/drc6omjqc/image/upload/v1673672919/uploads/logo_rmflbu.png"
//                 }
//             }
//         })
//         .then((response) => {
//             console.log(response.response.data);
//             return response;
//         })
//         .catch((error) => {
//             console.log('this is error starts',error.response['data']);
//             return error;
//         });
// };

// module.exports = FlutterwavePay;
