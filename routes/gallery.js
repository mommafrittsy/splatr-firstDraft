const express = require('express'),
      router  = express.Router(),
      date = new Date(),
      // Search
      search = require('algoliasearch'),
      client = search('LKDIWAGI3B', process.env.ALGOLIA),
      artIndex = client.initIndex('galleries'),
      // Models
      User  = require('../models/user.js'),
      Comment = require('../models/comment.js'),
      Gallery = require('../models/gallery.js'),
      Notification  = require('../models/notification.js'),
      Report  = require('../models/report.js'),
      SplatrError = require('../models/error.js');

router.get('/:username/:id', (req, res)=>{
  let age = false;
  if(req.user){
    if(checkBirthday(req.user.birthday) == true){
      age = true;
    }
  }
  Gallery.findOne({linked_title:req.params.id})
  .populate('artist')
  .populate({
    path:'comments', 
    populate:{path:'from'},
    options:{
      sort:{
        date:-1
      }
    }
  })
  .exec((err, foundGalleryTitle)=>{
    if(err){
      error(req, res, err);
    } else if(foundGalleryTitle != null && foundGalleryTitle.paid == false && foundGalleryTitle.commissioned == true){
      res.redirect('/404');
    } else if(foundGalleryTitle == null) {
      Gallery.findOne({_id:req.params.id})
      .populate('artist')
      .populate({
        path:'comments', 
        populate:{path:'from'},
        options:{
          sort:{
            date:-1
          }
        }
      })
      .exec((err, foundGallery)=>{
        if(err){
          error(req, res, err);
        } else if(foundGallery == null || (foundGallery.paid == false && foundGallery.commissioned == true)){
          res.redirect('404');
        } else {
          User.findOne({_id:foundGallery.artist}, (err, foundArtist)=>{
            if(err){
              error(req, res, err);
            } else {
              if(foundGallery.NSFW == true) {
                if(req.user){
                  let NSFW = checkBirthday(req.user.birthday);
                  
                  if(NSFW == true){
                    renderGallery(req, res, foundArtist, foundGallery, age);
                  } else {
                    if(req.get('Referer')){
                      req.flash('error', 'You need to be over 18 and logged in to view that content.');
                      res.redirect(req.get('Referer'));
                    } else {
                      req.flash('error', 'You need to be over 18 and logged in to view that content.');
                      res.redirect(`/${req.params.username}`);
                    }
                  }
                } else {
                  error(req, res, 'Sorry. You need to be logged in to view this content.');
                }
              } else {
                renderGallery(req, res, foundArtist, foundGallery, age);
              }
            }
          });
        }
      });
    } else {
      User.findOne({_id:foundGalleryTitle.artist}, (err, foundArtist)=>{
        if(err){
          error(req, res, err);
        } else {
          if(foundGalleryTitle.NSFW == true) {
            if(req.user){
              let NSFW = checkBirthday(req.user.birthday);
              
              if(NSFW == true){
                renderGallery(req, res, foundArtist, foundGalleryTitle, age);
              } else {
                if(req.get('Referer')){
                  req.flash('error', 'You need to be over 18 and logged in to view that content.');
                  res.redirect(req.get('Referer'));
                } else {
                  req.flash('error', 'You need to be over 18 and logged in to view that content.');
                  res.redirect(`/${req.params.username}`);
                }
              }
            } else {
              error(req, res, 'Sorry. You need to be logged in to view this content.');
            }
          } else {
            renderGallery(req, res, foundArtist, foundGalleryTitle, age);
          }
        }
      });
    }
  });
});
router.use((req, res, next)=>{
  if(!req.user){
    error(req, res, 'You need to be logged in for this.');
  } else {
    next();
  }
});
router.post('/:username/:id/comment', (req, res)=>{
  Gallery.findById(req.params.id, (err, foundGallery)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findById(foundGallery.artist, (err, foundArtist)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findOne({_id:req.user._id}, (err, foundCommenter)=>{
            if(err){
              error(req, res, err);
            } else {
              Comment.create({from:foundCommenter, content:req.body.comment, date}, (err, newComment)=>{
                if(err){
                  error(req, res, err);
                } else {
                  Notification.create({from:foundCommenter, date, comment:newComment, text:`${foundCommenter.username} commented on your artwork!`, type:'comment', url:`/gallery/${foundArtist.username}/${foundGallery._id}/#${newComment._id}`}, (err, newNote)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      analytic(req, res, null, foundGallery._id.toString(), 'comments', 1);
                      foundGallery.comments.push(newComment);
                      foundArtist.notifications.unshift(newNote);
                      foundGallery.save();
                      foundArtist.save();
                      req.flash('success', 'Comments away!');
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
});
router.post('/:username/:id/comment/:commentId/like', (req, res)=>{
  Comment.findById(req.params.commentId, (err, foundComment)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findById(req.user._id, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else if(foundUser._id.toString() == foundComment.from.toString()){
          error(req, res, 'You shouldn\'t laugh at your own jokes.');
        } else {
          if(foundComment.likes.indexOf(req.user._id) != -1){
            let index = foundComment.likes.indexOf(foundUser._id.toString());
            foundComment.likes.splice(index, 1);
            foundComment.save();
            req.flash('success', 'Unliked.');
            res.redirect('back');
          } else {
            User.findById(foundComment.from, (err, foundCommenter)=>{
              if(err){
                error(req, res, err);
              } else {
                Gallery.findById(req.params.id)
                .populate('artist')
                .exec((err, foundGallery)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    Notification.create({from:foundUser,date,gallery:foundGallery._id, comment:foundComment, text:`${foundUser.username} liked your comment.`, type:'commentLike', url:`/gallery/${foundGallery.artist.username}/${foundGallery._id}/#${foundComment._id}`}, (err, newNote)=>{
                      if(err){
                        error(req, res, err);
                      } else {
                        foundCommenter.notifications.unshift(newNote);
                        foundComment.likes.unshift(foundUser._id.toString());
                        foundCommenter.save();
                        foundComment.save();
                        req.flash('success', 'Nice! We like it too!');
                        res.redirect('back');
                      }
                    });
                  }
                });
              }
            });
          }
        }
      });
    }
  });
});
router.post('/:username/:id/comment/:commentId/remove', (req, res)=>{
  Comment.findById(req.params.commentId, (err, foundComment)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findById(req.user._id, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else if(foundUser._id.toString() != foundComment.from.toString()){
          error(req, res, 'That is not yours to delete.');
        } else {
          Gallery.findById(req.params.id, (err, foundGallery)=>{
            if(err){
              error(req, res, err);
            } else {
              let index = foundGallery.comments.indexOf(foundComment._id);
              foundGallery.comments.splice(index, 1);
              foundGallery.save();
              Comment.findByIdAndRemove(foundComment._id, (err)=>{
                if(err){
                  error(req, res, err);
                } else {
                  req.flash('success', 'Removed.');
                  res.redirect('back');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.post('/:username/:id/comment/:commentId/report', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      Comment.findById(req.params.commentId, (err, foundComment)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findById(foundComment.from, (err, foundFrom)=>{
            if(err){
              error(req, res, err);
            } else {
              Report.create({dates:{sent:date}, reporter:foundUser._id, comment:foundComment._id, artist:foundFrom._id, status:'sent'}, (err, newReport)=>{
                if(err){
                  error(req, res, err);
                } else {
                  if(req.body.other){
                    newReport.other = req.body.other;
                    newReport.save();
                  }
                  req.flash('success', 'Report sent. We\'re on it.');
                  res.redirect('back');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.post('/:username/:id/report', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      Gallery.findById(req.params.id, (err, foundGallery)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findById(foundGallery.artist, (err, foundArtist)=>{
            if(err){
              error(req, res, err);
            } else {
              Report.create({dates:{sent:date}, reporter:foundUser._id, reason:req.body.reportImage, gallery:foundGallery._id, artist: foundArtist._id, status:'sent'}, (err, newReport)=>{
                if(err){
                  error(req, res, err);
                } else {
                  if(req.body.other){
                    newReport.other = req.body.other;
                    newReport.save();
                  }
                  req.flash('success', 'Report sent. We\'re on it.');
                  res.redirect('back');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.post('/:username/:id/update', (req, res)=>{
  let title = req.body.name,
      description = req.body.description.slice(0, 200),
      tags = req.body.tags.split(/\s*#/),
      NSFW = true,
      stop = req.body.stop,
      alt_text = req.body.alt,
      update = {title,description,tags,alt_text};
  if(req.body.commNSFW == 'no'){
    NSFW = false;
  }
  update.NSFW = NSFW;
  if(stop == ''){
    Gallery.findOne({_id:req.params.id}, (err, foundGallery)=>{
      if(err){
        error(req, res, err);
      } else if(foundGallery.artist.toString() != req.user._id.toString()){
        error(req, res, 'That\'s not yours to edit.');
      } else {
        Gallery.findOneAndUpdate({_id:req.params.id}, update, (err, updatedGallery)=>{
          if(err){
            error(req, res, err);
          } else {
            update.objectID = updatedGallery._id;
            artIndex.partialUpdateObject(update, (err, response)=>{
              if(err){
                error(req, res, err);
              }
            });
            req.flash('success', 'Updated!');
            res.redirect('back');
          }
        });
      }
    });
  } else {
    req.flash('error', 'Get thee hence, robot!');
    res.redirect('/logout');
  }
});
      
module.exports = router;

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
function renderGallery (req, res, foundUser, foundGallery, age){
  let galleryUpdate = {
    objectID: foundGallery._id,
    views: foundGallery.views + 1
  },
      description,
      title;
      
  if(foundGallery.title){
    title = foundGallery.title;
  } else {
    title = `${foundGallery.artist.username}'s Gallery`;
  }
  if(foundGallery.description){
    description = foundGallery.description;
  } else {
    description = `${foundGallery.artist.username}'s Gallery Piece`;
  }
  analytic(req, res, null, foundGallery._id.toString(), 'views', 1);
  foundGallery.views = foundGallery.views + 1;
  foundGallery.save();
  artIndex.partialUpdateObject(galleryUpdate, (err, response)=>{
    if(err){
      error(req, res, err);
    }
  });
  res.render('./showPages/gallery', {title, css_js:'gallery', gallery:foundGallery, url:`/${foundGallery.artist.username}/${foundGallery._id}`, image:foundGallery.image.url, description, age});
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
                      User.findOne({_id:user}, (err, foundUser)=>{
                        if(err){
                          error(req, res, err);
                        } else {
                          foundUser.analytics.push(newYear);
                          foundUser.save();
                        }
                      });
                    } else {
                      Gallery.findOne({_id:gallery}, (err, foundGallery)=>{
                        if(err){
                          error(req, res, err);
                        } else {
                          foundGallery.analytics.push(newYear);
                          foundGallery.save();
                        }
                      });
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
                    console.log(newDay);
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