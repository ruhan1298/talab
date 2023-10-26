var express = require('express');
var router = express.Router();
var Agent = require('../models/Agent')

/* GET home page. */

router.get('/detail/:id', async function(req, res, next) {
    const agentId = req.params.id;

    try {
        // Find the agent by ID
        const agent = await Agent.findByPk(agentId);
        console.log(agent,'agent................');

        if (!agent) {
            // Handle the case where no agent with the given ID is found
            res.status(404).send('Agent not found');
            return;
        }

        // Access the servicecharge data associated with the agent
        const servicecharge = agent.servicecharge;
        console.log(servicecharge,'charge.................');

        // Send the servicecharge data as a JSON response
        res.render('agentdetail',{servicecharge:servicecharge})
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router;
