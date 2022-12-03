const express = require('express');
const router = express.Router();
const { 
    registerAdmin,
    verifyAdmin,
    loginAdmin,
    validateToken,
    forgotPassword,
    passwordreset,
    logout

 } = require('../controllers/authControllers.js');

router.post('/admin/register', registerAdmin);
router.post('/admin/verify', verifyAdmin);
router.post('/admin/login', loginAdmin);
router.post('/validate', validateToken);
router.post('/forgotpassword', forgotPassword);
router.post('/passwordreset', passwordreset);
router.post('/logout', logout);
module.exports = router;