const express = require('express');
const router = express.Router();
const permit = require('../middlewares/permissions');
const upload = require('../middlewares/multerobject');
const {
    registerVehicle,
    getVehicle,
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    searchVehicle,
    getVehicleImages
} = require('../controllers/vehicleControllers.js');
 
// vehicle routes
router.post('/register/:userId', upload.array("image", 5), registerVehicle);
router.get('/get/:userId', getVehicle);
router.get('/get/:userId/:vehicleId', getVehicleById);
router.get('/getimages/:userId/:vehicleId', getVehicleImages);
router.put('/update/:userId/:vehicleId', upload.single('image'), updateVehicle);
router.delete('/delete/:userId/:vehicleId', deleteVehicle);
router.get('/search/:userId', searchVehicle);


