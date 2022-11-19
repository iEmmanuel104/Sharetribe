const multer = require("multer");
const uploadtocloudinary = require('../middlewares/cloudinary').uploadtocloudinary;


const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

var storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Please upload an image."));
    }
    cb(null, `${Date.now()}_Taximania_${file.originalname}`);
    },
});

var uploadFile = multer({ 
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, 
  fileFilter: imageFilter });

  module.exports = uploadFile;




