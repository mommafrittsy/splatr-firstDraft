const express = require('express'),
      router = express.Router(),
      date = new Date(),
      multer  = require('multer'),
      // emails
      mailjet = require('node-mailjet').connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE),
      // Search
      search = require('algoliasearch'),
      client = search('LKDIWAGI3B', process.env.ALGOLIA),
      transIndex = client.initIndex('transactions'),
      payIndex = client.initIndex('payouts'),
      // Stripe
      stripe = require('stripe')(process.env.STRIPE),
      streamifier = require('streamifier'),
      crypto = require('crypto-random-string'),
      // Models
      User = require('../models/user.js'),
      Gallery = require('../models/gallery.js'),
      Transaction = require('../models/transaction.js'),
      Commission = require('../models/commission.js'),
      Notification = require('../models/notification.js'),
      Payout = require('../models/payout.js'),
      SplatrError = require('../models/error.js');

router.use((req, res, next)=>{
   if(!req.user){
    res.status(400).send('You need to be logged in.');
  } else {
    next();
  }
});  

router.put('/complete', multer().fields([]),(req, res)=>{
  Transaction.findById(req.body.id,(err,foundTrans)=>{
    if(err){
      error(req, res, err.message);
    } else {
      if(foundTrans.client.id != req.user._id.toString()){
        error(req, res, 'You don\'t have to pay for that.');
      } else if(!foundTrans.dates.final || foundTrans.payment.id){
        error(req, res, 'That is not ready to be paid.');
      } else {
        Gallery.findOne({_id:foundTrans.final}, (err, foundGallery)=>{
          if(err){
            error(req, res, err);
          } else {
            Commission.findOne({_id:req.body.type}, (err, foundComm)=>{
              if(err){
                error(req, res, err.message);
              } else {
                User.findOne({_id:req.user._id}, (err, foundClient)=>{
                  if(err){
                    error(req, res, err.message);
                  } else {
                    User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
                      if(err){
                        error(req, res, err.message);
                      } else {
                        Notification.create({from:foundClient._id, date, text:`${foundClient.username} completed payment on your commission.`, transaction:foundTrans._id, type:'paid', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                          if(err){
                            error(req, res, err.message);
                          } else {
                            let transUpdate = {
                              objectID: foundTrans._id,
                              status: 'paid',
                              activity: Date.parse(date)
                            },
                                amount = foundComm.price - foundTrans.deposit.amount,
                                charge = {
                                  amount,
                                  currency: 'USD',
                                  description:`Final Payment on a Commission from ${foundArtist.username}`,
                                  destination: {
                                    account:req.body.account,
                                    amount:amount*.88
                                  }
                                };
                            transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                              if(err){
                                error(req, res, err);
                              }
                            });
                            foundArtist.notifications.unshift(newNote);
                            foundArtist.save();
                            if(req.body.customer != null){
                              charge.customer = req.body.customer;
                              if(req.body.newCard == false){
                                charge.source = req.body.source;
                                completePayment(req, res, foundTrans, charge,foundArtist,{email:foundClient.email,username:foundClient.username}, foundComm.name, foundGallery);
                              } else if(req.body.save == true){
                                stripe.customers.createSource(req.body.customer, {source:req.body.source}, (err, newSource)=>{
                                  if(err){
                                    error(req, res, err.message);
                                  } else {
                                    charge.source = newSource.id;
                                    completePayment(req, res, foundTrans, charge,foundArtist,{email:foundClient.email,username:foundClient.username}, foundComm.name, foundGallery);
                                  }
                                });
                              } else if(req.body.save == false){
                                stripe.sources.create({
                                  type:'card',
                                  currency:foundArtist.currency,
                                  amount,
                                  owner:{
                                    email:foundClient.email
                                  },
                                  statement_descriptor: `Final Payment for a Commission from ${foundArtist.username}`,
                                  token: req.body.source,
                                  usage: 'single_use'
                                }, (err, newSource)=>{
                                  if(err){
                                    error(req, res, err.message);
                                  } else {
                                    charge.source = newSource.id;
                                    completePayment(req, res, foundTrans, charge,foundArtist,{email:foundClient.email,username:foundClient.username}, foundComm.name, foundGallery);
                                  }
                                });
                              }
                            } else {
                              if(req.body.save == true){
                                stripe.customers.create({
                                  email:foundClient.email,
                                  source: req.body.source,
                                  metadata:{
                                    username:foundClient.username
                                  }
                                })
                                .then((acct)=>{
                                  foundClient.stripe.customerID = acct.id;
                                  foundClient.save();
                                  charge.customer = acct.id;
                                  completePayment(req, res, foundTrans, charge,foundArtist,{email:foundClient.email,username:foundClient.username}, foundComm.name, foundGallery);
                                })
                                .catch((err)=>{
                                  error(req, res, err.message);
                                });
                              }
                              else {
                                stripe.sources.create({
                                  type:'card',
                                  currency: foundArtist.currency,
                                  amount,
                                  owner:{
                                    email:foundClient.email
                                  },
                                  statement_descriptor:`Final Payment for a Commission from ${foundArtist.username}`,
                                  token: req.body.source,
                                  usage: 'single_use'
                                }, (err, newSource)=>{
                                  if(err){
                                    error(req, res, err.message);
                                  } else {
                                    charge.source = newSource.id;
                                    completePayment(req, res, foundTrans, charge,foundArtist,{email:foundClient.email,username:foundClient.username}, foundComm.name, foundGallery);
                                  }
                                });
                              }
                            }
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
    }
  });
});
router.put('/deposit', multer().fields([]), (req, res)=>{
  Transaction.findById(req.body.id, (err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundTrans.client.id != req.user._id.toString()){
        error(req, res, 'You\'re not supposed to pay for that.');
      } else if(foundTrans.deposit.id || ['requested','closed','declined'].includes(foundTrans.status)) {
        error(req, res, 'That is not ready for a deposit');
      } else {
        Commission.findById(req.body.type, (err, foundComm)=>{
          if(err){
            error(req, res, err);
          } else {
            User.findOne({_id:req.user._id}, (err, foundClient)=>{
              if(err){
                error(req, res, err);
              } else {
                User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    Notification.create({from:foundClient._id, date, text:`${foundClient.username} placed a deposit on your commission.`, transaction:foundTrans, type:'paid', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                      if(err){
                        error(req, res, err);
                      } else {
                        let transUpdate = {
                          objectID: foundTrans._id,
                          status: 'deposit',
                          activity: Date.parse(date)
                        };
                        transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                          if(err){
                            error(req, res, err);
                          }
                        });
                        let deposit = foundComm.price/2,
                            charge = {
                              amount:deposit,
                              currency: 'USD',
                              description: `Deposit for a Commission from ${foundArtist.username}`,
                              destination:{
                                account:req.body.account,
                                amount:deposit*.88
                              }
                            };
                        foundArtist.notifications.unshift(newNote);
                        foundArtist.save();
                        if(req.body.source && req.body.save == true && req.body.customer == null){
                          stripe.customers.create({
                            email:foundClient.email,
                            source: req.body.source,
                            metadata:{
                              username:foundClient.username
                            }
                          })
                          .then((acct)=>{
                            foundClient.stripe.customerID = acct.id;
                            foundClient.save();
                            charge.customer = acct.id;
                            makeDeposit(req, res, foundTrans, charge,foundArtist, foundClient, foundComm);
                          })
                          .catch((err)=>{
                            error(req, res, err);
                          });
                        } else if(req.body.customer != null) {
                          charge.customer = req.body.customer;
                          if(req.body.newCard == false || req.body.newCard == 'false'){
                            charge.source = req.body.source;
                            makeDeposit(req, res, foundTrans, charge,foundArtist, foundClient, foundComm);
                          } else if(req.body.save == true || req.body.save == 'true') {
                            stripe.customers.createSource(req.body.customer, {source:req.body.source}, (err, newSource)=>{
                              if(err){
                                error(req, res,err);
                              } else {
                                charge.source = newSource.id;
                                makeDeposit(req, res, foundTrans, charge,foundArtist, foundClient, foundComm);
                              }
                            });
                          } else if(req.body.save == false || req.body.save == 'false'){
                            stripe.sources.create({
                              type:'card',
                              currency:foundArtist.currency,
                              amount: deposit,
                              owner:{
                                email:foundClient.email
                              },
                              statement_descriptor:`Deposit for Commission from ${foundArtist.username}`,
                              token: req.body.source,
                              usage:'single_use'
                            }, (err, newSource)=>{
                              if(err){
                                error(req, res, err);
                              } else {
                                charge.source = newSource.id;
                                makeDeposit(req, res, foundTrans, charge,foundArtist, foundClient, foundComm);
                              }
                            });
                          }
                          else {
                            res.status(200).send('Something happened.');
                          }
                        } else if(req.body.source && req.body.save == false){
                          stripe.sources.create({
                            type:'card',
                            currency:foundArtist.currency,
                            amount: deposit,
                            owner:{
                              email:foundClient.email
                            },
                            statement_descriptor:`Deposit for Commission from ${foundArtist.username}`,
                            token: req.body.source,
                            usage: 'single_use'
                          }, (err, newSource)=>{
                            if(err){
                              error(req, res, err);
                            } else {
                              charge.source = newSource.id;
                              makeDeposit(req, res, foundTrans, charge,foundArtist, foundClient, foundComm);
                            }
                          });
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  });
});
router.post('/payout', multer().fields([]), (req, res)=>{
  User.findById(req.user._id)
  .populate({
      path:'transactions', 
      populate: {path:'type'}
    })
    .exec((err, foundUser)=>{
    if(err){
      error(req, res, err.message);
    } else if(req.body.stripe_account.toString() !== foundUser.stripe.id.toString()){
      error(req, res, 'You cannot take that person\'s money!');
    } else {
      // Retrieve account balance and check that the amount it under the available minus the reserve.
      stripe.balance.retrieve({
        stripe_account: foundUser.stripe.id
      }, (err, balance)=>{
        if(err){
          error(req, res, err.message);
        } else {
          let reserved_balance,
              available;
          for(let trans of foundUser.transactions){
            if(trans.artist._id.toString() == req.user._id.toString()){
              if(!['request','accept','paid','closed','declined'].includes(trans.status)){
                reserved_balance = reserved_balance + (trans.type.price/2);
              }
            }
          }
          available = balance.available[0].amount - reserved_balance;
          if(req.body.amount > available){
            let overage = available - req.body.amount, 
                err = 'You do not have that much money to withdraw.';
            res.status(400).json({overage,err});
          } else {
            stripe.payouts.create({
              amount:req.body.amount,
              currency:'USD'
            },{
              stripe_account:foundUser.stripe.id
            })
            .then((payout)=>{
              let payoutInfo = {
                    amount:payout.amount,
                    created: payout.created,
                    external_account: payout.destination,
                    id: payout.id,
                    payee: foundUser._id,
                    viewable_by: foundUser._id.toString()
                  };
              Payout.create(payoutInfo, (err, newPayout)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let payoutObj = {
                    objectID: newPayout._id,
                    id: newPayout.id,
                    amount: newPayout.amount,
                    created: newPayout.created,
                    viewable_by: foundUser._id
                  };
                  payIndex.addObject(payoutObj, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      stripe.accounts.retrieveExternalAccount(foundUser.stripe.id,newPayout.external_account, (err, account)=>{
                        if(err){
                          error(req, res, err);
                        } else {
                          let dateMS = new Date(payout.created*1000),
                              months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                              month = months[dateMS.getMonth()],
                              day = dateMS.getDay(),
                              year = dateMS.getFullYear(),
                              fullDate = `${month} ${day}, ${year}`,
                              email = {
                            'Messages':[{
                              'From':{
                                'Email':'payouts@splatr.art',
                                'Name':'Splatr Team'
                              },
                              'To':[{
                                'Email':foundUser.email,
                                'Name': foundUser.username
                              }],
                              'Subject': 'Payout Underway!',
                              'TextPart': `Hey ${foundUser.username}, We've begun processing your payout request. Please allow two business days for the funds to arrive in your account.`,
                              'HTMLPart':`<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Your Payout Is Underway</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a, address,th, td {font-family: "Roboto", sans-serif;text-decoration:none;font-style: normal;}small, th{font-size:8pt;text-align:center;margin-top:15px;}th{border-top: 1px solid #aaa;border-bottom: 1px solid #aaa;color: #aaa;}.center{text-align:center;}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="25px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><p><small>Payout ID:${newPayout._id}</small></p></td></tr></table></td></tr><tr><td><table width="100%" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Hey ${foundUser.username},</h1><p>We've begun processing your payout request.</p><p>Please allow two (2) business days for the funds to arrive in your account.</p></td></tr><tr><td><table width="100%" cellpadding="15px" cellspacing="0" align="center"><tr><th>Request Accepted:</th><th>Amount Requested:</th><th>Payout Account:</th></tr><tr><td class="center">${fullDate}</td><td class="center">$${(payout.amount/100).toFixed(2)}</td><td class="center">****${account.last4}</td></tr></table></td></tr></table></td></tr><tr><td><table width="100%" cellpadding="15px" align="left"><tr><td><p><small>You can manage all your payouts and transactions from <a href="https://splatr.art/dash">your Dash.</a></small></p><p><small>Please do not respond to this email. It comes from an unattended mailbox and you will never get a response.</small></p><address><small>Copyright &#9400; 2018 Splatr, LLC.<br>511 Congress Street, Suite 700 | Portland, Maine 04101-3428</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
                            }]
                          };
                          mailjet
                          .post('send',{'version':'v3.1'})
                          .request(email)
                          .then((result)=>{
                            res.status(200).json(payout);
                          })
                          .catch((err)=>{
                            error(req, res, err.message);
                          });
                        }
                      });
                    }
                  });
                }
              });
            });
          }
        }
      });
    }
  });
});
router.delete('/remove/card', multer().fields([]), (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(req.body.accountID != foundUser.stripe.customerID) {
      error(req, res, 'This is not yours to delete.');
    } else {
      stripe.customers.deleteCard(req.body.accountID, req.body.externalID, (err, confirmation)=>{
        if(err){
          error(req, res, err);
        } else {
          if(confirmation.deleted == true){
            res.status(200).send('Deleted.');
          } else {
            error(req, res, confirmation);
          }
        }
      });
    }
  });
});
router.delete('/remove/external_account', multer().fields([]), (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err.message);
    } else if(foundUser.stripe.id != req.body.accountID){
      console.log(foundUser.stripe.id);
      console.log(req.body.accountID);
      error(req, res, 'This is not yours to delete.');
    } else {
      stripe.accounts.deleteExternalAccount(req.body.accountID, req.body.externalID, (err, confirm)=>{
        if(err){
          error(req, res, err);
        } else {
          res.status(200).send('Done.');
        }
      });
    }
  });
});
router.put('/update/external_account', multer().fields([]), (req, res)=>{
  let data = {
    external_account:req.body.accountToken
  };
  if(req.body.default == true){
    data.default_for_currency = true;
  }
  stripe.accounts
  .createExternalAccount(req.body.accountID, data, (err, bank_account)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findById(req.user._id, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else {
          if(foundUser.stripe.fields_needed.includes('external_account')){
            let index = foundUser.stripe.fields_needed.indexOf('external_account');
            foundUser.stripe.fields_needed.splice(index, 1);
            foundUser.save();
            res.status(200).send('Done');
          } else {
            res.status(200).send('Done');
          }
        }
      });
    }
  });
});
router.put('/update/id_document', multer().array('image'), (req,res)=>{
  let id_images = [];
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      for(let file of req.files){
        let stream = streamifier.createReadStream(file.buffer),
            fileName = `id_${crypto(36)}.png`;
        stripe.fileUploads.create({
          purpose:'identity_document',
          file:{
            data:stream,
            name: fileName,
            type:'application/octet-stream'
          }
        }, (err, fileUpload)=>{
          if(err){
            error(req, res, err);
          } else {
            id_images.push(fileUpload.id);
            if(req.files.length == id_images.length){
              stripe.accounts.update(foundUser.stripe.id,{
                legal_entity:{
                  verification: {
                    document: id_images[0],
                    document_back: id_images[1]
                  }
                }
              })
              .then((response)=>{
                if(response.legal_entity.verification.details != null){
                  res.status(200).send(response.legal_entity.verification.details);
                } else {
                  foundUser.stripe.fields_needed = response.verification.fields_needed;
                  foundUser.save();
                  res.status(200).send('Done.');
                }
              })
              .catch((err)=>{
                error(req, res, err);
              });
            }
          }
        });
      }
    }
  });
});
router.put('/update/user', multer().fields([]), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      if(['CA','HK','SG','US'].includes(foundUser.address.country.code)){
        stripe.accounts.update(foundUser.stripe.id,{
          legal_entity:{
            personal_id_number:req.body.token
          }
        })
        .then((response)=>{
          foundUser.stripe.fields_needed = response.verification.fields_needed;
          foundUser.stripe.due_by = response.verification.due_by;
          foundUser.save();
          res.status(200).send('Done.');
        })
        .catch((err)=>{
          error(req, res, err);
        });
      } else {
        res.status(200).send('Didn\'t really need that, but thanks anyway.');
      }
    }
  });
});

module.exports  = router;

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
        SplatrError.create(errorObj, (error, newError)=>{
          if(error){
            console.log(error);
          } else {
            res.status(400).send(newError.message);
          }
        });
      }
    });
  } else {
    console.log(err);
    SplatrError.create(errorObj, (error, newError)=>{
      if(error){
        console.log(error);
      } else {
        if(err.message){
          res.status(400).send(err.message);
        } else {
          res.status(400).send(err);
        }
      }
    });
  }
}
function makeDeposit(req, res, transaction, charge, artist, client, comm){
  stripe.charges.create(charge, (err, newCharge)=>{
    if(err){
      error(req, res, err);
    } else {
      let brand;
      if(newCharge.source.card){
        brand = newCharge.source.card.brand.toLowerCase();
        if(['visa', 'mastercard', 'discover', 'jcb'].includes(brand)){
          transaction.deposit.card.brand = brand;
        } else if(brand == 'american express'){
          transaction.deposit.card.brand = 'amex';
        } else if(brand == 'diners club'){
          transaction.deposit.card.brand = 'diners-club';
        }
        transaction.deposit.card.last4 = newCharge.source.card.last4;
      } else {
        brand = newCharge.source.brand.toLowerCase();
        if(['visa', 'mastercard', 'discover', 'jcb'].includes(brand)){
          transaction.deposit.card.brand = brand;
        } else if(brand == 'american express'){
          transaction.deposit.card.brand = 'amex';
        } else if(brand == 'diners club'){
          transaction.deposit.card.brand = 'diners-club';
        }
        transaction.deposit.card.last4 = newCharge.source.last4;
      }
      let dateMS = new Date(newCharge.created*1000),
          months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          month = months[dateMS.getMonth()],
          day = dateMS.getDate(),
          year = dateMS.getFullYear(),
          fullDate = `${month} ${day}, ${year}`,
          email = {
            'Messages':[{
              'From':{
                'Email':'team@splatr.art',
                'Name': 'Splatr Team'
              },
              'To': [{
                'Email': client.email,
                'Name': client.username
              }],
              'Subject': 'Thank you for your deposit!',
              'TextPart':`Your Deposit to ${artist.username} has been posted.`,
              'HTMLPart': `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Thank you for your deposit!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a, address,th, td {font-family: "Roboto", sans-serif;text-decoration:none;font-style: normal;}small, th{font-size:8pt;text-align:center;margin-top:15px}th{font-size: 8pt;border-top: 1px solid #aaa;border-bottom: 1px solid #aaa;color: #aaa;}.center{text-align:center;font-size: 10pt;}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="25px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><p><small><a href="https://splatr.art/transaction/${transaction._id}/deposit">View Receipt</a></small></p></td></tr></table></td></tr><tr><td><table width="100%" cellpadding="10px" cellspacing="0" align="center"><tr><td><h1>Hey ${client.username},</h1><p>Thank you for your deposit on ${artist.username}'s Commission!</p><p>Here's an quick rundown.</p></td></tr><tr><td><table width="100%" cellpadding="15px" cellspacing="0" align="center"><tr><th>Artist:</th><th>Commission:</th><th>Date Recieved:</th><th>Full Price:</th><th>Deposit Collected:</th></tr><tr><td class="center">${artist.username}</td><td class="center">${comm.name}</td><td class="center">${fullDate}</td><td class="center">${(comm.price/100).toFixed(2)}</td><td class="center" style="font-weight:700;">$${(newCharge.amount/100).toFixed(2)}</td></tr></table><table width="100%" align="right"><tr><td><p style="text-align:right;"><small>This will appear on your card statement as <em>Splatr - ${newCharge.description}</em></small></p></td></tr></table></td></tr></table></td></tr><tr><td><table width="100%" align="left"><tr><td><p><small>You can manage all your details on <a href="https://splatr.art/dash">your Dash.</a></small></p><p><small>Please do not respond to this email. It comes from an unattended mailbox and you will never get a response.</small></p><address><small>Copyright &#9400; 2019 Splatr, LLC.<br>1001 River Road | Brunswick, Maine 04011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
            }]
          };
      stripe.accounts.retrieve(artist.stripe.id, (err, stripeAccount)=>{
        if(err){
          error(req, res, err);
        } else {
          if(stripeAccount.verification.fields_needed.length != 0){
            artist.stripe.fields_needed = stripeAccount.verification.fields_needed;
            if(stripeAccount.verification.due_by){
              artist.stripe.due_by = stripeAccount.verification.due_by*1000;
            }
            artist.save();
          }
          mailjet
          .post('send', {'version':'v3.1'})
          .request(email)
          .then((result)=>{
            transaction.deposit.amount = newCharge.amount;
            transaction.deposit.date = newCharge.created;
            transaction.deposit.id = newCharge.id;
            transaction.dates.deposit = date;
            transaction.status = 'deposit';
            transaction.save();
            analytic(req, res, artist._id.toString(), null, 'deposits', newCharge.amount);
            res.status(200).json(newCharge);
          })
          .catch((err)=>{
            res.status(400).send(err.message);
          });
        }
      });
    }
  });
}
function completePayment(req, res, transaction, charge, artist, client, comm, gallery){
  stripe.charges.create(charge, (err, newCharge)=>{
    if(err){
      error(req, res, err);
    } else {
      let brand;
      if(newCharge.source.card){
        brand = newCharge.source.card.brand.toLowerCase();
        if(['visa', 'mastercard', 'discover', 'jcb'].includes(brand)){
          transaction.payment.card.brand = brand;
        } else if(brand == 'american express'){
          transaction.payment.card.brand = 'amex';
        } else if(brand == 'diners club'){
          transaction.payment.card.brand = 'diners-club';
        }
        transaction.payment.card.last4 = newCharge.source.card.last4;
      } else {
        brand = newCharge.source.brand.toLowerCase();
        if(['visa', 'mastercard', 'discover', 'jcb'].includes(brand)){
          transaction.payment.card.brand = brand;
        } else if(brand == 'american express'){
          transaction.payment.card.brand = 'amex';
        } else if(brand == 'diners club'){
          transaction.payment.card.brand = 'diners-club';
        }
        transaction.payment.card.last4 = newCharge.source.last4;
      }
      let dateMS = new Date(newCharge.created*1000),
          months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
          month = months[dateMS.getMonth()],
          day = dateMS.getDay(),
          year = dateMS.getFullYear(),
          email = {
            'Messages':[{
              'From':{
                'Email':'payments@splatr.art',
                'Name': 'Splatr Team'
              },
              'To':[{
                'Email': client.email,
                'Name': client.username
              }],
              'Subject': 'Thank You for Your Payment!',
              'TextPart':`Thank you for your payment on ${artist.username}'s Commission!This is the final payment on this commission.`,
              'HTMLPart':`<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Thank you for your payment!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a, address,th, td {font-family: "Roboto", sans-serif;text-decoration:none;font-style: normal;}small, th{font-size:8pt;text-align:center;margin-top:15px}th{font-size: 8pt;border-top: 1px solid #aaa;border-bottom: 1px solid #aaa;color: #aaa;}.center{text-align:center;font-size: 10pt;}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="25px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><p><small><a href="https://splatr.art/transaction/${transaction._id}/deposit">View Receipt</a></small></p></td></tr></table></td></tr><tr><td><table width="100%" cellpadding="10px" cellspacing="0" align="center"><tr><td><h1>Hey ${client.username},</h1><p>Thank you for your payment on ${artist.username}'s Commission!</p><p>This is the final payment on this commission.</p><p>Here's an quick rundown.</p></td></tr><tr><td><table width="100%" cellpadding="15px" cellspacing="0" align="center"><tr><th>Artist:</th><th>Commission:</th><th>Date Recieved:</th><th>Deposit Previously Collected:</th><th>Paid Today:</th><th>Total Paid:</th></tr><tr><td class="center">${artist.username}</td><td class="center">${comm}</td><td class="center">${month} ${day}, ${year}</td><td class="center">$${(transaction.deposit.amount/100).toFixed(2)}</td><td class="center" style="font-weight:700;">$${(newCharge.amount/100).toFixed(2)}</td><td class="center" style="font-weight:700;">$${((newCharge.amount+transaction.deposit.amount)/100).toFixed(2)}</td></tr></table><table width="100%" align="right"><tr><td><p style="text-align:right;"><small>This will appear on your card statement as <em>Splatr - ${newCharge.description}</em></small></p></td></tr></table></td></tr></table></td></tr><tr><td><table width="100%" align="left"><tr><td><p><small>You can manage all your details on <a href="https://splatr.art/dash">your Dash.</a></small></p><p><small>Please do not respond to this email. It comes from an unattended mailbox and you will never get a response.</small></p><address><small>Copyright &#9400; 2019 Splatr, LLC.<br>1001 River Road | Brunswick, Maine 04011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
            }]
      };
      stripe.accounts.retrieve(artist.stripe.id, (err, stripeAccount)=>{
        if(err){
          error(req, res, err);
        } else {
          if(stripeAccount.verification.fields_needed.length != 0){
            artist.stripe.fields_needed = stripeAccount.verification.fields_needed;
            if(stripeAccount.verification.due_by){
              artist.stripe.due_by = stripeAccount.verification.due_by*1000;
            }
            artist.save();
          }
          mailjet
          .post('send', {'version':'v3.1'})
          .request(email)
          .then((result)=>{
            gallery.paid = true;
            gallery.save();
            transaction.payment.amount = newCharge.amount;
            transaction.payment.date = newCharge.created;
            transaction.payment.id = newCharge.id;
            transaction.dates.paid = date;
            transaction.status = 'paid';
            transaction.save();
            analytic(req, res, artist._id.toString(), null, 'completed_payments', newCharge.amount);
            res.status(200).json(newCharge);
          })
          .catch((err)=>{
            res.status(400).send(err.message);
          });
        }
      });
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