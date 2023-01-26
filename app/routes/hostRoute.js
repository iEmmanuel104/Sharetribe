const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const {
    loadDashboard,
    profiledata,
    suggestvehicle,
    getallusers
} = require('../controllers/pagesController.js');

// SET all router permissions here
// router.use(permissions("GUEST HOST"));

router.get('/dashboard', loadDashboard);
router.get('/profile/:userId', profiledata);
router.post('/slidevehicle/:userId', suggestvehicle);
router.get('/getallusers', getallusers);

module.exports = router;
