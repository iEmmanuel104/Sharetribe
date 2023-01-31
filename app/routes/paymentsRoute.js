const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const {
    updateAccountDetails,
    getAccountDetails,
    makeflutterwavepayment,
    verifyflutterwavepayment
} = require('../controllers/paymentsController.js');

router.get('/account', permissions("GUEST HOST"), getAccountDetails);
router.post('/account/:userId', permissions("GUEST HOST"), updateAccountDetails);
router.post('/makeflutterwavepayment/now/:bookingId/:userId', makeflutterwavepayment);
router.post('/verifyflutterwavepayment/:userId', permissions("GUEST HOST"), verifyflutterwavepayment);

module.exports = router;