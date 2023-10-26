var express = require('express');
var router = express.Router();
var Admin= require('../models/Admin')
var Agent= require('../models/Agent')
var Invoice= require('../models/Invoice')
var {isLoggedIn}= require('../middleware/auth');

/* GET home page. */
router.get('/',isLoggedIn, async function(req, res, next) {
  const userId = req.user.id; // Assuming this is the user's ID
console.log(userId,'userdd');
  const role = req.user.role;
  const isAdmin = role === 'admin';
  const isSubadmin = role === 'subadmin';
   const UserCount = await Admin.count({
    where:{
      role:'subadmin'
    }
   })
   const AgentCOunt= await Agent.count()
const InvoiceCount= await Invoice.count()

  res.render('dashboard',{UserCount:UserCount,AgentCOunt:AgentCOunt,InvoiceCount:InvoiceCount,   isAdmin: isAdmin,
    isSubadmin: isSubadmin,});
});

module.exports = router;
