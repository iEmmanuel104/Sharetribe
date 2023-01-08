const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const {
    bookride,
    cancelbooking,
} = require('../controllers/bookingController.js');


router.post('/bookride/:userId/:vehicleId', permissions("GUEST HOST"), bookride);
router.post('/cancelbooking/:bookingId', permissions("GUEST HOST"), cancelbooking);

module.exports = router;
