var multer = require("multer");
var path = require("path");
const uuid = require("uuid").v4;

// image store
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        console.log(req);
        cb(null, "upload_image");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const originalname = `${uuid()}${ext}`;
        cb(null, originalname);
    },
});

var upload_image = multer({ storage: storage });

module.exports = upload_image;