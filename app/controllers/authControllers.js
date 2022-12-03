const db = require("../../models");
const User = db.User;
const Blacklist = db.Blacklist;
require('dotenv').config();
const authService = require("../utils/auth.service.js");
const asyncWrapper = require('../middlewares/async')
const { sendMail } = require("../utils/sendMail.js");
const generatePassword = require('../utils/StringGenerator.js');
const CustomError = require("../utils/customErrors.js");
const bcrypt = require('bcryptjs');

// ADMIN AUTHENTICATION

const registerAdmin = asyncWrapper(async (req, res) => {
    const { fullName,username, email, password } = req.body;

    // generate code for verification
    let usercode = Math.floor(100000 + Math.random() * 90000);
    let admincode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const verification_code = await usercode.toString() + admincode.toString();

    // check if email already exists
    const userExist = await User.findOne({ where: { email } });
    if (userExist) {
        throw new CustomError.BadRequestError("Email already exists");
    }
    const user = await User.create({
        fullName,
        username,
        email,
        password,
        role,
        verification_code
    });   
    // delete verification code and user after 10 minutes
    setTimeout(async () => {
        if (user.verification_code !== null) {
            await User.update({ verification_code: '000' }, { where: { email } });
            // delete user if verification code is expired
            await User.destroy({ where: { verification_code: '000' } });
        } else {
            return;
        }
    }, 60000);
     
    // send verification code to email
    const mailOptions = {
        email: email,
        title: "TAXIMANIA Verification Code",
        message: `Your verification code is ${usercode}
        Please enter this code to verify your account, it will expire in 10 minutes`,
    };
    await sendMail(mailOptions);

    const mailOptions2 = {
        email: process.env.EMAIL_RECEIVER_ADDRESS,
        title: "TAXIMANIA Admin request Verification Code",
        message: `New Admin request for ${username}, with email ${email},
                --------------------------------------
                verification code is ${admincode}`,
    };
    await sendMail(mailOptions2);

    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };


    res.status(201).json({
        message: "User created, verification code sent to email, please verify",
        userData , code: verification_code
    });
})

const verifyAdmin = asyncWrapper(async (req, res) => {
    const { email, verification_code } = req.body;
    const user = await User.findOne({ where: { email }});
    switch (user.verification_code) {
        case verification_code:
            user.role = "ADMIN";
            user.verification_code = null;
            res.status(200).json({ message: "ADMIN verified" });                
            break;
        case '000':
            res.status(401).json({ message: "Verification code expired" });
            break;
        case null:
            res.status(401).json({ message: "User already verified" });
            break;   
        default:
            throw new CustomError.BadRequestError("Invalid verification code");           
    }
    await user.save();
})

const loginAdmin = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    // if (req.headers.authorization) {
    //     const blacklistedtoken = await Blacklist.findOne({ where: { token : req.headers.authorization } });
    //     if (blacklistedtoken) {
    //         throw new CustomError.UnauthorizedError("Token has been blacklisted");
    //     }
    // }

    if (!user) {
        throw new CustomError.BadRequestError("Email does not exist");
    }
    if (user.role !== "ADMIN") {
        throw new CustomError.BadRequestError("You are not an admin");
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new CustomError.BadRequestError("Invalid password");
    }
    const REFRESH_TOKEN = await authService().issue_RefreshToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    const ACCESS_TOKEN = await authService().issue_AccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };      
    res.status(200).json({
        message: "Admin logged in successfully",
        userData,
        REFRESH_TOKEN,
        ACCESS_TOKEN,
    });
})

const forgotPassword = asyncWrapper(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new CustomError.BadRequestError("Email does not exist");
    }
    const temporarypassword = await generatePassword();
    const updated = await User.update({ password: temporarypassword }, { where: { email } });

    if (updated) {
        const mailOptions = {
            email: email,
            title: "TAXIMANIA Temporary Password",
            message: `Your temporary password is ${temporarypassword} `,
        };
        await sendMail(mailOptions);
        res.status(200).json({ message: "Temporary password sent to email" });
    }
})

const passwordreset = asyncWrapper(async (req, res) => {
    const { email, password, password2 } = req.body;
    if (password !== password2) {
        throw new CustomError.BadRequestError("Passwords do not match");
    }   
    const user = await User.findOne({ where: { email } });

    if (!user) {
        throw new CustomError.BadRequestError("Email does not exist");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password reset successful" });
})

const logout = asyncWrapper(async (req, res) => {
    const { email, ACCESS_TOKEN, REFRESH_TOKEN } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new CustomError.BadRequestError("Email does not exist");
    }
    const deleted = await Blacklist.create({
        token: ACCESS_TOKEN,
        token: REFRESH_TOKEN,
    });
    if (deleted) {
        res.status(200).json({ message: "Logged out successfully" });
    }
})

// VALIDATE TOKEN
const validateToken = async (req, res) => {
    if (!req.headers) { throw new CustomError.BadRequestError("No headers") }
    const blacklistedtoken = await Blacklist.findOne({ where: { token: req.headers.authorization } });
    if (blacklistedtoken) { throw new CustomError.UnauthorizedError("Token has been blacklisted");}

    const token = req.headers.authorization.split(" ")[1];
    if (!token) { throw new CustomError.BadRequestError("No token") }

    const response = authService().verify_AccessToken(token, (err, decoded) => {
        if (err) { return err }
        return decoded
    });

    if (response instanceof Error && response.name === "invalid signature") {
        authService().verify_Refreshoken(token, (err, decoded) => {
            if (err) { res.status(401).json({ message: "Invalid refresh token" }) }

            const ACCESS_TOKEN = authService().issue_AccessToken({
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            });
            res.status(200).json({
                message: "Token refreshed",
                ACCESS_TOKEN,
            });
        });
    }

    if (response instanceof Error) { throw response }

    res.status(200).json({ message: "Token is valid" });
}

// HOST/USER AUTHENTICATION
const registerHost = asyncWrapper(async (req, res) => {
    const { username, email, password, role, address, phone, agedeclaration,terms } = req.body;
    // VALIDATE USER INPUT
    if (!username || !email || !password || !role || !address || !phone || !agedeclaration || !terms) {
        throw new CustomError.BadRequestError("Please fill in all fields");
    }
    if (password.length < 6) {
        throw new CustomError.BadRequestError("Password must be at least 6 characters");
    }
    if (role !== "HOST") {
        throw new CustomError.BadRequestError("You are not a host");
    }
    if (agedeclaration !== "true") {
        throw new CustomError.BadRequestError("You must be 18 years or older to register");
    }
    if (terms !== "true") {
        throw new CustomError.BadRequestError("You must agree to the terms and conditions");
    }
    // check if email exists
    const emailAlreadyExists = await User.findOne({ where: { email } });
    if (emailAlreadyExists) {
        throw new CustomError.BadRequestError("Email already exists");
    }
    let usercode = Math.floor(100000 + Math.random() * 90000);
    const verification_code = await usercode.toString();
    const user = await User.create({
        username, email, password, role, address, phone, agedeclaration, terms, verification_code
    });
    const mailOptions = {
        email: email,
        title: "TAXIMANIA Verification Code",
        message: `Your verification code is ${verification_code} `,
    };
    await sendMail(mailOptions);
    res.status(200).json({
        message: "Welcome to Taximania, please check your email for your verification code",
        user,
        REFRESH_TOKEN,
        ACCESS_TOKEN,
    });
})

const verifyHost = asyncWrapper(async (req, res) => {
    const { email, verification_code } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new CustomError.BadRequestError("Email does not exist");
    }
    if (user.verification_code !== verification_code) {
        throw new CustomError.BadRequestError("Invalid verification code");
    }
    const updated = await User.update({ status: "ACTIVE" }, { where: { email } });
    if (updated) {
        res.status(200).json({ message: "Account verified successfully" });
    }
})
        
const loginHost = asyncWrapper(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new CustomError.BadRequestError("Email does not exist");
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        throw new CustomError.BadRequestError("Invalid credentials");
    }
    const REFRESH_TOKEN = await authService().issue_RefreshToken({
        id: user.id,
        email: user.email,
        role: user.role,
    });
    const ACCESS_TOKEN = await authService().issue_AccessToken({
        id: user.id,
        email: user.email,
        role: user.role,
    }); 
    res.status(200).json({
        message: "Welcome to Taximania",
        user,
        REFRESH_TOKEN,
        ACCESS_TOKEN,
    });
})

module.exports = {
    registerAdmin,
    verifyAdmin,
    loginAdmin,
    forgotPassword,
    passwordreset,
    logout,
    validateToken,
    registerHost,
    verifyHost,
    loginHost,
};