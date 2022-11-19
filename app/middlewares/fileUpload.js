const multer = require("multer");
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    }
});

const upload = multer({ storage: storage });

exports.upload = async (req, res) => {
    const result = await cloudinary.uploader.upload(req.files.image.tempFilePath, {
        use_filename: true,
        folder: 'uploads'
    });
    fs.unlinkSync(req.files
        .image.tempFilePath);
    return res.status(200).json({ image: { src: result.secure_url } });
};

exports.uploadFile = upload.single("image");