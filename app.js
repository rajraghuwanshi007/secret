//jshint esversion:6
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "mu here",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/secretsdb", {useNewUrlParser: true, useUnifiedTopology: true});

const secretSchema = new mongoose.Schema({
  username:String,
  password:String,
  googleId:String
});

secretSchema.plugin(passportLocalMongoose);
secretSchema.plugin(findOrCreate);

const Secret = mongoose.model("Secret", secretSchema);


passport.use(Secret.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  Secret.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret"
  },
  function(accessToken, refreshToken, profile, cb) {
    Secret.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get('/auth/google/secret',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });

app.get("/", function (req , res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secret",function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/register");
  }
});

app.get("/logout",function(req, res){
  req.logout();
  res.redirect('/');
});

app.post("/register", function(req,res){
   Secret.register({username:req.body.username},req.body.password,function(err, user){
     if(err){
       console.log(err);
       res.redirect("/register");
     }else {
       passport.authenticate("local")(req, res, function(){
         res.redirect("/secret");
       });
     }
   })
});

app.post("/login", function(req, res){
   const user = new Secret({
     username: req.body.username,
     password: req.body.password
   });

   req.login(user, function(err){
     if(err){
       console.log(err);
       res.redirect("/login");
     }else{
       passport.authenticate("local")(req, res, function(){
         res.redirect("/secret");
       });
     }
   })
});





app.listen(3000, function(){
  console.log("server running on port 3000");
});
