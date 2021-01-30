var express = require('express'),
  mongoose = require('mongoose'),
  bodyparser = require('body-parser'),
  passport = require('passport'),
  localStratergy = require('passport-local'),
  expressSession = require('express-session'),
  passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');
app = express();
var JSAlert = require('js-alert');
const { title } = require('process');
//agora
var appID = 'fdbf45f5680c48608931b479ffa21eff';
//user model
var userSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  email: String,
  mobile: String,
  age: String,
  friend: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  latitude: Number,
  longitude: Number
});

var RemSchema = new mongoose.Schema({
  username: String,
  title: String,
  Description: String,
  date: { day: Number, month: Number, year: Number },
  time: { hr: Number, min: Number },
});

userSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', userSchema);
var reminder = mongoose.model('reminder', RemSchema);

const PORT = process.env.PORT || 3000;
const URL = process.env.DATABASEURL || 'mongodb://localhost:27017/hobby';
mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static('public'));
app.use(
  expressSession({
    secret: 'hackmol it it',
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(userInfo);

passport.use(new localStratergy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

function userInfo(req, res, next) {
  res.locals.currentUser = req.user;
  next();
}




app.listen(PORT, function () {
  console.log('App has started');
});
