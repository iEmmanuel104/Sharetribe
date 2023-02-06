const express = require('express');
const router = express.Router();
const permissions = require('../../middlewares/permissions');
const {
    registerAdmin,
    verifyAdmin,
    loginAdmin,
} = require('../../controllers/authControllers.js');

//  ADMIN AUTH
router.post('/admin/register', registerAdmin);
router.post('/admin/verify', verifyAdmin);
router.post('/admin/login', loginAdmin);

module.exports = router;