const {sendMail} = require("../utils/sendMail.js");

const sendAdminVerificationMail = async (email, name, verificationCode ) => {
    const mail_data = {
        email: email,
        title: "TAXIMANIA Admin Verification",
        message: `Hi ${name},\n\nPlease verify your email by using the code below\n\nVerification Code: ${verificationCode}\n\n NOTE: This code expires in 10 minutes\n\nRegards,\nTAXIMANIA Team`,
    };
    return await sendMail(mail_data);
}

const sendSuperAdminRequestMail = async (email, name, verificationCode ) => {
    const mail_data = {
        email: email,
        title: "TAXIMANIA Admin Request Verification",
        message: `New Admin Request from ${name},\n\nPlease provide the verification code below to the user\n\nVerification Code: ${verificationCode}\n\n NOTE: This code expires in 10 minutes\n\nRegards,\nTAXIMANIA Team`,
    };
    return await sendMail(mail_data);
}

const sendforgotPasswordMail = async (email, temporarypassword ) => {
    const mail_data = {
        email: email,
        title: "TAXIMANIA Password reset",
        message: `Hi,\n\nPlease use the temporary password below to login to your account\n\nTemporary Password: ${temporarypassword}\n\n NOTE: Please change your password after login\n\nRegards,\nTAXIMANIA Team`,
    };
    return await sendMail(mail_data);
}

const userVerificationMail = async (email, name, verificationCode ) => {
    const mail_data = {
        email: email,
        title: "TAXIMANIA Verification Code",
        message: `Hi ${name},\n\nPlease verify your email by using the code below\n\nVerification Code: ${verificationCode}\n\n NOTE: This code expires in 10 minutes\n\nRegards,\nTAXIMANIA Team`,
    };
    return await sendMail(mail_data);
}

const vehicleRegristrationMail = async (email, name, vehicleNumber ) => {
    const mail_data = {
        email: email,
        title: "TAXIMANIA Vehicle Registration",
        message: `Hi ${name},\n\nYour vehicle with number plate ${vehicleNumber} has been registered successfully\n\nRegards,\nTAXIMANIA Team`,
    };
    return await sendMail(mail_data);
}

const verifiedvehicleMail = async (email, name, vehicleNumber ) => {
    const mail_data = {
        email: email,
        title: "TAXIMANIA Vehicle Verification",
        message: `Hi ${name},\n\nYour vehicle with number plate ${vehicleNumber} has been verified successfully\n\n You can now start receiving bookings once you make your vehicle available\n\nRegards,\nTAXIMANIA Team`,
    };
    return await sendMail(mail_data);
}








module.exports = {
    sendAdminVerificationMail,
    sendSuperAdminRequestMail,
    sendforgotPasswordMail,
    userVerificationMail,
    vehicleRegristrationMail,
    verifiedvehicleMail
};
