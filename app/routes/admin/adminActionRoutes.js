const express = require('express');
const router = express.Router();
const permissions = require('../../middlewares/permissions');
const {
    getAdminDashboardData,
    AccountDocsVerify,
    vehicleverify
} = require('../../controllers/adminController.js');

//  ADMIN AUTH
router.get('/admin/dashboard', getAdminDashboardData);
router.post('/admin/accountverify/:UserId', AccountDocsVerify);
router.post('/admin/vehicleverify/:VehicleId', vehicleverify);


module.exports = router;