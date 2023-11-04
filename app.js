const express = require('express'),
      app = express(),
      date = new Date(),
      URI = process.env.CALLBACK_URI,
      months = ['January', 'February', 'March','April','May','June','July','August','September','October','November','December'],
      // Misc. Packages
      bodyParser  = require('body-parser'),
      flash = require('connect-flash'),
      helmet  = require('helmet'),
      mongoose  = require('mongoose'),
      session = require('express-session'),
      mongoURI = process.env.MLAB_URI,
      multer = require('multer'),
      streamifier = require('streamifier'),
      // Search
      search = require('algoliasearch'),
      client = search('LKDIWAGI3B', process.env.ALGOLIA),
      index = client.initIndex('users'),
      // Passport
      passport  = require('passport'),
      Facebook  = require('passport-facebook').Strategy,
      Google  = require('passport-google-oauth20').Strategy,
      Local = require('passport-local'),
      Twitter = require('passport-twitter').Strategy,
      DbSession = require('connect-mongodb-session')(session),
      store = new DbSession({
        uri: process.env.MLAB_URI,
        collection: 'sessions'
      }),
      // Models
      Feedback = require('./models/feedback.js'),
      SplatrError = require('./models/error.js'),
      User  = require("./models/user.js"),
      Day = require('./models/analytics/day.js'),
      // Routes
      analyticRoutes = require('./routes/analytics.js'),
      loginRoutes = require("./routes/login.js"),
      dashRoutes  = require("./routes/dash.js"),
      fetchRoutes = require("./routes/fetch.js"),
      artistRoutes  = require('./routes/artist.js'),
      galleryRoutes = require('./routes/gallery.js'),
      transRoutes = require('./routes/transaction.js'),
      paymentRoutes = require('./routes/payment.js'),
      legalRoutes = require('./routes/legal.js');

store.on('error', (err)=>{if(err){ console.log(err);}});
// Session Setup
app.use(session({
  cookie:{httpOnly: true},
  secret: process.env.SESSION,
  resave: true,
  saveUninitialized: false,
  store
}));

// Helmet Setup
app.use(helmet());

// Mongoose Setup
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.connect(mongoURI, {useNewUrlParser:true});
// Express Setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(`${__dirname}/public`));
app.use(flash());
app.set('view engine', 'ejs');

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());
passport.use(new Google({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE,
    callbackURL: `${URI}google/callback`
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({googleId: profile.id}, (err, foundUser)=>{
      if(!foundUser){
        let usernameRaw = profile.displayName.split(' '),
            username = usernameRaw.join('_');
        User.create({googleId: profile.id, username, email:profile.emails[0].value, lastLogin: date, registered:date, verified:true}, (err, newUser)=>{
          let userObject = {
            objectId: newUser._id,
            type: 'user',
            registered: date,
            rating: 0,
            reviews: 0
          },
          key = client.generateSecuredApiKey(process.env.ALGOLIA_TRANS, {
            filters: `viewable_by:${newUser._id}`
          });
          newUser.searchKey = key;
          newUser.save();
          index.addObject(userObject, (err, response)=>{
            if(err){
              console.log(err);
            }
          });
          return cb(err, newUser);
        });
      } else {
        foundUser.lastLogin = date;
        foundUser.save();
        return cb(err, foundUser);
      }
    });
  }
));
passport.use(new Facebook({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK,
    callbackURL: `${URI}facebook/callback`,
    profileFields: ["id", "email"]
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({facebookId: profile.id}, (err, foundUser)=>{
      if(!foundUser){
        let username = profile.emails[0].value;
        User.create({facebookId:profile.id, username, email:profile.emails[0].value, lastLogin: date, registered: date, verified:true}, (err, newUser)=>{
          let userUpdate = {
            objectId:newUser._id,
            type: 'user',
            registered: date,
            rating: 0,
            reviews: 0
          },
          key = client.generateSecuredApiKey(process.env.ALGOLIA_TRANS, {
            filters: `viewable_by:${newUser._id}`
          });
          newUser.searchKey = key;
          newUser.save();
          index.addObject(userUpdate, (err, response)=>{
            if(err){
              console.log(err);
            }
          });
          return cb(err, newUser);
        });
      } else {
          foundUser.lastLogin = date;
          foundUser.save();
          return cb(err, foundUser);
      }
    });
  }
));
passport.use(new Local(User.authenticate()));
passport.use(new Twitter({
  consumerKey: process.env.TWITTER_ID,
  consumerSecret: process.env.TWITTER,
  callbackURL: `${URI}twitter/callback`,
  userProfileURL: "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true"
  },
  (accessToken, refreshToken, profile, cb)=> {
    User.findOne({twitterId: profile.id}, (err, foundUser)=>{
      if(!foundUser){
        console.log(profile);
        User.create({twitterId:profile.id, lastLogin: date, registered: date, email:profile._json.email, verified:true, username:profile._json.screen_name}, (err, newUser)=>{
          let userUpdate = {
            objectId: newUser._id,
            type: 'user',
            registered: date,
            rating: 0,
            reviews: 0
          },
              key = client.generateSecuredApiKey(process.env.ALGOLIA_TRANS, {
                filters: `viewable_by:${newUser._id}`
              });
          newUser.searchKey = key;
          newUser.save();
          index.addObject(userUpdate, (err, response)=>{
            if(err){
              console.log(err);
            }
          });
          return cb(err, newUser);
        });
      } else {
        foundUser.lastLogin = new Date();
        foundUser.save();
        return cb(err, foundUser);
      }
    });
  }
));
passport.serializeUser((user, done)=>{
  done(null, user);
});
passport.deserializeUser((id, done)=>{
  User.findById(id, (err, user)=>{
    done(err, user);
  });
});

app.use((req, res, next)=>{
  res.locals.currentUser = req.user;
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.algolia = false;
  res.locals.stripe = false;
  res.locals.datify = dateFormat;
  next();
});

app.use('/.well-known', express.static('.well-known'));
// Routes
app.get('/', (req, res)=>{
  res.render('home', {title:'Make More. Share More.', css_js:'home', url:'https://splatr.art', image:'https://ayizan.blob.core.windows.net/site-images/card_2019-01.png', description:'Whether you\'re an artist or one\'s biggest fan, Splatr\'s perfect place for you. We bring together artists of all styles and persuasions and connect them with their number one fans to make commissioning a breeze. No more hassle, no more hunting. We\'ve got it all and it\'s ready for you.'});
});
app.get('/search', (req, res)=>{
  let NSFW = false,
      query;
  if(req.query.q){
    query = req.query.q;
  }
  if(req.user){
    User.findOne({_id:req.user._id}, (err, foundUser)=>{
      if(err){
        error(req, res, err);
      } else {
        let age = date.getFullYear() - foundUser.birthday.getFullYear(),
            m = date.getMonth() - foundUser.birthday.getMonth();
        if(m < 0 || (m === 0 && date.getDate() < foundUser.birthday.getDate())){
          age --;
        }
        if(foundUser.nsfw_filter == false && age > 18){
          NSFW = true;
          res.render('search', {title:'Find Artists and Commissions', css_js:'search', algolia:true, NSFW, query});
        } else {
          res.render('search', {title:'Find Artists and Commissions', css_js:'search', algolia:true, NSFW, query});
        }
      }
    });
  } else {
    res.render('search', {title:'Find Artists and Commissions', css_js:'search', algolia:true, NSFW, query});
  }
});
app.get('/verify/:crypto_code', (req, res)=>{
  if(req.user){
    User.findOne({crypto:req.params.crypto_code}, (err, foundUser)=>{
      if(err||foundUser == null){
        req.flash('error', 'We couldn\'t find you.');
        res.redirect('/login');
      } else if(foundUser.cryptoExpire < Date()){
        req.flash('error', 'Sorry, your verification code has expired. Please request a new one from your dash.');
        res.redirect('/login');
      } else {
        foundUser.cryptoExpire = undefined;
        foundUser.crypto = undefined;
        foundUser.verified = {date, verified:true};
        foundUser.save();
        req.flash('success', 'Your email is verified!');
        res.redirect('/dash');
      }
    });
  } else {
    req.flash('success', 'Please login to verify your email');
    res.render('login', {title:'Welcome Back!', css_js:'login', verification:req.params.crypto_code, referer:null});
  }
});
app.get('/faq', (req, res)=>{
  res.render('faq', {title:'FAQs', css_js:'faq', url:'https://splatr.art/faq', image:'https://ayizan.blob.core.windows.net/site-images/card_2019-01.png', description:'You\'ve got questions. We\'ve got lots of answers.'});
});
app.get('/about', (req, res)=>{
  res.render('about', {title:'About us.', css_js:'about', url:'https://splatr.art/about', image:'https://ayizan.blob.core.windows.net/site-images/card_2019-01.png', description:'Come see what we\'re all about.'});
});
app.post('/feedback', (req, res)=>{
  if(!req.user){
    req.flash('error', 'You must be logged in to offer feedback.');
    res.redirect('back');
  } else {
    let feedbackObj = {
      text:req.body.feedback,
      date,
      from: req.user._id,
      location: req.get('Referer'),
      type: req.body.type
    };
    Feedback.create(feedbackObj, (err, newFeedback)=>{
      if(err){
        res.status(400).send('Could not send feedback.');
      } else {
        res.status(200).json(newFeedback);
      }
    });
  }
});
app.get('/404', (req, res)=>{
  res.render('404', {title:'Well. This is awkward.', css_js:'404'});
});
app.get('/contact', (req, res)=>{
  res.render('contact', {title:'Letters? For us?', css_js:'contact'});
});

// Subdomains & Routers
app.use(loginRoutes);
app.use('/legal', legalRoutes);
app.use('/gallery', galleryRoutes);
app.use('/dash', dashRoutes);
app.use('/fetch', fetchRoutes);
app.use('/transaction', transRoutes);
app.use('/payment', paymentRoutes);
app.use(artistRoutes);
app.use('/analytics', analyticRoutes);
app.listen(process.env.PORT, process.env.IP,()=>{
  console.log('Splatr 0.1.0');
});

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