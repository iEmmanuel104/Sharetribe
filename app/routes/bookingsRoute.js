const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const {
    bookride,
    cancelbooking,
    approvebooking,
    getbooking,
    rateride
} = require('../controllers/bookingController.js');


router.post('/bookride/:userId/:vehicleId', permissions("GUEST HOST"), bookride);
router.post('/cancel/booking/:bookingId/:userId', cancelbooking);
router.post('/approvebooking/:bookingId/:userId', approvebooking);
router.get('/getbooking/:userId/:bookingId', permissions("GUEST HOST"), getbooking);
router.post('/rateride/:bookingId', permissions("GUEST HOST"), rateride);

module.exports = router;
