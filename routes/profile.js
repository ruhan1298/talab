var express = require('express');
var router = express.Router();
var multer = require('../middleware/multer')
var Admin = require('../models/Admin')
const bcrypt = require('bcryptjs')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('profile');
});
router.post('/update-profile', multer.single('profileImages'), async (req, res) => {
  try {
    const id = req.user.id;
    const firstname = req.body.firstname
    const lastname = req.body.lastname
    const phonenumber = req.body.phonenumber
    const email = req.body.email
    console.log(firstname,'firstname');
    let profileImages;
    if (req.file) {
      profileImages = req.file.path;
    }

    // Update the user's data
    await Admin.update(
      { firstname, lastname, email, phonenumber, profileImages },
      { where: { id: id } }
    );

    const user = await Admin.findByPk(id);

    res.redirect("/talab/profile");
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: 0, message: error.message });
  }
});
router.post("/changepass", async (req, res, next) => {
  const oldPassword = req.body.old_pass;
  const newPassword = req.body.new_pass;
  const confirmPassword = req.body.conf_pass;
  const userId = req.user.id;

  try {
    // Find the user by ID
    const user = await Admin.findByPk(userId);

    if (!user) {
      // Handle the case where no user with the given ID is found
      res.status(404).send('User not found');
      return;
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (isPasswordValid) {
      if (newPassword === confirmPassword) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        await user.update({ password: hashedPassword });

        console.log("Password updated successfully");
        res.redirect('/talab/profile');
      } else {
        console.log("New password and confirmation password do not match");
        // Handle the case where new password and confirmation password do not match
        res.status(400).send("New password and confirmation password do not match");
      }
    } else {
      console.log("Old password is incorrect");
      // Handle the case where the old password is incorrect
      res.status(401).send("Old password is incorrect");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 0, message: error.message });
  }
});



module.exports = router;
