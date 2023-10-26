var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');
const Admin= require('../models/Admin')
var {isLoggedIn}= require('../middleware/auth');

/* GET home page. */
router.get('/',isLoggedIn, async function(req, res, next) {

    try {
        const subadd = await Admin.findAll({
            where: {
                role: 'subadmin' // Filter by the role field with value 'subadmin'
            }
        });
     console.log(subadd,'role.............');
        res.render('user', { subadd: subadd });
    } catch (error) {
        // Handle the error appropriately
        res.status(500).send('An error occurred');
    }
  });

router.post('/create-user', async (req, res) => {
    const defaultImage = "/upload_image/default.png";

  try {
      const { email, firstname ,lastname,phonenumber,profileImages,password} = req.body;
        // const password = crypto.randomBytes(8).toString('hex');   
           const hashedPassword = await bcrypt.hash(password, 10);




      const sub = await Admin.create({
          email: email,
          password: hashedPassword,
          firstname,
          lastname,
          phonenumber,
          profileImages:defaultImage,
          role:"subadmin"
      });

   


      res.redirect('/user');
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred' });
  }
});


module.exports = router;
