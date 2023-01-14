const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const {
    bookride,
    cancelbooking,
    approvebooking,
    getbooking
} = require('../controllers/bookingController.js');


router.post('/bookride/:userId/:vehicleId', permissions("GUEST HOST"), bookride);
router.post('/cancelbooking/:bookingId', permissions("GUEST HOST"), cancelbooking);
router.post('/approvebooking/:bookingId', permissions("GUEST HOST"), approvebooking);
router.get('/getbooking/:userId/:bookingId', permissions("GUEST HOST"), getbooking);

module.exports = router;
