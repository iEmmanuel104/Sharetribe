const multer = require("multer");

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only images.", false);
  }
};

var storage = multer.diskStorage({
  destination: "images",
  filename: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return cb(new Error("Please upload an image."));
    }
    cb(null, `${Date.now()}_Taximania_${file.originalname}`);
    },
});


var uploadFile = multer({ storage: storage, fileFilter: imageFilter });
module.exports = uploadFile;




