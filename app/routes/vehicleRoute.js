const express = require('express');
const router = express.Router();
const permit = require('../middlewares/permissions');
const upload = require('../middlewares/multerobject');
const {
    registerVehicle,
    getuserVehicles,
    getAllVehicle,    
    updateVehicle,
    deleteVehicle,
    getVehicleById,
    searchVehicle,
    getVehicleImages,
    verifyVehicle
} = require('../controllers/vehicleControllers.js');
 
// vehicle routes
router.post('/register/:userId', permit("GUEST HOST"), upload.array("image", 5), registerVehicle);
router.get('/getall', getAllVehicle);
router.get('/get/:userId', getuserVehicles);
router.get('/single/:vehicleId', getVehicleById);
router.get('/getimages/:userId/:vehicleId', getVehicleImages);
router.patch('/update/:userId/:vehicleId', permit("ADMIN HOST"), upload.single('image'), updateVehicle);
router.delete('/delete/:userId/:vehicleId', permit("ADMIN HOST"), deleteVehicle);
router.get('/search/:userId', searchVehicle);
router.patch('/verify/:vehicleId', permit("ADMIN"), verifyVehicle);


module.exports = router;