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
  sentreq: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  receivereq: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  latitude: Number,
  longitude: Number,
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

//Mail system
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'adevcodea@gmail.com',
    pass: 'Tushar1999@&',
  },
});

//Reminder Code
setInterval(function () {
  let dat = new Date();

  reminder.find(
    {
      'date.day': dat.getDate(),
      'date.month': dat.getMonth() + 1,
      'date.year': dat.getFullYear(),
      'time.hr': { $lte: dat.getHours() + 1 },
    },
    function (err, result) {
      if (err) {
        console.log(err);
      } else {
        //send an email to persons in array of result

        for (let i = 0; i < result.length; i++) {
          User.findOne({ oid: result[i].oid }, function (err, res) {
            if (err) console.log(err);
            else {
              var mailoptions = {
                from: 'adevcodea@gmail.com',
                to: res.email,
                subject: 'Hobby Matcher Reminder',
                text: `Hi  ${res.name}. Your reminder is up for today at Hrs: ${result[i].time.hr}, Min:${result[i].time.min} for the event titled${result[i].title}`,
              };
              transporter.sendMail(mailoptions, function (err, resp) {
                if (err) console.log(err);
                else console.log('Email sent' + resp.response);
              });
            }
          });
          //delete that reminder with the help of id of the record found
          reminder.deleteOne({ _id: result[i]._id }, function (per, pes) {
            if (per) console.log(per);
          });
        }
      }
    }
  );
}, 120000);

app.get('/', function (req, res) {
  res.render('login');
});

app.get('/rejectreq/:id',function(req,res){
  User.findByIdAndUpdate(req.user._id,{$pull:{receivereq:req.params.id}},function(err){
    if(err)
    return console.log(err)
  })
  User.findByIdAndUpdate(req.params.id,{$pull:{sentreq:req.user._id}},function(err){
    if(err)
    return console.log(err)
  })
  res.redirect('/friends')
})
app.get('/acceptreq/:id',function(req,res){

  User.findByIdAndUpdate(req.user._id,{$pull:{receivereq:req.params.id}},function(err){
    if(err)
    return console.log(err.message)
  })
  User.findByIdAndUpdate(req.params.id,{$pull:{sentreq:req.user._id}},function(err){
    if(err)
    return console.log(err.message)
  })

  User.findById(req.user._id,function(err,user1){
    if(err)
    return console.log(err.message)
    User.findById(req.params.id,function(err,user2){
      if(err)
      return console.log(err.message)
      user1.friend.push(req.params.id)
      user1.save()
      user2.friend.push(req.user._id)
      user2.save()
      res.redirect('/friends')



    })

  })

})
app.get('/friends', function (req, res) {
  User.findById(req.user._id)
    .populate('friend')
    .exec(function (err, friends) {
      if (err) console.log(err);
     // else console.log(friends);
      User.findById(req.user._id)
        .populate('receivereq')
        .exec(function (err, pendingreq) {
          if (err) return console.log(err);
          else console.log("dpefde",pendingreq.receivereq);
          res.render('friends', { friends: friends.friend, pending: pendingreq.receivereq });
        });
    });
});
app.get('/addfriendreq/:id', function (req, response) {
  User.findById(req.user._id, function (err, res) {
    if (err) return console.log(err);
    User.findById(req.params.id, function (err, resp) {
      if (err) return console.log(err);
      res.sentreq.push(resp);
      res.save();
      resp.receivereq.push(res);
      resp.save();
      response.redirect('/users');
    });
  });
});

app.get('/register', function (req, res) {
  res.render('register');
});

app.post('/register', function (req, res) {
  var newUser = new User({
    username: req.body.username,
    name: req.body.name,
    email: req.body.email,
    mobile: req.body.mobile,
    age: req.body.age,
    latitude: req.body.latitudeofuser,
    longitude: req.body.longitudeofuser,
  });
  User.register(newUser, req.body.password, function (err, user) {
    if (err) {
      console.log(err.message);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, function () {
        console.log('Signed up as ' + user.username);
        res.redirect('/users');
      });
    }
  });
});
app.get('/login', function (req, res) {
  res.render('login');
});
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/users',
    failureRedirect: '/login',
  }),
  function (req, res) {}
);
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/users');
  console.log('Logged out!!');
});
app.get('/video', function (req, res) {
  res.render('test', { appID: appID });
});
app.get('/video/:id', function (req, res) {
  User.findById(req.params.id, function (err, foundUser) {
    if (err || !foundUser) {
      console.log('User not found');
      return res.redirect('back');
    }
    console.log(foundUser);
    res.render('video', { user: foundUser });
  });
});

app.get('/addreminder', function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  reminder
    .find({ username: req.user.username }, function (err, result) {
      if (err) console.log(err);
      else {
        res.render('reminder', { result: result });
      }
    })
    .sort([
      ['date.year', 'asc'],
      ['date.month', 'asc'],
      ['date.day', 'asc'],
      ['time.hr', 'asc'],
      ['time.min', 'asc'],
    ]);
});

app.post('/addreminder', function (req, res) {
  let dat = new Date();
  let y = dat.getFullYear();
  let m = dat.getMonth() + 1;
  let d = dat.getDate();
  let h = dat.getHours();
  let min = dat.getMinutes();

  let year = parseInt(req.body.Date.slice(0, 4));
  let month = parseInt(req.body.Date.slice(5, 7));
  let date = parseInt(req.body.Date.slice(8, 10));
  let hour = parseInt(req.body.Time.slice(0, 2));
  let mi = parseInt(req.body.Time.slice(3, 5));

  if (
    year < y ||
    (year == y && month < m) ||
    (year == y && month == m && date < d) ||
    (year == y && month == m && date == d && hour * 60 + mi < h * 60 + min + 30)
  ) {
    JSAlert.alert(
      'Your files have been saved successfully.',
      'Files Saved',
      'Got it'
    );
    return res.redirect('/addreminder');
  }

  var inst1 = new reminder({
    username: req.user.username,
    title: req.body.Title,
    Description: req.body.Description,
    date: { day: date, month: month, year: year },
    time: { hr: hour, min: mi },
  });
  inst1.save(function (err) {
    if (err) return console.error(err);
    console.log('Saved to Resource');
  });
  res.redirect('/addreminder');
});

app.get('/delete/:id', function (req, res) {
  reminder.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return console.log(err);
    // deleted at most one tank document
    res.redirect('/addreminder');
  });
});
function toRadians(degree) {
  let one_deg = Math.PI / 180;
  return one_deg * degree;
}

app.get('/users', function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

  let usersuptodis = new Array();
  let latitudeofuser;
  let longitudeofuser;
  let dis = 10;
  User.findOne({ username: req.user.username }, function (err, result) {
    if (err) console.log(err);
    else {
      latitudeofuser = result.latitude;
      longitudeofuser = result.longitude;
      User.find({}, function (err, users) {
        if (err) {
          console.log(err);
        } else {
          let count = 0;
          users.forEach(function (thisuser) {
            count++;

            let lati = thisuser.latitude;
            let long = thisuser.longitude;

            let lat1 = toRadians(lati);
            let long1 = toRadians(long);
            let lat2 = toRadians(latitudeofuser);
            let long2 = toRadians(longitudeofuser);
            let dlong = long2 - long1;
            let dlat = lat2 - lat1;
            let ans =
              Math.pow(Math.sin(dlat / 2), 2) +
              Math.cos(lat1) *
                Math.cos(lat2) *
                Math.pow(Math.sin(dlong / 2), 2);
            ans = 2 * Math.asin(Math.sqrt(ans));
            let R = 6371;
            ans = ans * R;

            if (ans <= dis && thisuser.username != req.user.username) {
              usersuptodis.push(thisuser);
            }
            if (count === users.length) {
              res.render('users', { result: usersuptodis });
            }
          });
        }
      });
    }
  });
});

app.post('/users', function (req, res) {
  var dis = parseInt(req.body.distances);

  let usersuptodis = new Array();
  let latitudeofuser;
  let longitudeofuser;
  User.findOne({ username: req.user.username }, function (err, result) {
    if (err) console.log(err);
    else {
      latitudeofuser = result.latitude;
      longitudeofuser = result.longitude;
      User.find({}, function (err, users) {
        if (err) {
          console.log(err);
        } else {
          let count = 0;
          users.forEach(function (thisuser) {
            count++;

            let lati = thisuser.latitude;
            let long = thisuser.longitude;

            let lat1 = toRadians(lati);
            let long1 = toRadians(long);
            let lat2 = toRadians(latitudeofuser);
            let long2 = toRadians(longitudeofuser);
            let dlong = long2 - long1;
            let dlat = lat2 - lat1;
            let ans =
              Math.pow(Math.sin(dlat / 2), 2) +
              Math.cos(lat1) *
                Math.cos(lat2) *
                Math.pow(Math.sin(dlong / 2), 2);
            ans = 2 * Math.asin(Math.sqrt(ans));
            let R = 6371;
            ans = ans * R;

            if (ans <= dis && thisuser.username != req.user.username) {
              usersuptodis.push(thisuser);
            }
            if (count === users.length) {
              res.render('users', { result: usersuptodis });
            }
          });
        }
      });
    }
  });
});

app.listen(PORT, function () {
  console.log('App has started');
});
