var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('../middleware/multer');
const Admin= require('../models/Admin')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('register');
});
router.post('/register',multer.single('image'),async function(req, res, next) {

  const defaultImage = "/upload_image/default.png";
  try {
    const { email, password, firstname,lastname ,phonenumber, profileImages,role } = req.body; // Extract role from req.body
    console.log(req.body,'body....................');

    // Check if the email already exists in the Admin table
    const existingUser = await Admin.findOne({ where: { email } });
    if (existingUser) {
      return res.status(201).json({ status: 0, message: "Email Already Exists" });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin record in the Admin table
    const admin = await Admin.create({
      email,
      password: hashedPassword,
      firstname,
      lastname,
      phonenumber,
      profileImages: defaultImage,
      role // Include the role field in the create call
    });

    console.log(admin, "ADMIN>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
res.redirect('/login')
  } catch (error) {
    console.error(error);

  }
})


module.exports = router;
