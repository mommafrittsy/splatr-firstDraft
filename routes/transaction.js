const express = require('express'),
      router  = express(),
      date = new Date(),
      // Uploads
      azure = require("azure-storage"),
      multer = require('multer'),
      streamifier = require('streamifier'),
      crypto = require('crypto-random-string'),
      storageAccount = process.env.AZURE_STORAGE_ACCOUNT,
      storageKey = process.env.AZURE_STORAGE,
      azureEndpoint = process.env.AZURE_STORAGE_ENDPOINT,
      blobClient = azure.createBlobService(storageAccount, storageKey),
      // search
      search = require('algoliasearch'),
      client = search('', process.env.ALGOLIA),
      galleryIndex = client.initIndex('galleries'),
      userIndex = client.initIndex('users'),
      transIndex = client.initIndex('transactions'),
      // Stripe
      stripe = require('stripe')(process.env.STRIPE),
      // Models
      Comment = require('../models/comment.js'),
      Commission = require('../models/commission.js'),
      Gallery = require('../models/gallery.js'),
      Transaction = require('../models/transaction.js'),
      Notification = require('../models/notification.js'),
      SplatrError = require('../models/error.js'),
      User = require('../models/user.js'),
      months = ['January', 'February', 'March','April','May','June','July','August','September','October','November','December'];

router.use((req, res, next)=>{
  if(!req.user){
    req.flash('error', 'You need to be logged in.');
    res.redirect('/login');
  } else {
    next();
  }
});
router.get('/:id', (req, res)=>{
  Transaction.findById(req.params.id)
  .populate({
    path:'comments',
    populate:{path:'from'}
  })
  .populate('final')
  .exec((err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else if(foundTrans == null){
      res.redirect('/404');
    } else if(!foundTrans.viewable_by.includes(req.user._id.toString())){
      req.flash('error', 'This is not yours to view.');
      res.redirect('back');
    } else {
      User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findOne({_id:foundTrans.client.id}, (err, foundClient)=>{
            if(err){
              error(req, res, err);
            } else {
              res.render('./showPages/transaction', {title:`${foundClient.username} & ${foundArtist.username}`, css_js:'transaction', trans:foundTrans, datify: dateFormat});
            }
          });
        }
      });
    }
  });
});
router.post('/:id/references', multer().array('refInput'), (req, res)=>{
  Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else if(foundTrans == null){
      error(req, res, 'We couldn\'t find that.');
    } else {
      User.findOne(req.user._id,(err, foundClient)=>{
        if(err){
          error(req, res, err, foundTrans._id);
        } else if(foundTrans.client.id != foundClient._id.toString() || ['declined','closed'].includes(foundTrans.status)){
          error(req, res, 'You can give references for this project.');
        } else {
          User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Notification.create({from:foundClient,date,text:`${foundClient.username} uploaded some references`,transaction:foundTrans,type:'references', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  foundArtist.notifications.unshift(newNote);
                  foundArtist.save();
                  req.files.forEach((file)=>{
                    let stream = streamifier.createReadStream(file.buffer),
                        random = Math.random().toString(36).substring(7, 27),
                        time  = new Date().getTime(),
                        id = `${req.user._id + time + random}.png`,
                        container = 'references',
                        url   = `${azureEndpoint}${container}/${id}`,
                        options =  {
                          contentSettings:{
                              contentType: "image/png"
                          },
                          metadata: {fileName:id}
                        };
                    blobClient.createBlockBlobFromStream(container, id, stream, file.size, options, (err)=>{
                      if(err != null){
                        error(req, res, err, foundTrans._id);
                      } else {
                        let reference = {id, url};
                        foundTrans.reference.unshift(reference);
                        foundTrans.save();
                      }
                    });
                  });
                  req.flash('success', 'References added!');
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
router.post('/:id/accept', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err);
        } else if(foundTrans.artist.id != foundArtist._id.toString() || !foundTrans.dates.declined){
          error(req, res, 'You can\'t accept this project.');
        } else {
          User.findOne({_id:foundTrans.client.id}, (err, foundClient)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Notification.create({from:foundArtist,date,text:`${foundArtist.username} accepted your commission request.`,transaction:foundTrans,type:'accept', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  Commission.findOne({_id:foundTrans.type.id}, (err, foundComm)=>{
                    if(err){
                      error(req, res, err, foundTrans._id);
                    } else {
                      let transUpdate = {
                        objectID:foundTrans._id,
                        status: 'accept',
                        activity:  Date.parse(date)
                      };
                      analytic(req, res, foundArtist._id.toString(), null, 'accepted', 1);
                      if(foundComm.available && foundComm.available > 0){
                        foundComm.available = foundComm.available - 1;
                        foundComm.save();
                      } else if (foundComm.available != undefined && foundComm.available <= 0){
                        error(req, res, 'That commission is no longer available.', foundTrans._id);
                      }
                      foundClient.notifications.unshift(newNote);
                      foundTrans.dates.activity = date;
                      foundTrans.status = 'accept';
                      foundTrans.dates.accept = new Date(Date.now());
                      foundClient.save();
                      foundTrans.save();
                      transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                        if(err){
                          error(req, res, err, foundTrans._id);
                        }
                      });
                      req.flash('success', 'Accepted!');
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
router.post('/:id/comment', (req, res)=>{
  let content = req.body.comment;
  Transaction.findById(req.params.id, (err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findOne({_id:req.user._id}, (err, foundCommenter)=>{
        if(err){
          error(req, res, err, foundTrans._id);
        } else {
          let recipient;
          if(foundTrans.artist.id == req.user._id.toString()){
            recipient = foundTrans.client.id;
          } else if(foundTrans.client.id == req.user._id.toString()){
            recipient = foundTrans.artist.id;
          } else {
            error(req, res, 'Sorry. Public comment isn\'t allowed on transactions', foundTrans._id);
          }
          User.findOne({_id:recipient}, (err, foundRecipient)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Comment.create({from:foundCommenter._id, date, content}, (err, newComment)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  Notification.create({from:foundCommenter._id, date, transaction:foundTrans._id, comment:newComment._id, text:`${foundCommenter.username} commented on your transaction.`,type:'transComment', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                    if(err){
                      error(req, res, err, foundTrans._id);
                    } else {
                      foundRecipient.notifications.unshift(newNote._id);
                      foundRecipient.save();
                      foundTrans.comments.push(newComment._id);
                      foundTrans.save();
                      req.flash('success', 'You tell \'em! (in a nice way that doesn\'t violate our ToS, of course.)');
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
router.post('/:id/decline', (req, res)=>{ 
  User.findOne({_id:req.user._id}, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err, foundTrans._id);
        } else if(!foundTrans){
          error(req, res, 'We could not find that project.');
        } else if(foundTrans.artist.id != foundArtist._id.toString() || foundTrans.status != 'requested'){
          error(req, res, 'That\'s not yours to decline.');
        } else {
          User.findById(foundTrans.client.id, (err, foundClient)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Notification.create({from:foundArtist,date,transaction:foundTrans,type:'decline',text:`${foundArtist.username} declined your commission request.`, url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  let transUpdate = {
                    objectID: foundTrans._id,
                    status: 'declined',
                    activity: Date.parse(date)
                  };
                  analytic(req, res, foundArtist._id.toString(), null, 'declined', 1);
                  foundClient.notifications.unshift(newNote);
                  foundTrans.status = 'declined';
                  foundTrans.dates.activity = date;
                  foundTrans.dates.declined = date;
                  foundClient.save();
                  foundTrans.save();
                  transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err, foundTrans._id);
                    }
                  });
                  req.flash('success', 'Declined.');
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
router.get('/:id/deposit', (req, res)=>{
  Transaction.findById(req.params.id)
  .exec((err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundTrans.client.id == req.user._id.toString()){
        if(!foundTrans.deposit.id){
          User.findOne({_id:foundTrans.client.id}, (err, foundClient)=>{
            if(err){
              error(req, res, err);
            } else {
              User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
                if(err){
                  error(req, res, err);
                } else {
                  if(foundClient.stripe.customerID){
                    stripe.customers.listCards(foundClient.stripe.customerID, (err, cardList)=>{
                      if(err){
                        error(req, res, err, foundTrans._id);
                      } else {
                        User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
                          if(err){
                            error(req, res, err);
                          } else {
                            res.render('deposit', {title:`${foundTrans.client.username} & ${foundTrans.artist.username}`, css_js:'transaction', stripe:true, trans: foundTrans, cards:cardList.data, client:foundClient, artist:foundArtist});
                          }
                        });
                      }
                    });
                  } else {
                    res.render('deposit', {title:`${foundTrans.client.username} & ${foundTrans.artist.username}`, css_js:'transaction', stripe:true, trans: foundTrans, client:foundClient, artist:foundArtist, cards:null});
                  }
                }
              });
            }
          });
        } else {
          res.render('depositPaid', {title:`${foundTrans.client.username} & ${foundTrans.artist.username}`, css_js:'transaction', stripe:true, trans:foundTrans.deposit, comm:foundTrans.type.name, id:foundTrans._id});
        }
      } else {
        error(req, res, 'You\'re not allowed there.', foundTrans._id);
      }
    }
  });
});
router.post('/:id/preview', multer().array('prevInput'), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err);
        } else if(foundArtist._id.toString() != foundTrans.artist.id){
          error(req, res, 'Please don\'t post things to someone else\'s project.');
        } else {
          User.findOne({_id:foundTrans.client.id}, (err, foundClient)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Notification.create({from:foundArtist,date,transaction:foundTrans,type:'preview',text:`${foundArtist.username} posted a preview of your commission.`, url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  let transUpdate = {
                        objectID: foundTrans._id,
                        status: 'preview',
                        activity: Date.parse(date)
                      };
                  transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err, foundTrans._id);
                    }
                  });
                  for(let img of req.files){
                    let stream = streamifier.createReadStream(img.buffer),
                        id  = `prev_${crypto(24)}.png`,
                        container = 'previews',
                        url   = `${azureEndpoint + container}/${id}`,
                        options =  {
                          contentSettings:{
                              contentType: "image/png"
                          },
                          metadata: {fileName:id}
                        };
                    blobClient.createBlockBlobFromStream(container, id, stream, req.file.size, options, (err, response)=>{
                      if(err){
                        error(req, res, err, foundTrans._id);
                      } else {
                        foundTrans.preview.push({id, url});
                        foundTrans.save();
                      }
                    });
                  }
                  foundClient.notifications.unshift(newNote);
                  foundTrans.dates.activity = date;
                  foundTrans.dates.preview = date;
                  foundTrans.status = 'preview';
                  foundClient.save();
                  foundTrans.save();
                  req.flash('success', 'It\'s looking good!');
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
router.post('/:id/preview/accept', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundClient)=>{
      if(err){
        error(req, res, err);
      } else {
        Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
          if(err){
            error(req, res, err);
          } else if(foundClient._id.toString() != foundTrans.client.id){
            error(req, res, 'Please don\'t edit someone else\'s project.');
          } else {
            User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
              if(err){
                error(req, res, err);
              } else {
                Notification.create({from:foundClient,date,transaction:foundTrans,type:'previewAccept',text:`${foundClient.username} accepted the preview of your commission.`, url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    let transUpdate = {
                      objectID: foundTrans._id,
                      status: 'previewAccept',
                      activity: Date.parse(date)
                    };
                    foundArtist.notifications.unshift(newNote);
                    foundTrans.dates.activity = date;
                    foundTrans.dates.previewAccept = date;
                    foundTrans.status = 'previewAccept';
                    foundArtist.save();
                    foundTrans.save();
                    transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                      if(err){
                        error(req, res, err);
                      }
                    });
                    req.flash('success', 'On to the final!');
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
router.get('/:id/payment', (req, res)=>{
  Transaction.findById(req.params.id)
  .populate('final')
  .exec((err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundTrans.client.id == req.user._id.toString()){
        if(foundTrans.dates.final && !foundTrans.dates.paid){
          User.findOne({_id:req.user._id}, (err, foundClient)=>{
            if(err){
              error(req, res, err);
            } else {
              User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let cards;
                  if(foundClient.stripe.customerID){
                    stripe.customers.retrieve(foundClient.stripe.customerID, (err, customer)=>{
                      if(err){
                        error(req, res, err);
                      } else {
                        cards = customer.sources.data;
                        res.render('payment', {title:`${foundTrans.client.username} & ${foundTrans.artist.username}`, css_js:'transaction', stripe:true, trans: foundTrans, cards, artist:foundArtist, client:foundClient});
                      }
                    });
                  } else {
                    res.render('payment', {title:`${foundTrans.client.username} & ${foundTrans.artist.username}`, css_js:'transaction', stripe:true, trans: foundTrans, cards, artist:foundArtist, client:foundClient});
                  }
                }
              });
            }
          });
        } else {
          res.render('paymentPaid', {title:`${foundTrans.client.username} & ${foundTrans.artist.username}`, css_js:'transaction', trans:foundTrans.payment, comm:foundTrans.type.name, id:foundTrans._id});
        }
      } else {
        error(req, res, 'You\'re not allowed there.');
      }
    }
  });
});
router.post('/:id/final', multer().array('finalImg'), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err, foundTrans._id);
        } else if(!foundTrans){
          error(req, res, 'Couldn\'t find that transaction.');
        } else if(foundTrans.artist.id != foundArtist._id.toString()){
          error(req, res, 'Please don\'t edit someone else\'s project.');
        } else {
          User.findOne({_id:foundTrans.client}, (err, foundClient)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Commission.findOne({_id:foundTrans.type.id}, (err, foundComm)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  Gallery.create({artist:foundArtist._id,created:date,NSFW:foundComm.NSFW}, (err, newGal)=>{
                    if(err){
                      error(req, res, err, foundTrans._id);
                    } else {
                      Notification.create({from:foundArtist,date,transaction:foundTrans,gallery:newGal,type:'final', text:`${foundArtist.username} completed your commission!`, url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                        if(err){
                          error(req, res, err, foundTrans._id);
                        } else {
                          let galleryObject = {
                                objectID:newGal._id,
                                type: foundComm.type,
                                url: `gallery/${foundArtist.username}/${newGal._id}`,
                                artist: foundArtist.username,
                                NSFW: foundComm.NSFW
                              },
                              transUpdate = {
                                objectID: foundTrans._id,
                                status: 'final',
                                activity: Date.parse(date)
                              };    
                          for(let img of req.file){
                            let stream = streamifier.createReadStream(img.buffer),
                                id = `final_${crypto(24)}.png`,
                                container = 'finals',
                                url = `${azureEndpoint + container}/${id}`,
                                options = {
                                  contentSettings: {
                                    contentType: 'image/png'
                                  },
                                  metadata: {fileName:id}
                                };
                            blobClient.createBlockBlobFromStream(container, id, stream, img.size, options, (err, response)=>{
                              if(err != null){
                                error(req, res, err);
                              } else {
                                if(req.files.indexOf(img)==0){
                                  galleryObject.image = url;
                                }
                                newGal.image.push({id, url});
                                newGal.save();
                              }
                            });
                          }
                          analytic(req, res, foundArtist._id.toString(), null, 'finalized', 1);
                          foundClient.notifications.unshift(newNote);
                          foundArtist.gallery.commissioned.unshift(newGal);
                          foundTrans.dates.activity = date;
                          foundTrans.dates.final = date;
                          foundTrans.status = 'final';
                          foundTrans.final = newGal;
                          foundArtist.save();
                          foundClient.save();
                          foundTrans.save();
                          galleryIndex.addObject(galleryObject, (err, response)=>{
                            if(err){
                              error(req, res, err);
                            }
                          });
                          transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                            if(err){
                              error(req, res, err);
                            }
                          });
                          req.flash('success', 'Wow! That look\'s awesome!');
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
  });
});
router.post('/:id/review', (req, res)=>{
  let rating = req.body.rating,
      review = req.body.review;
      
  User.findOne({_id:req.user._id}, (err, foundClient)=>{
    if(err){
      error(req, res, err);
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err, foundTrans._id);
        } else if(!foundTrans){
          error(req, res, 'Couldn\'t find that.');
        } else if(foundTrans.client.id != foundClient._id){
          error(req, res, 'Please don\'t review someone else\'s project unless you\'re paying for it.');
        } else {
          User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
            if(err){
              error(req, res, err, foundTrans._id);
            } else {
              Notification.create({from:foundClient, date ,transaction:foundTrans,type:'review', text:`${foundClient.username} reviewed your commission!`, url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err, foundTrans._id);
                } else {
                  let userUpdate = {
                    objectID: foundArtist._id,
                  },
                  rateArray = 0,
                  searchRating,
                  transUpdate = {
                    objectID: foundTrans._id,
                    status: 'closed',
                    activity: Date.parse(date)
                  };
                  for(let rate of foundArtist.rating){
                    rateArray += Number(rate);
                  }
                  searchRating = rateArray/(foundArtist.rating.length ++);
                  foundTrans.rating = rating;
                  foundTrans.review = review;
                  foundTrans.dates.review = date;
                  foundTrans.dates.activity = date;
                  foundTrans.status = 'closed';
                  foundArtist.notifications.unshift(newNote);
                  foundArtist.completed.unshift(foundTrans);
                  foundArtist.rating.push(rating);
                  foundTrans.save();
                  foundArtist.save();
                  userUpdate.rating = searchRating;
                  userIndex.partialUpdateObject(userUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                  transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                  req.flash('success', 'Reviewed!');
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

module.exports = router;

function error(req, res, err, trans){
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
  if(trans){
    Transaction.findById(trans, (err, foundTrans)=>{
      if(err){
        console.log(err);
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        errorObj.transaction = foundTrans._id;
      }
    });
  }
  console.log(err);
  SplatrError.create(errorObj, (err, newError)=>{
    if(err){
      console.log(err);
    } else {
      if(newError.message){
        req.flash('error', newError.message);
      } else {
        req.flash('error', newError);
      }
      if(req.get('Referer')){
        res.redirect('back');
      } else {
        res.redirect('/404');
      }
    }
  });
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
            Month.create({date:today, gallery, user},(err, newMonth)=>{
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
                    newMonth.days.push(newDay);
                    foundYear.months.push(newMonth);
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
function dateFormat(date, locale){
  let computed_date = new Date(date),
      year = computed_date.getFullYear(),
      month = months[computed_date.getMonth()],
      day = computed_date.getDate(),
      full_date;
      
  if(locale == 'US'){
    full_date = `${month} ${day}, ${year}`;
  } else {
    full_date = `${day} ${month} ${year}`;
  }
  return full_date;
}