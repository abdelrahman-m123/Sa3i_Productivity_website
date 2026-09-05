const multer = require("multer");
const path = require("path");

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const filename = `user-${Date.now()}.${ext}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const imageType = file.mimetype.split("/")[0];
  if (imageType === "image") {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed!"), false);
};

const upload = multer({ storage: diskStorage, fileFilter });

module.exports = upload;
