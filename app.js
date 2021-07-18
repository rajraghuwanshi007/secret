//jshint esversion:6
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const ejs = require('ejs');

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/secretsdb", {useNewUrlParser: true, useUnifiedTopology: true});

const secretSchema = new mongoose.Schema({
  username:String,
  password:String
});

const Secret = mongoose.model("Secret", secretSchema);

app.get("/", function (req , res){
  res.render("home");
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get("/register", function(req, res){
  res.render("register");
});


app.post("/register", function(req,res){
  const newUser = new Secret({
    username: req.body.username,
    password:req.body.password
  });

  newUser.save(function(err){
    if(err) console.log(err);

    else{
      res.render("secrets");
    }
  });
});

app.post("/login", function(req, res){
  Secret.findOne({username:req.body.username},function(err, foundUser){
    if(!err){
      if(foundUser.password === req.body.password){
        res.render("secrets");
      }
      else{
        res.render("login");
      }
    }
    else console.log(err);
  });
});






app.listen(3000, function(){
  console.log("server running on port 3000");
});
