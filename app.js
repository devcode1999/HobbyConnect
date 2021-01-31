var express = require('express'),
  mongoose = require('mongoose'),
  bodyparser = require('body-parser'),
  passport = require('passport'),
  localStratergy = require('passport-local'),
  expressSession = require('express-session'),
  passportLocalMongoose = require('passport-local-mongoose');
const nodemailer = require('nodemailer');
var methodOverride = require("method-override");

var multer = require('multer');
require('dotenv/config');
var fs=require('fs')
var path=require('path')
app = express();
var JSAlert = require('js-alert');
const { title } = require('process');
//agora
var appID = process.env.APPID;
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
  hobbies:[{
    type:String
  }],
  events:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event"
}],
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

var eventSchema = new mongoose.Schema({
  title:String,
  image:String,
  description:String,
  maxCount:Number,
  Address:String,
  date:{day:Number,month:Number,year:Number},
  time:{hr:Number,min:Number},
  registered:[
      {
          type: mongoose.Schema.Types.ObjectId,
          ref:"User"
      }
  ],
  author:{
      id:{
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
      },
      username: String
  }
})
userSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', userSchema);
var reminder = mongoose.model('reminder', RemSchema);
var Event = mongoose.model("Event",eventSchema);
const PORT = process.env.PORT || 3000;
const URL = process.env.DATABASEURL || 'mongodb://localhost:27017/hobby';
mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});
app.use(methodOverride("_method"));
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
    user: process.env.gmailid,
    pass: process.env.gmailpassword,
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
          User.findOne({ username: result[i].username }, function (err, res) {
            if (err) console.log(err);
            else {
              console.log(res);
              var mailoptions = {
                from: process.env.gmailid,
                to: res.email,
                subject: 'Hobby Matcher Reminder',
                text: `Hi  ${res.name}. Your reminder is up for today at Hrs: ${result[i].time.hr}, Min:${result[i].time.min} for the event titled  ${result[i].title}`,
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
}, 120);

app.get('/', function (req, res) {
 
  res.render('index');
});
app.get('/cancelreq/:id/:var',function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  User.findByIdAndUpdate(req.user._id,{$pull:{sentreq:req.params.id}},function(err){
    if(err)
    return console.log(err)
  })
  User.findByIdAndUpdate(req.params.id,{$pull:{receivereq:req.user._id}},function(err){
    if(err)
    return console.log(err)
  })
res.redirect("back")
})
app.get('/hobbie/:type',function(req,response){
  if (!req.isAuthenticated()) {
    return response.redirect('/login');
  }
  User.findById(req.user._id,function(err,res){
    if(err)
    return console.log(err.message)
    var x;
    if(res.hobbies.indexOf(req.params.type)!=-1)
    x=true;
    else
    x=false;
    var people=new Array()
  let latitudeofuser=res.latitude;
  let longitudeofuser=res.longitude;
  let dis = 10;



    User.find({},function(errr,re){
      if(errr)
      return console.log(errr)

      let count = 0;
          re.forEach(function (thisuser) {
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

            if (ans <= dis && thisuser.username != req.user.username&&thisuser.hobbies.indexOf(req.params.type)!=-1) {
              people.push(thisuser);
            }
            if(count===re.length)
            response.render('hobbie',{hname:req.params.type,people:people,x:x,currentuser:res});
          })
     
    })

  })


})
app.get('/mainpage',function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  res.render('mainpage')
})
app.get('/addhobbie/:type',function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  User.findById(req.user._id,function(err,result){
    if(err)
    return console.log(err.message)
    console.log(result);
    result.hobbies.push(req.params.type);
    result.save();
    res.redirect('/hobbie/'+req.params.type)
  })
})
app.get('/rejectreq/:id/:var',function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  User.findByIdAndUpdate(req.user._id,{$pull:{receivereq:req.params.id}},function(err){
    if(err)
    return console.log(err)
  })
  User.findByIdAndUpdate(req.params.id,{$pull:{sentreq:req.user._id}},function(err){
    if(err)
    return console.log(err)
  })
 res.redirect("back");
})
app.get('/acceptreq/:id/:var',function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

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
     res.redirect("back");


    })

  })

})
app.get('/friends', function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
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
app.get('/addfriendreq/:id/:var', function (req, response) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  User.findById(req.user._id, function (err, res) {
    if (err) return console.log(err);
    User.findById(req.params.id, function (err, resp) {
      if (err) return console.log(err);
      res.sentreq.push(resp);
      res.save();
      resp.receivereq.push(res);
      resp.save();
      response.redirect('back');
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
        res.redirect('/login');
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
    successRedirect: '/mainpage',
    failureRedirect: '/login',
  }),
  function (req, res) {}
);
app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/users');
  console.log('Logged out!!');
});

app.get("/video/:id",function(req,res){
  var channelName=req.user.username;
  User.findById(req.params.id,function(err,foundUser){
      if(err||!foundUser){
          console.log("User not found");
          return res.redirect("back");
      }
      if(channelName.localeCompare(foundUser.username)<0)
      channelName = channelName+foundUser.username;
      else
      channelName = foundUser.username+channelName;
      console.log(channelName);
      console.log(foundUser);
      res.render("video",{appID:appID,channelName:channelName,localUser:req.user,remoteUser:foundUser});
  })
})

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
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

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
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }

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
              User.findById(req.user._id,function(per,pes){
                 if(per)
                 return console.log(per.message)
            
                res.render('users', { result: usersuptodis,currentuser:pes });


              })
             
            }
          });
        }
      });
    }
  });
});
// app.get("/users/:id",function(req,res){
//   if (!req.isAuthenticated()) {
//     return res.redirect('/login');
//   }
//   User.findById(req.params.id,function(err,user){
//       if(err){console.log(user);}
//       else {
//           res.render("show",{user:user});
//       }
//   })
// })
// app.get("/users/:id/events",function(req,res){
//   User.findById(req.params.id).populate("events").exec(function(err,foundUser){
//       var events = foundUser.events;
//           console.log(events);
//         res.render("registeredEvents",{events:events});
//   })
// })

app.post('/users', function (req, res) {
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
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
              User.findById(req.user._id,function(per,pes){
                if(per)
                return console.log(per.message)
               res.render('users', { result: usersuptodis,currentuser:pes});

             })
             
            }
          });
        }
      });
    }
  });
});

app.get("/chat/:id",function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  var channelName=req.user.username;
  User.findById(req.params.id,function(err,foundUser){
      if(err||!foundUser){
          console.log("User not found");
          return res.redirect("back");
      }else {
          
        
          res.render("chat",{channelName:channelName,localUser:req.user,remoteUser:foundUser})
      }
  })
})

var montharr=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]

app.get("/events",(req,res)=>{
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  Event.find({},function(err,events){
      if(err)
      console.log(err);
      else 
      res.render("events",{events:events,montharr:montharr});
  }).sort([
      ['date.year', 'asc'],
      ['date.month', 'asc'],
      ['date.day', 'asc'],
      ['time.hr', 'asc'],
      ['time.min', 'asc'],
    ]);
});
app.get("/events/new",function(req,res){
  res.render("newEvent");
})
app.post("/events",function(req,res){
  var event = req.body.event;
  console.log(req.body.date);
  let year = parseInt(req.body.date.slice(0, 4));
  let month = parseInt(req.body.date.slice(5, 7));
  let day = parseInt(req.body.date.slice(8, 10));
  let hr = parseInt(req.body.time.slice(0, 2));
  let min = parseInt(req.body.time.slice(3, 5));
  console.log(year,month,day);
  event.date = {day,month,year};
  event.time = {hr,min};
  event.maxCount= parseInt(event.maxCount)+5;
  if(!event.image){
      console.log("No image");
  }
  event.author={username:req.user.username, 
      id:req.user._id
  };
  Event.create(event,function(err,event){
      if(err){
          console.log(err);
      }else {
          res.redirect("/events");
      }
  })
})

app.post("/events/:id/registered",function(req,res){
  Event.findById(req.params.id,function(err,foundEvent){
      if(err){
          console.log(err);
      }else {  
          console.log("register");
          foundEvent.registered.push(req.user);
          foundEvent.save();
          User.findById(req.user._id,function(err,foundUser){
              if(err) console.log(err);
              else{
                  foundUser.events.push(foundEvent);
                  foundUser.save();
                  res.redirect("/events");
              }
          })
      }
  })
})
app.post("/events/:id/unregistered",function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  Event.findByIdAndUpdate(req.params.id,{$pull:{registered:req.user._id}},function(err){
      if(err){
          console.log(err);
      }else {  
          User.findByIdAndUpdate(req.user._id,{$pull:{events:req.params.id}},function(err){
              if(err){
                  console.log(err);
              }else {
                  res.redirect("/events");
              }
          })
      }
  })
})
app.delete("/events/:id",function(req,res){
  if (!req.isAuthenticated()) {
    return res.redirect('/login');
  }
  console.log("delete");

      Event.findById(req.params.id,function(err,foundEvent){
          if(err)
          console.log(err);
          else{
              foundEvent.registered.forEach(function(id){
                  User.findByIdAndUpdate({_id:id},{$pull:{events:req.params.id}},function(err){
                      if(err)
                      console.log(err);
                  })
              })
          }
          })

      Event.findByIdAndRemove(req.params.id,function(err){
          if(err)console.log(err);
          else{
              res.redirect("/events");
          }
      })
  })



app.listen(PORT, function () {
  console.log('App has started');
});
