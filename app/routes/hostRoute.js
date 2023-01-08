const express = require('express');
const router = express.Router();
const permissions = require('../middlewares/permissions');
const {
    loadDashboard,
} = require('../controllers/pagesController.js');


router.get('/dashboard', permissions("HOST"), loadDashboard);

module.exports = router;
