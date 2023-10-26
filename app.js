var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var hbs =require('hbs')
var uuid = require('uuid')
var passport=require('passport')
var session=require('express-session')
var flash =require('flash')


// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');
var registerRouter= require('./routes/register')
var loginRouter= require('./routes/login')
var dashboardRouter= require('./routes/dashboard')
var addagentRouter= require('./routes/addagent')
var profileRouter= require('./routes/profile')
var agentdetailRouter= require('./routes/agentdetail')
var createinvoiceRouter = require('./routes/createinvoice')
var templateRouter= require('./routes/template')
var editagentRouter= require('./routes/editagent')
var invoiceRouter= require('./routes/invoice')
var userRouter = require('./routes/user')
var app = express();
var Admin=require('./models/Admin')

Admin.sync({alter:true})
var Template = require('./models/Template')
Template.sync({force:false})
var Agent= require('./models/Agent')
Agent.sync({alter:true})
var Invoice = require('./models/Invoice')
Invoice.sync({alter:true})

app.set('views',path.join(__dirname,'views'))
app.set('view engine', 'hbs');
// const partialsPath = (path.join(__dirname, "views/partials"))
// hbs.registerPartials(partialsPath)
hbs.registerPartials(path.join(__dirname + '/views/partials'));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/upload_image", express.static("upload_image"));


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
  }));
  require('./middleware/passport')(passport)
  
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
  console.log(req.user)
    res.locals.user = req.user;
    
    next();
  });
  app.use(function (req, res, next) {
    res.set(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    next();
  })
//   hbs.registerHelper('ne', function (a, b, options) {
//     return a !== b ? options.fn(this) : options.inverse(this);
// });
  
// app.use('/', indexRouter);
// app.use('/users', usersRouter);
app.use('/talab/register',registerRouter)
app.use('/talab/login',loginRouter)
app.use('/talab/dashboard',dashboardRouter)
app.use('/talab/addagent',addagentRouter)
app.use('/talab/profile',profileRouter)
app.use('/talab/agentdetail',agentdetailRouter)
app.use('/talab/createinvoice',createinvoiceRouter)
app.use('/talab/template',templateRouter)
app.use('/talab/editagent',editagentRouter)
app.use('/talab/invoice',invoiceRouter)
app.use('/talab/user',userRouter)


hbs.registerHelper('increment', function(index) {
  console.log(index + 1,"INCREMENT>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  return index + 1;
});
hbs.registerHelper('multiply', function(a, b) {
  return a * parseInt(b);
});
hbs.registerHelper('arrayLength', function(array) {
  return array.length;
});
module.exports = app;
