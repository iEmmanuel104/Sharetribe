// const got = require("got");
// import got from "got";

const FlutterwavePay = async (paydetails) => {

    try {
        const response = await got.post("https://api.flutterwave.com/v3/payments", {
            headers: {
                Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`
            },
            json: {
                tx_ref: paydetails.tx_ref,
                amount: paydetails.amount,
                currency: "NGN",
                redirect_url: paydetails.redirect_url,
                meta: {
                    vehicle_id: 23,
                    HostUser: paydetails.HostUser,
                    BookingId: paydetails.BookingId,
                    user_id: paydetails.user_id,
                },
                customer: {
                    email: paydetails.email,
                    phonenumber: paydetails.phonenumber,
                    name: paydetails.fullname
                },
                customizations: {
                    title: "Taximania Ride Payment",
                    logo: "https://res.cloudinary.com/drc6omjqc/image/upload/v1673672919/uploads/logo_rmflbu.png"
                }
            }
        }).json();
        console.log(response);
    } catch (err) {
        console.log(err.code);
        console.log(err.response.body);
    }
}

module.exports = FlutterwavePay;