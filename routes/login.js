const express =require('express')
var router = express.Router();
const session = require('express-session');
const passport =require('passport')
var Admin = require('../models/Admin')
// const session = require('express-session');
router.get('/',function (req, res,next) {
    res.render('login')
})
router.post("/auth", (req, res, next) => {
    passport.authenticate("local", {
      successRedirect:  "/talab/dashboard",
      failureRedirect: "/talab/Login",
      
    })(req, res, next);
  });
  router.get("/logout", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect( "/talab/login");
    });
  });

module.exports= router;