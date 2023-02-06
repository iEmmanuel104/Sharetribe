const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const { 
    validateToken,
    forgotPassword,
    passwordreset,
    passwordUpdate,
    logout,
    registerHost,
    verifyHost,
    resendverificationcode,
    loginHost

 } = require('../controllers/authControllers.js');

//  ADMIN AUTH
router.post('/validate', validateToken);
router.post('/forgotpassword', forgotPassword);
router.post('/passwordreset',permissions("ADMIN"), passwordreset);
router.post('/passwordupdate/:userId',permissions("GUEST HOST ADMIN"), passwordUpdate);
router.post('/logout', logout);
router.post('/signup', registerHost);
router.post('/verify', verifyHost );
router.post('/resendverificationcode', resendverificationcode);
router.post('/signin', loginHost)



module.exports = router;