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
const { sequelize, Sequelize } = require('../../models');

// ADMIN AUTHENTICATION

const registerAdmin = asyncWrapper(async (req, res, next) => {
    const result = await sequelize.transaction(async (t) => {
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
})

const verifyAdmin = asyncWrapper(async (req, res, next) => {
    const result = sequelize.transaction(async (t) => {
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
    const result = await sequelize.transaction(async (t) => {
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
})

const forgotPassword = asyncWrapper(async (req, res, next) => {
    const result = await sequelize.transaction(async (t) => {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        const temporarypassword = await generatePassword(12);
        const hashedPassword = await bcrypt.hash(temporarypassword, 10);
        const updated = await User.update({ password: hashedPassword }, { where: { email } }, { transaction: t });

        if (updated) {
            const mailOptions = {
                email: email,
                title: "TAXIMANIA Temporary Password",
                message: `Your temporary password is ${temporarypassword} `,
            };
            await sendMail(mailOptions);
            console.log(temporarypassword)
            res.status(200).json({ message: "Temporary password sent to email" });
        }
    })
})

const passwordreset = asyncWrapper(async (req, res, next) => {
    const result = await sequelize.transaction(async (t) => {
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

const logout = asyncWrapper(async (req, res, next) => {
    const result = await sequelize.transaction(async (t) => {
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
    const result = sequelize.transaction(async (t) => {
    const { firstname, lastname, username, email, password, address, phone, agedeclaration,terms } = req.body;
    // VALIDATE USER INPUT
    if (!username || !email || !password || !address || !phone || !agedeclaration || !terms || !firstname || !lastname) {
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
    const mailOptions = {
        email: email,
        title: "TAXIMANIA Verification Code",
        message: `Your verification code is ${verification_code} `,
    };
    await sendMail(mailOptions);
    res.status(200).json({
        message: "Welcome to Taximania, please check your email for your verification code",
        user,
    });
})
})

const verifyHost = asyncWrapper(async (req, res, next) => {
    const result = sequelize.transaction(async (t) => {
        const { email, verification_code } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        if (user.verification_code !== verification_code) {
            return next(new CustomError.BadRequestError("Invalid verification code"));
        }
        const updated = await User.update({ verification_code: null, status: "ACTIVE", role: "HOST" }, { where: { email } }, { transaction: t });
        if (updated) {
            res.status(200).json({ message: "Account verified successfully" });
        }
    })                                                                                                                                  
})

const resendverificationcode = asyncWrapper(async (req, res, next) => {
    const result = sequelize.transaction(async (t) => {
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
            const mailOptions = {
                email: email,
                title: "TAXIMANIA Verification Code",
                message: `Your verification code is ${verification_code} `,
            };
            await sendMail(mailOptions);
            res.status(200).json({ message: "Verification code sent successfully",});
        }
    })
})

        
const loginHost = asyncWrapper(async (req, res, next) => {
    const result = sequelize.transaction(async (t) => {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return next(new CustomError.BadRequestError("Email does not exist"));
        }
        if (user.role !== "HOST") {
            return next(new CustomError.BadRequestError("Please verify your account"));
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
    resendverificationcode,
    loginHost,
};