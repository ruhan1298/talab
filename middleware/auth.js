module.exports = {
    isLoggedIn: function (req, res, next) {
      if (req.isAuthenticated()) {
        return next();
      }
      res.redirect("/Login");
    },
  
    isLoggedOut: function (req, res, next) {
      if (!req.isAuthenticated()) {
        return next();
      }
      res.redirect("/Login");
    },
  };
  