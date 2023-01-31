const db = require("../../models");
const User = db.User;
const Blacklist = db.Blacklist;
const UserData = db.UserData;
require('dotenv').config();
const authService = require("../utils/auth.service.js");
const asyncWrapper = require('../middlewares/async')
const { sendAdminVerificationMail,
    sendSuperAdminRequestMail,
    sendforgotPasswordMail,
    userVerificationMail,

 } = require("../utils/mailTemplates.js");

const generatePassword = require('../utils/StringGenerator.js');
const CustomError = require("../utils/customErrors.js");
const bcrypt = require('bcryptjs');
const { sequelize, Sequelize } = require('../../models');

// ADMIN AUTHENTICATION

const registerAdmin = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { fullName,username, email, password } = req.body;

        // generate code for verification
        let usercode = Math.floor(100000 + Math.random() * 90000);
        let admincode = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        const verification_code = await usercode.toString() + admincode.toString();

        // check if email and username already exists
        const userExist = await User.findOne({ where: { email } });
        const usernameExist = await User.findOne({ where: { username } });
        if (userExist) {
            return next(new CustomError.BadRequestError("Email already exists"));
        }
        if (usernameExist) {
            return next(new CustomError.BadRequestError("Username already exists"));
        }
        const user = await User.create({
            fullName,
            username,
            email,
            password,
            verification_code
        }, { transaction: t });   
        // delete verification code and user after 10 minutes
        
        setTimeout(async () => {
            if (user.verification_code !== null) {
                await User.update({ verification_code: '000' }, { where: { email } });
                // delete user if verification code is expired
                if (user.verification_code == "000") {
                    await User.destroy({ where: { verification_code: '000' } });
                }
            }
            else {
                return;
            }
        }, 600000);
        
        // send verification code to email
        await sendAdminVerificationMail(email, fullName, usercode);
        await sendSuperAdminRequestMail(process.env.SUPER_ADMIN_EMAIL, fullName, admincode);

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
})

const verifyAdmin = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
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
})

const loginAdmin = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        if (user.role !== "ADMIN") {
            return next(new CustomError.BadRequestError("User is not an admin"));    
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new CustomError.BadRequestError("Invalid password"));    
        }
        const REFRESH_TOKEN = await authService().issue_RefreshToken({
            id: user.id,
            email: user.email,
            role: user.role,
            timestamps: Date.now(),
        });
        const ACCESS_TOKEN = await authService().issue_AccessToken({
            id: user.id,
            email: user.email,
            role: user.role,
            rfshtkn: REFRESH_TOKEN,
            timestamps: Date.now(),
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
})

const forgotPassword = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        const temporarypassword = await generatePassword(12);
        const hashedPassword = await bcrypt.hash(temporarypassword, 10);
        const updated = await User.update({ password: hashedPassword }, { where: { email } }, { transaction: t });

        if (updated) {
            await sendforgotPasswordMail(email, temporarypassword);
            console.log(temporarypassword)
            res.status(200).json({ message: "Temporary password sent to email" });
        }
    })
})

const passwordreset = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email, password, password2 } = req.body;
        if (password !== password2) {
        return next(new CustomError.BadRequestError("Passwords do not match"));
        }   
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
            }
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();
        res.status(200).json({ message: "Password reset successful" });
    })
})

const passwordUpdate = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {  
        const { password, password1, password2 } = req.body;
        const { userId} = req.params;
        const user = await User.findOne({ where: { user_id: userId } });
        if (!user) {
            return next(new CustomError.BadRequestError("User does not exist"));
        }
        if (password1 !== password2) {
            return next(new CustomError.BadRequestError("Passwords do not match"));
        }
        // compare password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new CustomError.BadRequestError("Invalid password"));
        }
        const hashedPassword = await bcrypt.hash(password1, 10);
        user.password = hashedPassword;
        console.log(password1)
        await user.save();
        res.status(200).json({ message: "Password updated successfully" });
    })
})


const logout = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email, ACCESS_TOKEN, REFRESH_TOKEN } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        const deleted = await Blacklist.create({
            token: ACCESS_TOKEN,
            token: REFRESH_TOKEN,
        });
        if (deleted) {
            res.status(200).json({ message: "Logged out successfully" });
        }
    })
})

// VALIDATE TOKEN
const validateToken = async (req, res, next) => {
    if (!req.headers) { throw new CustomError.BadRequestError("No headers") }
    const blacklistedtoken = await Blacklist.findOne({ where: { token: req.headers.authorization } });
    if (blacklistedtoken) { throw new CustomError.UnauthorizedError("Token has been blacklisted");}

    const token = req.headers.authorization.split(" ")[1];
    if (!token) { return next(new CustomError.BadRequestError("No token"))}

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
const registerHost = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { firstname, lastname, username, email, password, address, phone, agedeclaration,terms, city, state, country } = req.body;
        // VALIDATE USER INPUT
        if (!username || !email || !password || !address || !phone || !agedeclaration || !terms || !firstname || !lastname || !city || !state || !country) {
            return next(new CustomError.BadRequestError("Please fill in all fields"));
        }
        if (agedeclaration !== "on") {
            return next(new CustomError.BadRequestError("You must be 18 years or older to register"));
        }
        if (terms !== "on") {
            return next(new CustomError.BadRequestError("You must agree to the terms and conditions"));
        }
        // check if email exists
        const emailAlreadyExists = await User.findOne({ where: { email } });
        if (emailAlreadyExists) {
            return next(new CustomError.BadRequestError("Email already exists"));
        }
        // check if username exists
        const usernameAlreadyExists = await User.findOne({ where: { username } });
        if (usernameAlreadyExists) {
            return next(new CustomError.BadRequestError("Username is taken"));
            // throw new CustomError.BadRequestError("Username is taken");
        }
        const fullName = firstname + " " + lastname;

        // GENERATE VERIFICATION CODE
        let usercode = Math.floor(100000 + Math.random() * 90000);
        const verification_code = await usercode.toString();
        // delete verification code and user after 10 minutes

        setTimeout(async () => {
            if (user.verification_code !== null) {
                await User.update({ verification_code: '000' }, { where: { email } });
            }
        }, 600000)

        // const role = "HOST"
        const user = await User.create({
            username, fullName, email, password, address, phone, agedeclaration, terms, verification_code
        }, { transaction: t });

        const userdata = await UserData.create({
            city, state, country, user_id: user.user_id
        }, { transaction: t }); 
        // SEND VERIFICATION CODE TO EMAIL
        await userVerificationMail(user.email, user.fullName, user.verification_code);
        res.status(200).json({
            message: "Welcome to Taximania, please check your email for your verification code",
            user,
            userdata
        });
    })
})

const verifyHost = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email, verification_code } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        if (user.verification_code !== verification_code) {
            return next(new CustomError.BadRequestError("Invalid verification code"));
        }
        const updated = await User.update({ verification_code: null, status: "ACTIVE" }, { where: { email } }, { transaction: t });
        if (updated) {
            res.status(200).json({ message: "Account verified successfully" });
        }
    })                                                                                                                                  
})

const resendverificationcode = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        if (user.status === "ACTIVE") {
            return next(new CustomError.BadRequestError("Account already verified"));
        }
        if (user.verification_code !== "000") {
            return next(new CustomError.BadRequestError("Verification code already sent"));
        }
        // GENERATE VERIFICATION CODE
        let usercode = Math.floor(100000 + Math.random() * 90000);
        let name = user.fullName;
        const verification_code = await usercode.toString();
        const updated = await User.update({ verification_code: verification_code }, { where: { email } }, { transaction: t });
        // delete verification code and user after 10 minutes
        setTimeout(async () => {
            if (user.verification_code !== null) {
                await User.update({ verification_code: '000' }, { where: { email } });
            }
            else {
                return;
            }
        }, 600000)

        if (updated) {
            await userVerificationMail(user.email, name, user.verification_code);   
            res.status(200).json({ message: "Verification code Resent successfully",});
        }
    })
})

        
const loginHost = asyncWrapper(async (req, res, next) => {
    await sequelize.transaction(async (t) => {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return next(new CustomError.BadRequestError("Invalid credentials"));
        }

        const loadUser = {
            id: user.id,
            email: user.email,
            role: user.role,
        }
        // store user in session
        req.session.user = user;
        
        // generate tokens
        const REFRESH_TOKEN =  authService().issue_RefreshToken( loadUser );
        const ACCESS_TOKEN =  authService().issue_AccessToken( loadUser ); 

        // attach tokens to cookie
        authService().attachCookiesToResponse( res, REFRESH_TOKEN);
        authService().attachCookiesToResponse( res, ACCESS_TOKEN);

        res.status(200).json({
            message: "Welcome to Taximania",
            user,
            REFRESH_TOKEN,
            ACCESS_TOKEN,
        });
    })
})

// const pagerefresh = asyncWrapper(async (req, res, next) => {
//     await sequelize.transaction(async (t) => {
//         const { REFRESH_TOKEN, ACCESS_TOKEN } = req.body;
//         // verify access token
//         const decoded = await authService().verify_AccessToken(ACCESS_TOKEN);
//         // check if access token is expired
//         if (decoded.exp < Date.now() / 1000) {
//             // verify refresh token
//             const decoded = await authService().verify_RefreshToken(REFRESH_TOKEN);
//             // check if refresh token is expired
//             if (decoded.exp < Date.now() / 1000) {
//                 return next(new CustomError.UnauthorizedError("Refresh token expired"));
//             }
//             // generate new access token
//             const loadUser = {
//                 id:


module.exports = {
    registerAdmin,
    verifyAdmin,
    loginAdmin,
    forgotPassword,
    passwordreset,
    passwordUpdate,
    logout,
    validateToken,
    registerHost,
    verifyHost,
    resendverificationcode,
    loginHost,

};