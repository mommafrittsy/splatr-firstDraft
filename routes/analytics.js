const express = require('express'),
      router = express(),
      date = new Date(),
      // Models
      Day = require('../models/analytics/day.js'),
      Gallery = require('../models/gallery.js'),
      SplatrError = require('../models/error.js'),
      User = require('../models/user.js');
      
router.use((req, res, next)=>{
  if(!req.user){
    res.status(401).send('You need to be logged in.');
  } else {
    next();
  }
});
router.get('/user/:start/:end', (req, res)=>{
  let start = new Date(Number(req.params.start)),
      end = new Date(Number(req.params.end));
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      res.status(400).send(err);
    } else {
      Day.find({"date_id":{"$gte":start, "$lt":end},user:foundUser._id.toString(),gallery:null}, (err, days)=>{
        if(err){
          res.status(400).send(err);
        } else {
          res.status(200).json(days);
        }
      });
    }
  });
});
router.get('/gallery/:id/:start/:end', (req, res)=>{
  let start = req.params.start,
      end = req.params.end;
  Gallery.findOne({_id:req.params.id},(err, foundGal)=>{
    if(err){
      error(req, res, err);
    } else if(foundGal.artist.toString() != req.user._id.toString()){
      error(req, res, 'That\'s not your data.');
    } else {
      Day.find({"date_id":{"$gte":start, "$lt":end},user:null, gallery:req.params.id}, (err, days)=>{
        if(err){
          error(req, res, err);
        } else {
          res.status(200).json(days);
        }
      });
    }
  });
});

module.exports = router;

function error(req, res, err){
  let errorObj = {
    date: Date.now(),
    error: err,
  };
  if(err.message){
    errorObj.message = err.message;
  }
  if(req.user){
    User.findById(req.user._id, (error, foundUser)=>{
      if(error){
        console.log(error);
      } else {
        errorObj.user = foundUser._id;
      }
    });
  }
  console.log(err);
  SplatrError.create(errorObj, (error, newError)=>{
    if(error){
      console.log(error);
    } else {
      if(err.message){
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        req.flash('error', err);
        res.redirect('back');
      }
    }
  });
}