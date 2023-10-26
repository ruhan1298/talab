var express = require('express');
var router = express.Router();
var {isLoggedIn}= require('../middleware/auth');
var Agent= require('../models/Agent')

/* GET home page. */
router.get('/', isLoggedIn, async function(req, res, next) {
    const userId = req.user.id; // Assuming this is the user's ID
    console.log(userId,'id.....user');


    getagent = await Agent.findAll();

    res.render('addagent', {
      getagent: getagent,
 
    });
    // console.error('Error:', error.message); // Log the error message
    // next(error); // Pass the error to the next middleware or error handler
});

router.post('/add-agent', async (req, res, next) => {
    try {
        const { firstname, lastname, address,phonenumber,gst,  'country[]': countries, 'price[]': prices ,city,email} = req.body;

        // Create an array of servicecharge objects by iterating through countries and prices
        const servicecharge = countries.map((country, index) => ({
            country,
            price: prices[index]
        }));

        const agentData = {
            firstname,
            lastname,
            phonenumber,
            address,
            gst,
            city,
            email,

            servicecharge
        };

        console.log(agentData, 'req.............');

        const agent = await Agent.create(agentData);
        res.redirect('/talab/addagent');
    } catch (error) {
        console.log(error);
    }
});


router.post('/agentdele/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const deletedRows = await Agent.destroy({
        where: { id }
      });
  
      if (deletedRows > 0) {
        res.redirect('/talab/addagent')
      } else {
        res.status(404).json({ error: 'Team not found' });
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
module.exports = router;
