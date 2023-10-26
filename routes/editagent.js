var express = require('express');
var router = express.Router();
var Agent = require('../models/Agent')

/* GET home page. */
// In your Express.js route for editing an agent
router.get('/:id', async (req, res) => {
    try {
        const agentId = req.params.id;
        const agentData = await Agent.findByPk(agentId);

        if (!agentData) {
            return res.status(404).send('Agent not found');
        }

        // Parse the servicecharge JSON data
        const serviceChargeData = JSON.parse(agentData.servicecharge);

        res.render('editagent', {
            title: 'Edit Agent',
            agentData,
            serviceChargeData, // Pass the parsed data to your view
        });
    } catch (error) {
        console.error('Error fetching agent data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/update-agent/:id', async (req, res, next) => {
    try {
        const agentIdToUpdate = req.params.id; // Get the agent ID from the URL parameter
        console.log(agentIdToUpdate, 'id......................');
        const { firstname, lastname, address, phonenumber,gst, 'country[]': countries, 'price[]': prices,email,city } = req.body;
        console.log(req.body, 'body...................');

        // Prepare the updated agent data
        const updatedAgentData = {
            firstname,
            lastname,
            phonenumber,
            address,
            gst,
            email,
            city,
            servicecharge: countries.map((country, index) => ({
                country,
                price: prices[index]
            }))
        };

        // Update the agent by ID
        const [updatedRowCount, updatedAgents] = await Agent.update(updatedAgentData, {
            where: { id: agentIdToUpdate },
            returning: true, // This option returns the updated agent(s)
        });

        res.redirect('/talab/addagent'); // Redirect to a suitable URL after updating

    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).send('Internal server error');
    }
});


module.exports = router;
