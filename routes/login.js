const express =   require('express'),
      router  =   express.Router(),
      passport  =   require('passport'),
      date  = new Date(),
      // Search
      search = require('algoliasearch'),
      client  = search('LKDIWAGI3B', process.env.ALGOLIA),
      index = client.initIndex('users'),
      // Email
      mailjet = require('node-mailjet').connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE),
      crypto  = require('crypto-random-string'),
      // models
      User  =   require('../models/user.js'),
      SplatrError = require('../models/error.js');

// Passport Routes
// Facebook
router.get("/auth/facebook",
    passport.authenticate("facebook", {scope:["public_profile", "email"]}));
router.get("/auth/facebook/callback",
    passport.authenticate("facebook", {failureRedirect: "/login", failureFlash: true}),
    (req, res)=>{
      res.redirect("/dash");
    }
);  
// Google
router.get("/auth/google",
    passport.authenticate("google", {scope:["profile", "email"]}));
router.get("/auth/google/callback",
    passport.authenticate("google", {failureRedirect: "/login", failureFlash: true}),
    (req, res)=>{
      res.redirect("/dash");
    }
);
// Local
router.get('/login', (req, res)=>{
  let referer;
  if(req.user){
    res.redirect('/dash');
  } else {
    if(req.get('Referer') != ''){
      referer = req.get('Referer');
    }
    res.render('login', {title:'Welcome Back!', css_js:'login', verification:null, referer});
  }
});
router.post('/login', passport.authenticate('local', {
    failureRedirect:"back",
    failureFlash: true,
  }), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      foundUser.lastLogin = Date.now();
      foundUser.save();
      if(req.body.verifyCode && req.body.verifyCode != foundUser.crypto){
        req.flash('error', 'We could not verify your email.');
        res.redirect('/dash');
      } else if(req.body.verifyCode && foundUser.cryptoExpire < date){ 
        req.flash('error', 'Your verification code has expired.');
        res.redirect('/dash');
      } else if(req.body.verifyCode){
        foundUser.crypto = undefined;
        foundUser.cryptoExpire = undefined;
        foundUser.passwordReset.crypto = undefined;
        foundUser.passwordReset.expire = undefined;
        foundUser.verified.date = date;
        foundUser.verified.verified = true;
        foundUser.save();
        req.flash('success', 'Your email has been verified.');
        res.redirect('/dash');
      } else {
        req.flash('success', 'Welcome back.');
        if(req.body.referer){
          res.redirect(req.body.referer);
        } else {
          res.redirect('/dash');
        }
      }
    }
  });
});
router.get('/register', (req, res)=>{
  if(!req.user){
    res.render('signUp', {title:'Sign Up for Splatr.', css_js:'register', url:'https://splatr.art/register', image:'https://ayizan.blob.core.windows.net/site-images/Card.png', description:'Start your next art journey with us.'});
  } else {
    res.redirect('/dash');
  }
});
router.post('/register', (req, res)=>{
  let honeypot  = req.body.honeypot,
      email = req.body.email,
      usernameRaw = req.body.username.split(" "),
      username = usernameRaw.join('_'),
      password = req.body.password,
      reserved = ['login', 'register', 'about', 'find', 'legal', 'splatr', 'verify', 'faq'],
      newUser = {username, email, lastLogin: date};
  if(honeypot == ''){
    if(!reserved.includes(username)){
      User.findOne({email}, (err, conflictUser)=>{
        if(err){
          error(req, res, err);
        } else if(conflictUser) {
          error(req, res, 'Someone is using that email');
        } else {
          User.register(newUser, password, (err, newUser)=>{
            if(err){
              error(req, res, err);
            } else {
              passport.authenticate("local")(req, res,()=>{
                let userObject = {
                  objectID:newUser._id,
                  lastLogin: date,
                  type: 'user',
                  username,
                  registered: date,
                  rating: 0,
                  reviews: 0
                },
                    cryptoVerify = crypto(26),
                    cryptoExpire = new Date(Number(date) + 86400000),
                    key = client.generateSecuredApiKey(process.env.ALGOLIA_TRANS, {
                      filters: `viewable_by:${newUser._id}`
                    });
                newUser.searchKey = key;
                newUser.crypto = cryptoVerify;
                newUser.cryptoExpire = cryptoExpire;
                newUser.save();
                verifyEmail(newUser.username, newUser.email, cryptoVerify);
                index.addObject(userObject, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
                req.flash("success", "Welcome!");
                res.redirect("/dash");
              });
            }
          });
        }
      });
    } else {
      error(req, res, 'Someone is using that name.');
    }
  } else {
    error(req, res,'So sorry, but you really need to be human.');
  }
});
// Twitter
router.get('/auth/twitter',
    passport.authenticate('twitter'));
router.get('/auth/twitter/callback',
    passport.authenticate('twitter', {failureRedirect: '/login', failureFlash: true}),
    (req, res)=>{
        res.redirect('/dash');
    }
);
// Logout
router.get('/logout', (req, res)=>{
  req.logout();
  res.redirect('/');
});
// forgot Login
router.post('/password-reset', (req, res)=>{
  let email = {
    'Messages':[{
      'From':{
        'Email':'team@splatr.art',
        'Name':'Splatr Team'
      },
      'To':[{}],
      'TemplateLanguage':true,
      'Variables':{},
      'Subject': 'Forgot your password? Been there. Done that.',
      'TextPart': 'Please click the button below and your password will be reset! Didn\'t request this? No worries! We haven\'t changed a thing yet, so you can safely disregard this email. Although, we recommend logging in and changing your password. Just to be safe. By the way, this request expires in twenty-four hours.',
      'HTMLPart': '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Welcome to Splatr. We\'re glad you\'re here!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a {font-family: "Roboto", sans-serif;text-decoration:none}small{font-size:8pt; text-align:center;margin-top:15px}.btn{border-width: 2px;font-weight: 400;font-size: 0.8571em;line-height: 1.35em;margin: 10px 1px;border: none;border-radius: 0.1875rem;padding: 11px 22px;cursor: pointer;background-color: #7402c6;color: #FFFFFF; }</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="50px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><a href="https://splatr.art/email/{{var:crypto}}" style="color:#aaa; font-size:10pt">View in browser.</a></td></tr></table></td></tr><tr><td><table width="100%"  bgcolor="#eee" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Forgot your password? <br> Been there. Done that.</h1><p> Please click the button below and your password will be reset!</p><p>Didn\'t request this?</p><p>No worries! We haven\'t changed a thing yet, so you can safely disregard this email.</p><p>Although, we recommend logging in and changing your password. Just to be safe.</p><p>By the way, this request expires in twenty-four hours.</p></td></tr><tr><td><a href="https://splatr.art/password-reset/{{var:crypto}}" class="btn" style="margin-top:125px">Reset Password</a></td></tr><tr><td><table width="100%" cellpadding="10px" align="center"><tr><td style="text-align:center"><address><small>Copyright &#9400; 2018 Splatr, LLC.<br>511 Congress Street, Suite 700 | PO Box 9711 | Portland, Maine 04104-5011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>'
    }]
  };
  User.findOne({username:req.body.username}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(foundUser == null) { 
      error(req, res, 'There is no one by that username here.');
    } else {
      let cryptKey = crypto(26),
          expire  = new Date(Number(date) + 86400000);
      foundUser.passwordCrypto = cryptKey;
      foundUser.passwordExpire = expire;
      foundUser.save();
      email.Messages[0].To[0].Email = foundUser.email;
      email.Messages[0].Variables = {crypto:cryptKey,userID:foundUser._id};
      mailjet
      .post('send', {'version': 'v3.1'})
      .request(email)
      .then((result)=>{
        console.log('Done');
      })
      .catch((err)=>{
        console.log(err.Status);
      });
      res.status(200).send('Done.');
    }
  });
});
router.get('/password-reset/:crypto', (req, res)=>{
  if(req.user){
    req.flash('error', 'You\'re already logged in.');
    res.redirect('back');
  } else {
    User.findOne({passwordCrypto:req.params.crypto}, (err, foundUser)=>{
      if(err){
        error(req, res, err);
      } else if(foundUser == null){
        error(req, res, 'It doesn\'t seem you requested a password reset.');
      } else if(foundUser.passwordExpire < Date.now()){
        error(req, res, 'That request has expired. Sorry.');
      } else {
        res.render('reset', {username:foundUser.username, id:foundUser._id});
      }
    });
  }
});
router.put('/reset-password', (req, res)=>{
  if(req.user){
    error(req, res, 'You\'re already logged in.');
  } else {
    User.findById(req.body.ID, (err, foundUser)=>{
      if(err){
        res.status(400).send('Find Error.');
      } else {
        foundUser.setPassword(req.body.password, (err, user, authErr)=>{
          if(err || authErr){
            res.status(400).send('Auth Error.');
          } else {
            let email = {
              'Messages':[{
                'From':{
                  'Email':'team@splatr.art',
                  'Name':'Splatr Team'
                },
                'To':[{
                  'Email':foundUser.email,
                  'Name': foundUser.username
                }],
                'TemplateLanguage':true,
                'Variables':{userID:foundUser._id},
                'Subject': 'Your Account Was Updated.',
                'TextPart': 'Someone updated your account. We really hope it was you. If not, contact our team right away.',
                'HTMLPart': '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Your Account was Updated.</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a {font-family: "Roboto", sans-serif;text-decoration:none}small{font-size:8pt; text-align:center;margin-top:15px}.btn{border-width: 2px;font-weight: 400;font-size: 0.8571em;line-height: 1.35em;margin: 10px 1px;border: none;border-radius: 0.1875rem;padding: 11px 22px;cursor: pointer;background-color: #7402c6;color: #FFFFFF; }</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="50px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><a href="https://ayizan2-frittsy.c9users.io/email/{{var:crypto}}" style="color:#aaa; font-size:10pt">View in browser.</a></td></tr></table></td></tr><tr><td><table width="100%"  bgcolor="#eee" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Someone updated your account.</h1><p>We really hope that was you. If it wasn\'t, please contact our team right away.</p></td></tr><tr><td><table width="100%" cellpadding="10px" align="center"><tr><td style="text-align:center"><address><small>Copyright &#9400; 2018 Splatr, LLC.<br>511 Congress Street, Suite 700 | PO Box 9711 | Portland, Maine 04104-5011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>'
              }]
            };
            foundUser.passwordCrypto = undefined;
            foundUser.passwordExpire = undefined;
            foundUser.save();
            mailjet
            .post('send', {'version':'v3.1'})
            .request(email)
            .then((result)=>{
              console.log('Done');
            })
            .catch((err)=>{
              console.log(err.Status);
            });
            res.status(200).send('Password changed.');
          }
        });
      }
    });
  }
});

module.exports = router;

function error(req, res, err){
  let errorObj = {
    date: Date.now(),
    error: err,
  };
  console.log(err);
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
function verifyEmail(userID, email, crypto){
  let emailObject = {'Messages':[{
    'From':{
      'Email':'team@splatr.art',
      'Name':'The Splatr Team'
    },
    'To':[{
      'Email': email,
      'Name' : userID
    }],
    'Subject': 'Welcome to Splatr!',
    'TextPart': 'Welcome! We\'re glad you\'re with us. We just need you to verify your email. Please click the button below and you\'ll be all set!',
    'HTMLPart': `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Welcome to Splatr. We\'re glad you\'re here!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a {font-family: "Roboto", sans-serif;text-decoration:none}small{font-size:8pt; text-align:center;margin-top:15px}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="50px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><a href="https://splatr.art/email/${crypto}" style="color:#aaa; font-size:10pt">View in browser.</a></td></tr></table></td></tr><tr><td><table width="100%"  bgcolor="#eee" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Welcome!</h1><h1>We\'re glad you\'re with us.</h1><p>We just need you to verify your email.</p><p> Please click the button below and you\'ll be all set!</p></td></tr><tr><td><a href="https://splatr.art/verify/${crypto}" style="margin-top:125px; border-width: 2px;font-weight: 400;font-size: 0.8571em;line-height: 1.35em;margin: 10px 1px;border: none;border-radius: 0.1875rem;padding: 11px 22px;cursor: pointer;background-color: #7402c6;color: #FFFFFF; text-decoration:none">Verify Email</a></td></tr><tr><td><h3 style="color:#7402c6">From the team:</h3><h3 style="margin:0">Nate & Rachel</h3></td></tr><tr><td><table width="100%" cellpadding="10px" align="center"><tr><td style="text-align:center"><address><small>Copyright &#9400; 2018 Splatr, LLC.<br>511 Congress Street, Suite 700 | PO Box 9711 | Portland, Maine 04104-5011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
  }]};
  mailjet
  .post('send', {'version':'v3.1'})
  .request(emailObject)
  .then((result)=>{
    console.log('Done');
  })
  .catch((err)=>{
    console.log(err.Status);
  });
}