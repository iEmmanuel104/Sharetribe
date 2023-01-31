const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const fs = require('fs');
const sharp = require('sharp'); 

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadtocloudinary = (filepath, details) => {
    try {
        const options = {
            use_filename: true,
            folder: `Taximania/${details.user}/${details.folder}`,
            public_id: details.name,
        };
        return cloudinary.uploader.upload(filepath, options)
        .then((result) => {
            // assign the result to a variable
            let cloudinaryResult = result;
            // delete the file from the server
            // fs.unlinkSync(filepath)
            return { message: 'success', url: cloudinaryResult.secure_url }
        })
    } catch (error) {
        console.log(error);
        fs.unlinkSync(filepath)
        return { message: 'error', error: error }
    }
};

const uploadresizeToCloudinary = async (filepath, details) => {
    try {
        const image = sharp(filepath);
        const resizedImage = await image.resize({ width: 200, height: 200 }).toBuffer();
        const options = {
            use_filename: true,
            folder: `Taximania/${details.user}/${details.folder}`,
            public_id: details.name,
        };

        const result = await cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                throw new Error(error);
            }
            fs.unlinkSync(filepath);
            return result;
        }).end(resizedImage);

        return { message: 'success', url: result.secure_url };
    } catch (error) {
        console.log(error);
        fs.unlinkSync(filepath);
        return { message: 'error', error: error };
    }
};


module.exports = {
    uploadtocloudinary,
    uploadresizeToCloudinary,
};
