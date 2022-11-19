require('dotenv').config();

const nodemailer = require("nodemailer"),
    config = process.env

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        type: "OAuth2",
        user: config.EMAIL_HOST_ADDRESS,
        clientId: config.OAUTH_CLIENT_ID,
        clientSecret: config.OAUTH_CLIENT_SECRET,
        refreshToken: config.OAUTH_REFRESH_TOKEN,
        accessToken: config.OAUTH_ACCESS_TOKEN
    }
});

function mailOptions(email_address, subject, message) {
    return {
        from: config.EMAIL_HOST_ADDRESS,
        to: email_address,
        subject: subject,
        text: message
    };
}

const sendMail = async (mail_data) => {
    return new Promise(async (resolve, reject) => {
        try {
            let user_mail_option = mailOptions(
                mail_data.email,
                mail_data.title,
                mail_data.message
            );

             transporter.sendMail(user_mail_option, (error, info) => {
                if (error) {
                    console.log(error)
                    resolve(error)
                } else { resolve(info) }
            });

        } catch (error) {
            console.log(error)
        }
    })

}

module.exports = {
    sendMail,
};