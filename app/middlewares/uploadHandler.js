const uploadHandler = (req, res, next) => {
  req.validationErrors = () => {
    const validationErrors = [];
    // check for file upload errors
    if (!req.files) {
      validationErrors.push({
        param: 'files',
        msg: 'Error: No files were uploaded'
      });
    }
    if (req.files.length === 0) {
      validationErrors.push({
        param: 'files',
        msg: 'Error: No files were uploaded'
      });
    }
    req.files.forEach(file => {
      if (file.size > 5000000) {
        validationErrors.push({
          param: 'files',
          msg: 'Error: File size must be less than 5 MB'
        });
      }
      if (!file.mimetype.startsWith('image')) {
        validationErrors.push({
          param: 'files',
          msg: 'Error: Only image files are allowed'
        });
      }
    });

    if (validationErrors.length > 0) {
      return validationErrors;
    } else {
      return null;
    }
  };
  next();
};

module.exports = uploadHandler;