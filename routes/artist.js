const express = require('express'),
      router  = express(),
      date = new Date(),
      //   Upload
      azure = require("azure-storage"),
      crypto = require('crypto-random-string'),
      multer  = require('multer'),
      streamifier = require('streamifier'),
      storageAccount = process.env.AZURE_STORAGE_ACCOUNT,
      storageKey = process.env.AZURE_STORAGE,
      azureEndpoint = process.env.AZURE_STORAGE_ENDPOINT,
      blobClient  = azure.createBlobService(storageAccount, storageKey),
      // search
      search = require('algoliasearch'),
      client = search('LKDIWAGI3B', process.env.ALGOLIA),
      userIndex = client.initIndex('users'),
      transIndex = client.initIndex('transactions'),
      // Models
      User  = require('../models/user.js'),
      Commission  = require('../models/commission.js'),
      Transaction = require('../models/transaction.js'),
      Notification  = require('../models/notification.js'),
      Report  = require('../models/report.js'),
      SplatrError = require('../models/error.js');

router.get('/:username', (req, res)=>{
  let username = req.params.username;
  User
  .findOne({username})
  .populate('commissions')
  .populate({path:'fans', options:{sort:{username:-1}}})
  .populate({path:'following', options:{sort:{username:-1}}})
  .populate('gallery.commissioned')
  .populate('gallery.non_commissioned')
  .populate('likes')
  .populate('completed')
  .exec((err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if (foundUser == null) {
      res.redirect('/404');
    } else {
      let age, you, description;
      if(req.user && req.user.birthday){
        age = checkBirthday(req.user.birthday);
      } else {
        age = false;
      }
      if(req.user && req.user._id.toString() == foundUser._id.toString()){
        you = true;
      }
      if(foundUser.description){
        description = foundUser.description;
      } else {
        description = `${foundUser.username}'s Page.`;
      }
      res.render('./showPages/artist', {title:foundUser.username, css_js:'artist', artist:foundUser, age, you, url:`https://splatr.art/${foundUser.username}`, image:foundUser.profile.url, description}); 
    }
  });
});
// router.use((req, res, next)=>{
//   if(!req.user){
//     res.send(`You need to be logged in for that.`);
//   } else {
//     next();
//   }
// });
// router.post('/:username/commission/:comm/new_request', multer().array('images'), (req, res)=>{
//   let references = [];
//   if(req.files && req.files.length > 0){
//     for(let file of req.files){
//       let stream = streamifier.createReadStream(file.buffer),
//           id = `ref_${crypto(24)}.png`,
//           container = 'references',
//           url   = `${azureEndpoint}${container}/${id}`,
//           options =  {
//             contentSettings:{
//                 contentType: "image/png"
//             },
//             metadata: {fileName:id}
//           };
//       blobClient.createBlockBlobFromStream(container, id, stream, file.size, options, (err)=>{
//         if(err != null){
//           error(req, res, err);
//         } else {
//           let reference = {id, url};
//           references.push(reference);
//           if(references.length == req.files.length){
//             makeRequest(req, res, references);
//           }
//         }
//       });
//     }
//   } else {
//     makeRequest(req, res, null);
//   }
// });
// router.post('/:username/commission/:comm/report', (req, res)=>{
//     User.findById(req.user._id, (err, foundUser)=>{
//     if(err){
//       error(req, res, err);
//     } else {
//       Commission.findById(req.params.comm, (err, foundComm)=>{
//         if(err){
//           error(req, res, err);
//         } else {
//           User.findOne({username:req.params.username}, (err, foundArtist)=>{
//             if(err){
//               error(req, res, err);
//             } else {
//               Report.create({dates:{sent:date}, reporter:foundUser._id, reason:req.body.reportImage, commission:foundComm._id, artist: foundArtist._id, status:'sent'}, (err, newReport)=>{
//                 if(err){
//                   error(req, res, err);
//                 } else {
//                   if(req.body.other && req.body.reportImage == 'other'){
//                     newReport.other = req.body.other;
//                     newReport.save();
//                   }
//                   req.flash('success', 'Report sent. We\'re on it.');
//                   res.redirect('back');
//                 }
//               });
//             }
//           });
//         }
//       });
//     }
//   });
// });
// router.post('/:username/follow' ,(req, res)=>{
//   User.findById(req.user._id, (err, foundUser)=>{
//     if(err){
//       error(req, res, err);
//     } else {
//       User.findOne({_id:req.params.username}, (err, foundArtist)=>{
//         if(err){
//           error(req, res, err);
//         } else {
//           if(foundUser.following.indexOf(foundArtist._id) == -1){
//             Notification.create({from:foundUser,date,type:'follow',url:`/${foundUser.username}`}, (err, newNote)=>{
//               if(err){
//                 error(req, res, err);
//               } else {
//                 let userUpdate = {
//                   objectID: foundArtist._id,
//                   followers: foundArtist.fans.length += 1
//                 };
//                 analytic(req, res, foundArtist._id.toString(), null, 'fans', 1);
//                 foundUser.following.unshift(foundArtist);
//                 foundArtist.fans.unshift(foundUser);
//                 foundArtist.notifications.unshift(newNote);
//                 foundUser.save();
//                 foundArtist.save();
//                 userIndex.partialUpdateObject(userUpdate, (err, response)=>{
//                   if(err){
//                     error(req, res, err);
//                   }
//                 });
//                 req.flash('success', 'Following!');
//                 res.redirect('back');
//               }
//             });
//           } else {
//             let index = foundUser.following.indexOf(foundArtist._id),
//                 index2 = foundArtist.fans.indexOf(foundUser._id),
//                 userUpdate = {
//                   objectID: foundArtist._id,
//                   followers: foundArtist.fans.length -= 1
//                 };
            
//             foundUser.following.splice(index, 1);
//             foundArtist.fans.splice(index2, 1);
//             foundUser.save();
//             foundArtist.save();
//             userIndex.partialUpdateObject(userUpdate, (err, response)=>{
//               if(err){
//                 error(req, res, err);
//               }
//             });
//             req.flash('success', 'Unfollowed.');
//             res.redirect('back');
//           }
//         }
//       });
//     }
//   });
// });
      
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
function checkBirthday(birthDate){
  let today = new Date(),
      age = today.getFullYear() - birthDate.getFullYear(),
      m = today.getMonth() - birthDate.getMonth();
      
  if(m < 0 || (m === 0 && today.getDate() < birthDate.getDate())){
    age --;
  }
  if (age > 18){
    return true;
  } else {
    return false;
  }
}
function analytic(req, res, user, gallery, updateProperty, update){
  let Day = require('../models/analytics/day'),
      Month = require('../models/analytics/month'),
      Year = require('../models/analytics/year'),
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November','December'],
      todayDay = date.getDate(),
      todayMonth = months[date.getMonth()],
      todayYear = date.getFullYear(),
      today = {day:todayDay, month:todayMonth, year:todayYear, string: `${todayMonth} ${todayDay}, ${todayYear}`},
      date_id = date;
  
  Year.findOne({year:today.year, gallery, user}, (err, foundYear)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundYear == null){
        Year.create({year:today.year, gallery, user}, (err, newYear)=>{
          if(err){
            error(req, res, err);
          } else {
            Month.create({date:{month:today.month, year:today.year}, gallery, user},(err, newMonth)=>{
              if(err){
                error(req, res, err);
              } else {
                Day.create({date:today, gallery, user, date_id}, (err, newDay)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    if(gallery == null){
                      user.analytics.push(newYear);
                      user.save();
                    } else {
                      gallery.analytics.push(newYear);
                      gallery.save();
                    }
                    newMonth.days.push(newDay);
                    newYear.months.push(newMonth);
                    newMonth.save();
                    newYear.save();
                    newData(newDay, updateProperty, update);
                  }
                });
              }
            });
          }
        });
      } else {
        Month.findOne({date:{month:today.month, year:today.year},gallery, user}, (err, foundMonth)=>{
          if(err){
            error(req, res, err);
          } else if(foundMonth == null) {
            Month.create({date:{month:today.month, year:today.year}, gallery, user}, (err, newMonth)=>{
              if(err){
                error(req, res, err);
              } else {
                Day.create({date:today, gallery, user, date_id}, (err, newDay)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    newMonth.days.push(newDay);
                    foundYear.months.push(newMonth);
                    newDay.save();
                    newMonth.save();
                    newData(newDay, updateProperty, update);
                  }
                });
              }
            });
          } else {
            Day.findOne({date:today, gallery, user}, (err, foundDay)=>{
              if(err){
                error(req, res, err);
              } else if(foundDay == null){
                Day.create({date: today, gallery, user, date_id}, (err, newDay)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    foundMonth.days.push(newDay);
                    foundMonth.save();
                    newData(newDay, updateProperty, update);
                  }
                });
              } else {
                newData(foundDay, updateProperty, update);
              }
            });
          }
        });
      }
    }
  });    
}
function newData(day, updateProperty, update){
  day[updateProperty] = day[updateProperty] + update;
  day.save();
}
function makeRequest(req, res, references){
  let request = req.body.request,
      status = 'requested';
  User.findById(req.user._id, (err, foundClient)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findById(req.params.artist, (err, foundArtist)=>{
        if(err){
          error(req, res, err);
        } else {
          Commission.findOne({_id:req.params.comm}, (err, foundComm)=>{
            if(err){
              error(req, res, err);
            } else if(foundComm.available && foundComm.available <= 0){
              error(req, res, 'There are no more of that commission available');
            }  else {
              Transaction.create({artist: {username:foundArtist.username, id:foundArtist._id.toString(), profile:foundArtist.profile.url}, client:{username:foundClient.username, id:foundClient._id.toString(), profile:foundClient.profile}, dates:{request:date, activity:date}, status, type:{example:foundComm.example.url, id:foundComm._id, name:foundComm.name, price:foundComm.price}, request, viewable_by:[foundArtist._id.toString(), foundClient._id.toString()]}, (err, newTrans)=>{
                if(err){
                  error(req, res, err);
                } else {
                  Notification.create({from:foundClient, date, content:request, text:`${foundClient.username} has requested "${foundComm.name}."`, transaction:newTrans, type:'request', url:`/transaction/${newTrans._id}`}, (err, newNote)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      let transObject = {
                            objectID: newTrans._id,
                            artist: foundArtist.username,
                            client: foundClient.username,
                            request: date,
                            status,
                            type: foundComm.name,
                            activity: date,
                            viewable_by:[foundArtist._id, foundClient._id]
                          };
                      
                      transIndex.addObject(transObject, (err, response)=>{
                        if(err){
                          error(req, res, err);
                        }
                      });
                      analytic(req, res, foundArtist._id.toString(), null, 'requests', 1);
                      if(references != null){
                        newTrans.reference = newTrans.reference.concat(references);
                        newTrans.save();
                      }
                      foundArtist.notifications.unshift(newNote);
                      foundArtist.transactions.unshift(newTrans);
                      foundClient.transactions.unshift(newTrans);
                      foundArtist.save();
                      foundClient.save();
                      req.flash('success', 'Requested!');
                      res.redirect('back');
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}
function dateFormat(date, locale){
  let computed_date = new Date(date),
      year = computed_date.getFullYear(),
      month = months[date.getMonth()],
      day = date.getDate(),
      full_date;
      
  if(locale == 'US'){
    full_date = `${month} ${day}, ${year}`;
  } else {
    full_date = `${day} ${month} ${year}`;
  }
  return full_date;
}