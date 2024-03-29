const express = require('express');
const router = express.Router();
const permit = require('../middlewares/permissions');
const upload = require('../middlewares/multerobject');
const {
    registerVehicle,
    getuserVehicles,
    getAllVehicle, 
    getAll,  
    updateVehicle,
    // deleteVehicle,
    getVehicleById,
    searchVehicle,
    getVehicleImages,
    verifyVehicle
} = require('../controllers/vehicleControllers.js');
 
// vehicle routes
router.post('/register/:userId', permit("GUEST HOST"), upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'banner', maxCount: 1 }
]), registerVehicle);
router.get('/getall', getAllVehicle);
router.get('/all/vehicle', getAll);
router.get('/get/:userId', getuserVehicles);
router.get('/single/:vehicleId', getVehicleById);
router.get('/getimages/:userId/:vehicleId', getVehicleImages);
router.patch('/update/:userId/:vehicleId', updateVehicle);
router.delete('/delete/:userId/:vehicleId', permit("ADMIN HOST"), updateVehicle);
router.get('/search/:userId', searchVehicle);
router.patch('/verify/:vehicleId', permit("ADMIN"), verifyVehicle);


module.exports = router;