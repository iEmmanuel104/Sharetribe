const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const upload = require('../middlewares/multerobject');

const {
    loadDashboard,
    profiledata,
    suggestvehicle,
    getallusers,
    checkoutpagedata,
    ridedetailspageData,
    updateuserprofile,
    submitverificationDoc,
    uploadprofileimage
} = require('../controllers/pagesController.js');


// SET all router permissions here
// router.use(permissions("GUEST HOST"));

router.get('/dashboard',permissions("GUEST HOST"), loadDashboard);
router.get('/profile/:userId',permissions("GUEST HOST"), profiledata);
router.post('/slidevehicle', suggestvehicle);
router.get('/getallusers',permissions("GUEST HOST"), getallusers);
router.get('/checkoutpage/data/:bookingId/:userId', checkoutpagedata);
router.get('/ridedetails/info/:bookingId/:userId', ridedetailspageData);
router.post('/updateprofile/:userId', updateuserprofile);
router.post('/verificationdoc/:userId',upload.array("docs", 8), submitverificationDoc);
router.post('/uploadprofileimage/:userId',upload.single("profileimage"), uploadprofileimage);


module.exports = router;
