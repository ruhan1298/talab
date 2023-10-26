var express = require('express');
var router = express.Router();
var Template = require('../models/Template');
/* GET home page. */
router.get('/', async function(req, res, next) {
    try {
      const gettemplate = await Template.findAll({
        attributes: ['template_name', 'is_active'] // Replace 'field1' and 'field2' with the actual field names you want to retrieve
      });
  
      console.log(gettemplate, 'temp........');
      res.render('template', { gettemplate: gettemplate });
    } catch (error) {
      // Handle errors here, e.g., log the error and render an error page.
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
router.post('/addtemplate', async (req, res) => {
    try {
        const { template, template_name } = req.body;
        // Convert 'is_active' string to boolean
        const is_active = req.body.is_active === 'on';

        console.log(req.body, 'body........................');

        // Create a new template record
        const createdTemplate = await Template.create({
            template,
            is_active,
            template_name,
        });
res.redirect('/template')
    } catch (error) {
        console.error('Error adding template:', error);
        res.status(500).json({ error: 'Failed to add template' });
    }
});


module.exports = router;
