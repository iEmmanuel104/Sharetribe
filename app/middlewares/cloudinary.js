const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadtocloudinary = (filepath) => {
    const options = {
        use_filename: true,
        folder: 'uploads'
    };
    try {
        const result = cloudinary.uploader.upload(filepath, options);
        console.log(result);
        return result; 
        // return result.public_id;
    } catch (error) {
        console.log(error);
        return error;
    }
};

module.exports = {
    uploadtocloudinary
};
