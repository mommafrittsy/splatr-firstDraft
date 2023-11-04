const express = require('express'),
      router = express.Router(),
      date = new Date(),
      // Photo Uploads
      azure = require('azure-storage'),
      multer = require('multer'),
      streamifier = require('streamifier'),
      storageAccount = process.env.AZURE_STORAGE_ACCOUNT,
      storageKey = process.env.AZURE_STORAGE,
      azureEndpoint = process.env.AZURE_STORAGE_ENDPOINT,
      blobClient  = azure.createBlobService(storageAccount, storageKey),
      // Search
      search = require('algoliasearch'),
      client = search('LKDIWAGI3B', process.env.ALGOLIA),
      userIndex = client.initIndex('users'),
      galleryIndex = client.initIndex('galleries'),
      commissionIndex = client.initIndex('commissions'),
      // Emails
      mailjet = require('node-mailjet').connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE),
      // stripe
      stripe = require('stripe')(process.env.STRIPE),
      // models
      User    = require('../models/user.js'),
      Commission    = require('../models/commission.js'),
      Gallery = require('../models/gallery.js'),
      Notification  = require('../models/notification.js'),
      SplatrError  = require('../models/error.js'),
      Year = require('../models/analytics/year.js'),
      Month = require('../models/analytics/month.js'),
      Day = require('../models/analytics/day.js'),
      reserved = ['login', 'register', 'about', 'find', 'legal', 'splatr', 'verify', 'faq'],
      countries = { "AF": "Afghanistan",
                    "AX": "Åland Islands",
                    "AL": "Albania",
                    "DZ": "Algeria",
                    "AS": "American Samoa",
                    "AD": "Andorra",
                    "AO": "Angola",
                    "AI": "Anguilla",
                    "AQ": "Antarctica",
                    "AG": "Antigua and Barbuda",
                    "AR": "Argentina",
                    "AM": "Armenia",
                    "AW": "Aruba",
                    "AU": "Australia",
                    "AT": "Austria",
                    "AZ": "Azerbaijan",
                    "BS": "Bahamas",
                    "BH": "Bahrain",
                    "BD": "Bangladesh",
                    "BB": "Barbados",
                    "BY": "Belarus",
                    "BE": "Belgium",
                    "BZ": "Belize",
                    "BJ": "Benin",
                    "BM": "Bermuda",
                    "BT": "Bhutan",
                    "BO": "Bolivia",
                    "BA": "Bosnia and Herzegovina",
                    "BW": "Botswana",
                    "BV": "Bouvet Island",
                    "BR": "Brazil",
                    "IO": "British Indian Ocean Territory",
                    "BN": "Brunei Darussalam",
                    "BG": "Bulgaria",
                    "BF": "Burkina Faso",
                    "BI": "Burundi",
                    "KH": "Cambodia",
                    "CM": "Cameroon",
                    "CA": "Canada",
                    "CV": "Cape Verde",
                    "KY": "Cayman Islands",
                    "CF": "Central African Republic",
                    "TD": "Chad",
                    "CL": "Chile",
                    "CN": "China",
                    "CX": "Christmas Island",
                    "CC": "Cocos (Keeling) Islands",
                    "CO": "Colombia",
                    "KM": "Comoros",
                    "CG": "Congo",
                    "CD": "Congo, Democratic Republic",
                    "CK": "Cook Islands",
                    "CR": "Costa Rica",
                    "CI": "Cote D\"Ivoire",
                    "HR": "Croatia",
                    "CU": "Cuba",
                    "CY": "Cyprus",
                    "CZ": "Czech Republic",
                    "DK": "Denmark",
                    "DJ": "Djibouti",
                    "DM": "Dominica",
                    "DO": "Dominican Republic",
                    "EC": "Ecuador",
                    "EG": "Egypt",
                    "SV": "El Salvador",
                    "GQ": "Equatorial Guinea",
                    "ER": "Eritrea",
                    "EE": "Estonia",
                    "ET": "Ethiopia",
                    "FK": "Falkland Islands (Malvinas)",
                    "FO": "Faroe Islands",
                    "FJ": "Fiji",
                    "FI": "Finland",
                    "FR": "France",
                    "GF": "French Guiana",
                    "PF": "French Polynesia",
                    "TF": "French Southern Territories",
                    "GA": "Gabon",
                    "GM": "Gambia",
                    "GE": "Georgia",
                    "DE": "Germany",
                    "GH": "Ghana",
                    "GI": "Gibraltar",
                    "GR": "Greece",
                    "GL": "Greenland",
                    "GD": "Grenada",
                    "GP": "Guadeloupe",
                    "GU": "Guam",
                    "GT": "Guatemala",
                    "GG": "Guernsey",
                    "GN": "Guinea",
                    "GW": "Guinea-Bissau",
                    "GY": "Guyana",
                    "HT": "Haiti",
                    "HM": "Heard Island and Mcdonald Islands",
                    "VA": "Holy See (Vatican City State)",
                    "HN": "Honduras",
                    "HK": "Hong Kong",
                    "HU": "Hungary",
                    "IS": "Iceland",
                    "IN": "India",
                    "ID": "Indonesia",
                    "IR": "Iran",
                    "IQ": "Iraq",
                    "IE": "Ireland",
                    "IM": "Isle of Man",
                    "IL": "Israel",
                    "IT": "Italy",
                    "JM": "Jamaica",
                    "JP": "Japan",
                    "JE": "Jersey",
                    "JO": "Jordan",
                    "KZ": "Kazakhstan",
                    "KE": "Kenya",
                    "KI": "Kiribati",
                    "KP": "Korea (North)",
                    "KR": "Korea (South)",
                    "XK": "Kosovo",
                    "KW": "Kuwait",
                    "KG": "Kyrgyzstan",
                    "LA": "Laos",
                    "LV": "Latvia",
                    "LB": "Lebanon",
                    "LS": "Lesotho",
                    "LR": "Liberia",
                    "LY": "Libyan Arab Jamahiriya",
                    "LI": "Liechtenstein",
                    "LT": "Lithuania",
                    "LU": "Luxembourg",
                    "MO": "Macao",
                    "MK": "Macedonia",
                    "MG": "Madagascar",
                    "MW": "Malawi",
                    "MY": "Malaysia",
                    "MV": "Maldives",
                    "ML": "Mali",
                    "MT": "Malta",
                    "MH": "Marshall Islands",
                    "MQ": "Martinique",
                    "MR": "Mauritania",
                    "MU": "Mauritius",
                    "YT": "Mayotte",
                    "MX": "Mexico",
                    "FM": "Micronesia",
                    "MD": "Moldova",
                    "MC": "Monaco",
                    "MN": "Mongolia",
                    "MS": "Montserrat",
                    "MA": "Morocco",
                    "MZ": "Mozambique",
                    "MM": "Myanmar",
                    "NA": "Namibia",
                    "NR": "Nauru",
                    "NP": "Nepal",
                    "NL": "Netherlands",
                    "AN": "Netherlands Antilles",
                    "NC": "New Caledonia",
                    "NZ": "New Zealand",
                    "NI": "Nicaragua",
                    "NE": "Niger",
                    "NG": "Nigeria",
                    "NU": "Niue",
                    "NF": "Norfolk Island",
                    "MP": "Northern Mariana Islands",
                    "NO": "Norway",
                    "OM": "Oman",
                    "PK": "Pakistan",
                    "PW": "Palau",
                    "PS": "Palestinian Territory, Occupied",
                    "PA": "Panama",
                    "PG": "Papua New Guinea",
                    "PY": "Paraguay",
                    "PE": "Peru",
                    "PH": "Philippines",
                    "PN": "Pitcairn",
                    "PL": "Poland",
                    "PT": "Portugal",
                    "PR": "Puerto Rico",
                    "QA": "Qatar",
                    "RE": "Reunion",
                    "RO": "Romania",
                    "RU": "Russian Federation",
                    "RW": "Rwanda",
                    "SH": "Saint Helena",
                    "KN": "Saint Kitts and Nevis",
                    "LC": "Saint Lucia",
                    "PM": "Saint Pierre and Miquelon",
                    "VC": "Saint Vincent and the Grenadines",
                    "WS": "Samoa",
                    "SM": "San Marino",
                    "ST": "Sao Tome and Principe",
                    "SA": "Saudi Arabia",
                    "SN": "Senegal",
                    "RS": "Serbia",
                    "ME": "Montenegro",
                    "SC": "Seychelles",
                    "SL": "Sierra Leone",
                    "SG": "Singapore",
                    "SK": "Slovakia",
                    "SI": "Slovenia",
                    "SB": "Solomon Islands",
                    "SO": "Somalia",
                    "ZA": "South Africa",
                    "GS": "South Georgia and the South Sandwich Islands",
                    "ES": "Spain",
                    "LK": "Sri Lanka",
                    "SD": "Sudan",
                    "SR": "Suriname",
                    "SJ": "Svalbard and Jan Mayen",
                    "SZ": "Swaziland",
                    "SE": "Sweden",
                    "CH": "Switzerland",
                    "SY": "Syrian Arab Republic",
                    "TW": "Taiwan",
                    "TJ": "Tajikistan",
                    "TZ": "Tanzania",
                    "TH": "Thailand",
                    "TL": "Timor-Leste",
                    "TG": "Togo",
                    "TK": "Tokelau",
                    "TO": "Tonga",
                    "TT": "Trinidad and Tobago",
                    "TN": "Tunisia",
                    "TR": "Turkey",
                    "TM": "Turkmenistan",
                    "TC": "Turks and Caicos Islands",
                    "TV": "Tuvalu",
                    "UG": "Uganda",
                    "UA": "Ukraine",
                    "AE": "United Arab Emirates",
                    "GB": "United Kingdom",
                    "US": "United States",
                    "UM": "United States Minor Outlying Islands",
                    "UY": "Uruguay",
                    "UZ": "Uzbekistan",
                    "VU": "Vanuatu",
                    "VE": "Venezuela",
                    "VN": "Viet Nam",
                    "VG": "Virgin Islands, British",
                    "VI": "Virgin Islands, U.S.",
                    "WF": "Wallis and Futuna",
                    "EH": "Western Sahara",
                    "YE": "Yemen",
                    "ZM": "Zambia",
                    "ZW": "Zimbabwe"
                  },
      states = {
        'AU': {
          'ACT': 'Australian Capital Territory',
          'NSW': 'New South Wales',
          'NT': 'Northern Territory',
          'QLD': 'Queensland',
          'SA': 'South Australia',
          'TAS': 'Tasmania',
          'VIC': 'Victoria',
          'WA': 'Western Australia'
        },
        'CA': {
          'AB':'Alberta',
          'BC':'British Columbia',
          'MB':'Manitoba',
          'NB':'New Brunswick',
          'NL':'Newfoundland and Labrador',
          'NT':'Northwest Territories',
          'NS':'Nova Scotia',
          'NU':'Nunavut',
          'ON':'Ontario',
          'PE':'Prince Edward Island',
          'QC':'Quebec',
          'SK':'Saskatchewan',
          'YT':'Yukon Territory'
        },
        'US': {
          "AL": "Alabama",
          "AK": "Alaska",
          "AS": "American Samoa",
          "AZ": "Arizona",
          "AR": "Arkansas",
          "CA": "California",
          "CO": "Colorado",
          "CT": "Connecticut",
          "DE": "Delaware",
          "DC": "District Of Columbia",
          "FM": "Federated States Of Micronesia",
          "FL": "Florida",
          "GA": "Georgia",
          "GU": "Guam",
          "HI": "Hawaii",
          "ID": "Idaho",
          "IL": "Illinois",
          "IN": "Indiana",
          "IA": "Iowa",
          "KS": "Kansas",
          "KY": "Kentucky",
          "LA": "Louisiana",
          "ME": "Maine",
          "MH": "Marshall Islands",
          "MD": "Maryland",
          "MA": "Massachusetts",
          "MI": "Michigan",
          "MN": "Minnesota",
          "MS": "Mississippi",
          "MO": "Missouri",
          "MT": "Montana",
          "NE": "Nebraska",
          "NV": "Nevada",
          "NH": "New Hampshire",
          "NJ": "New Jersey",
          "NM": "New Mexico",
          "NY": "New York",
          "NC": "North Carolina",
          "ND": "North Dakota",
          "MP": "Northern Mariana Islands",
          "OH": "Ohio",
          "OK": "Oklahoma",
          "OR": "Oregon",
          "PW": "Palau",
          "PA": "Pennsylvania",
          "PR": "Puerto Rico",
          "RI": "Rhode Island",
          "SC": "South Carolina",
          "SD": "South Dakota",
          "TN": "Tennessee",
          "TX": "Texas",
          "UT": "Utah",
          "VT": "Vermont",
          "VI": "Virgin Islands",
          "VA": "Virginia",
          "WA": "Washington",
          "WV": "West Virginia",
          "WI": "Wisconsin",
          "WY": "Wyoming"
        }
      },
      months = ['January', 'February', 'March','April','May','June','July','August','September','October','November','December'];

router.use((req, res, next)=>{
  checkLogin(req, res, next);
});

router.get('/', (req, res)=>{
  User
  .findOne({_id:req.user._id})
  .populate('commissions')
  .populate('completed')
  .populate('fans')
  .populate('following')
  .populate('gallery.commissioned')
  .populate('gallery.non-commissioned')
  .populate({
    path:"notifications", 
    populate:[
      {path:'from'},
      {path:'transaction'},
      {path:'gallery'},
      {path:'comment'}],
  })
  .populate('likes')
  .populate('transactions')
  .exec((err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(foundUser.newUser == true){
      res.render('newUser', {currentUser:foundUser, countries, states});
    } else {
      let months = ['January', 'February', 'March','April','May','June','July','August','September','October','November','December'],
          year = date.getFullYear(),
          month = months[date.getMonth()],
          day = date.getDate(),
          fullDate = {day, month, year};
      if(Array.isArray(foundUser.gallery) == true){
        foundUser.gallery = {commissioned:[], non_commissioned:[]};
        foundUser.save();
      }
      if(foundUser.stripe.id){
        stripe.balance.retrieve({
          stripe_account: foundUser.stripe.id
        },(err, balance)=>{
          if(err){
            error(req, res, err);
          } else {
            stripe.accounts.listExternalAccounts(foundUser.stripe.id,{object:'bank_account'}, (err, accounts)=>{
              if(err){
                error(req, res, err);
              } else {
                var cards;
                if(foundUser.stripe.customerID){
                  stripe.customers.listCards(foundUser.stripe.customerID, (err, cardList)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      cards = cardList.data;
                    }
                  });
                }
                stripe.accounts.retrieve(foundUser.stripe.id, (err, account)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    let banks = accounts.data,
                        currency = account.default_currency,
                        reserved_balance = 0,
                        available = balance.available[0].amount,
                        missingInfo = false,
                        NSFW = false,
                        payouts;
                    if(foundUser.birthday){
                      let age = date.getFullYear() - foundUser.birthday.getFullYear(),
                          m = date.getMonth() - foundUser.birthday.getMonth();
                      if(m < 0 || (m === 0 && date.getDate() < foundUser.birthday.getDate())){
                        age --;
                      }
                      if (age > 18){
                        NSFW = true;
                      }
                    }
                    if(foundUser.isArtist == true){
                      for(let trans of foundUser.transactions){
                        if(trans.artist.id == req.user._id.toString()){
                          if(!['request','accept','paid','closed','declined'].includes(trans.status)){
                            reserved_balance = reserved_balance + (trans.type.price/2);
                          }
                        }
                      }
                    }
                    if(reserved_balance > 0){
                      available = available - reserved_balance;
                    }
                    if(foundUser.missingInfo == true){
                      missingInfo = true;
                    }
                    if(account.verification.fields_needed.length > 0) {
                      foundUser.stripe.fields_needed = account.verification.fields_needed;
                      foundUser.save();
                    }
                    payouts = account.payouts_enabled;
                    res.render('./dashPages/artist/frame', {title:'Dashboard', css_js:'dashNew', algolia: true, stripe: true, user:foundUser, account, banks, currency, cards, available, pending:balance.pending[0].amount/100, missingInfo, countries, NSFW, states, reserved_balance, today:dateFormat(date, 'US'), datify:dateFormat, payouts});
                  }
                });
              }
            });
          }
        });
      }
      else {
        let account,
            cards,
            available,
            pending,
            banks,
            currency,
            missingInfo = false,
            NSFW = false;
        if(foundUser.missingInfo == true){
          missingInfo == true;
        }
        if(foundUser.birthday){
          let age = date.getFullYear() - foundUser.birthday.getFullYear(),
              m = date.getMonth() - foundUser.birthday.getMonth();
          if(m < 0 || (m === 0 && date.getDate() < foundUser.birthday.getDate())){
            age --;
          }
          if (age > 18){
            NSFW = true;
          }
        }
        if(foundUser.stripe.customerID){
          stripe.customers.listCards(foundUser.stripe.customerID, (err, cardList)=>{
            if(err){
              error(req, res, err);
            } else {
              cards = cardList.data;
              res.render('./dashPages/artist/frame', {title:'Dashboard', css_js:'dashNew', algolia: true, stripe: true, user:foundUser, account, banks, currency, cards, available, pending, missingInfo, countries, NSFW, states, today:dateFormat(date, 'US'), datify:dateFormat});
            }
          });
        } else {
          res.render('./dashPages/artist/frame', {title:'Dashboard', css_js:'dashNew', algolia: true, stripe: true, user:foundUser, account, banks, currency, cards, available, pending, missingInfo, countries, NSFW, states, today:dateFormat(date, 'US'), datify:dateFormat});
        }
      }
    }
  });
});
router.post('/address', (req, res)=>{
  let line1  = req.body.line1,
      line2   = req.body.line2,
      city    = req.body.city,
      country = {code:req.body.country, name:countries[req.body.country]},
      post    = req.body.post,
      address = {line1,line2,city,country,post},
      artistCountries = ['us','uk','ch','se','es','sg','pt','no','nz','nl','lu','jp','it','ie','hk','de','fr','fi','dk','ca','be','at','au'];
  User.findByIdAndUpdate(req.user._id,{address},(err, foundUser)=>{
    if(err){
      error(req, res, "We couldn't find you.");
    } else {
      if(foundUser.isArtist == true){
        stripe.accounts.update(foundUser.stripe.id, {
          legal_entity:{
            address:{
              city,
              country: req.body.country,
              line1,
              line2,
              postal_code:post,
            }
          }
        });
      }
      if(artistCountries.includes(req.body.country.toLowerCase())){
        foundUser.canArt = true;
        foundUser.save();
      } else {
        foundUser.canArt = false;
        foundUser.save();
      }
      req.flash('success', 'All set. Be sure to check if we need the state you\'re from too.');
      res.redirect('back');
    }
  });
});
router.post('/background', (req, res)=>{
  User.findByIdAndUpdate(req.user._id, {preferences:{background:req.body.background}},(err, upUser)=>{
    if(err){
      error(req, res, err);
    } else {
      res.redirect('back');
    }
  });
});
router.get('/commission/status', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundUser.open == true){
        let userUpdate = {
          objectID:foundUser._id,
          status: false
        };
        foundUser.open = false;
        foundUser.save();
        commissionIndex.partialUpdateObject(userUpdate, (err, response)=>{
          if(err){
            error(req, res, err);
          }
        });
        req.flash('success', 'Enjoy your break! You\'ve earned it!');
        res.redirect('back');
      } else {
        foundUser.open = true;
        foundUser.save();
        Notification.create({date,from:foundUser._id,type:'open'}, (err, newNote)=>{
          if(err){
            error(req, res, err);
          } else {
            let userUpdate = {
              objectID: foundUser._id,
              status: true
            };
            for(let fan of foundUser.fans){
              User.findOne({_id:fan}, (err, foundFollower)=>{
                if(err){
                  error(req, res, err);
                } else if(foundFollower != null){
                  foundFollower.notifications.unshift(newNote);
                  foundFollower.save();
                }
              });
            }
            commissionIndex.partialUpdateObject(userUpdate, (err, response)=>{
              if(err){
                error(req, res, err);
              }
            });
            req.flash('success', 'Let\'s get into some commissions!');
            res.redirect('back');
          }
        });
      }
    }
  });
});
router.post('/commission/new', multer().single('commInput'),(req, res)=>{
  let stream = streamifier.createReadStream(req.file.buffer),
      time  = new Date().getTime(),
      id = `${req.user._id}${time}.png`,
      container = 'examples',
      url   = `${azureEndpoint}${container}/${id}`,
      options =  {
        contentSettings:{
            contentType: "image/png"
        },
        metadata: {fileName:id}
      };
  blobClient.createBlockBlobFromStream(container, id, stream, req.file.size, options, (err)=>{
    if(err != null){
      error(req, res, err);
    } else {
      let available,
          description  = req.body.description,
          name  = req.body.name,
          price = req.body.price,
          type = req.body.type,
          NSFW  = req.body.NSFW,
          tags = req.body.tags.split(/\s*#/),
          example = {id, url},
          newComm = {date,description,name,price,type,NSFW,tags,example, artist:req.user._id};
      if(req.body.available == 0){
        available = null;
      } else {
        available = req.body.available;
      }
      Commission.create(newComm, (err, newCommish)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findById(req.user._id, (err, foundUser)=>{
            if(err){
              error(req, res, err);
            } else {
              let commObject = {
                objectID: newCommish._id,
                artist: foundUser.username,
                available,
                name,
                price: price/100,
                type,
                NSFW,
                tags,
                example: url
              };
              for(let fan of foundUser.fans){
               User.findOne({_id:fan}, (err, foundFan)=>{
                 if(err){
                   error(req, res, err);
                 } else {
                   let note = {
                     from:foundUser._id,
                     date,
                     text: `${foundUser.username} made a new commission`,
                     type:'new',
                     url: `/${foundUser.username}`
                   };
                   Notification.create(note, (err, newNote)=>{
                     if(err){
                       error(req, res, err);
                     } else {
                       foundFan.notifications.unshift(newNote);
                       foundFan.save();
                     }
                   });
                 }
               }); 
              }  
              foundUser.commissions.push(newCommish);
              foundUser.save();
              commissionIndex.addObject(commObject, (err, response)=>{
                if(err){
                  error(req, res, err);
                }
              });
              req.flash('success', 'Cool!');
              res.redirect('back');
            }
          });
        }
      });
    }
  });
});
router.post('/commission/:id/edit', multer().single('commInput'), (req, res)=>{
  Commission.findById(req.params.id, (err, foundComm)=>{
    if(err){
      error(req, res, err);
    } else {
      if(req.file){
        let stream = streamifier.createReadStream(req.file.buffer),
            time  = new Date().parse(),
            id = `${req.user._id}${time}.png`,
            container = 'examples',
            url   = `${azureEndpoint + container}/${id}`,
            options =  {
              contentSettings:{
                  contentType: "image/png"
              },
              metadata: {fileName:id}
            };
          
        blobClient.deleteBlobIfExists(container, foundComm.example.id, (err, response)=>{
            if(err != null){
              error(req, res, err);
            } else {
              blobClient.createBlockBlobFromStream('examples', id, stream, req.file.size, options, (err)=>{
                if(err != null){
                  req.flash('error', 'We had a problem uploading the image.');
                  res.redirect('back');
                } else {
                  foundComm.example = {id, url};
                  foundComm.save();
                }
              });
            }
          });
        }
      let available,
          description  = req.body.description,
          name  = req.body.name,
          price = req.body.price,
          type = req.body.type,
          tags  = req.body.tags.split(' #'),
          NSFW  = req.body.NSFW,
          upComm = {available,date,description,name,price,type,tags,NSFW},
          commUpdate = {
            objectID: foundComm._id,
            available,
            name,
            price: price/100,
            type,
            tags,
            NSFW
          };
      if(req.body.available){
        available = req.body.available;
      } else {
        available = null;
      }
      Commission.findByIdAndUpdate(foundComm._id, upComm, (err,upCommish)=>{
        if(err){
          req.flash('error', 'We had a problem updating the commission.');
          res.redirect('back');
        } else {
          commissionIndex.partialUpdateObject(commUpdate, (err, response)=>{
            if(err){
              error(req, res, err);
            }
          });
          req.flash('success', 'All good!');
          res.redirect('back');
        }
      });
    }
  });
});
router.post('/commission/:id/remove', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      Commission.findById(req.params.id, (err, foundComm)=>{
        if(err){
          error(req, res, err);
        } else {
          let index = foundUser.commissions.indexOf(foundComm._id);
          foundUser.commissions.splice(index,1);
          foundUser.save();
          blobClient.deleteBlobIfExists('examples', foundComm.example.id, (err, response)=>{
            if(err){
              error(req, res, err);
            } else {
              Commission.findByIdAndRemove(foundComm._id, (err)=>{
            if(err){
              error(req, res, err);
            } else {
              commissionIndex.deleteObject(foundComm._id, (err, response)=>{
                if(err){
                  error(req, res, err);
                }
              });
              req.flash('success', 'Poof! Gone!');
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
router.post('/description', (req, res)=>{
  let desc  = req.body.artistDescription;
  
  User.findByIdAndUpdate(req.user._id,{description:desc}, (err, upUser)=>{
    if(err){
      error(req, res, err);
    } else {
      req.flash("success", "Sounds good to us!");
      res.redirect('back');
    }
  });
});
router.post('/login', (req, res)=>{
  let user =  req.user._id,
      name  = req.body.changeUsername,
      email = req.body.changeEmail,
      marketing = req.body.marketing;

  User.findOne({username:name}, (err, conflictUser)=>{
    if(err){
      error(req, res, err);
    } else if (conflictUser && req.user.username && conflictUser.username == req.user.username) {
      User.findById(user, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else {
          if(marketing){
            foundUser.marketingEmails = true;
          } else {
            foundUser.marketingEmails = false;
          }
          foundUser.save();
          req.flash('success', 'We\'ve saved your preferences.');
          res.redirect('back');
        }
      }); 
    } else if (conflictUser||reserved.includes(name)) {
      error(req, res, 'Someone is already using that name.');
    } else {
      User.findById(user, (err, foundUser)=>{
        if(err){
          req.flash("error", err.message);
        } else {
          let userUpdate = {
            objectID:req.user._id,
            username: name
          };
          foundUser.username = name;
          foundUser.email = email;
          if(marketing != undefined){
            foundUser.marketingEmails = true;
          } else {
            foundUser.marketingEmails = false;
          }
          foundUser.save();
          for(let comm of foundUser.commissions){
            Commission.findById(comm, (err, foundComm)=>{
              let commUpdate = {
                objectID: foundComm._id,
                artist: foundUser.username
              };
              if(err){
                error(req, res, err);
              } else {
                commissionIndex.partialUpdateObject(commUpdate, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
              }
            });
          }
          for(let gal of foundUser.gallery){
            Gallery.findById(gal, (err, foundGal)=>{
              if(err){
                error(req, res, err);
              } else {
                let galUpdate = {
                  objectID: foundGal._id,
                  artist: foundUser.username
                };
                galleryIndex.partialUpdateObject(galUpdate, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
              }
            });
          }
          userIndex.partialUpdateObject(userUpdate, (err, response)=>{
            if(err){
              error(req, res, err);
            }
          });
          accountChange(req, res, foundUser.email);
          req.flash("success", "It's a whole new you!");
          res.redirect("back");
        }
      });
    }
  });
});
router.post('/motto', (req, res)=>{
  let motto = req.body.motto;
  
  User.findByIdAndUpdate(req.user._id, {motto}, (err, updatedUser)=>{
    if(err){
      error(req, res, err);
    } else {
      req.flash('success', 'Mottoed.');
      res.redirect('back');
    }
  });
});
router.post('/name', (req, res)=>{
  let given = req.body.given,
      surname = req.body.surname,
      preferred = req.body.preferred,
      name = {given, surname, preferred},
      update = {name};
  User.findByIdAndUpdate(req.user._id, update, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      accountChange(req, res, foundUser.email);
      req.flash("success", "New name. New you!");
      res.redirect("back");
    }
  });
});
router.delete('/notifications/delete_all', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      console.log(err);
      res.status(400).send(err.message);
    } else {
      for(let note of foundUser.notifications){
        Notification.findOneAndRemove({_id:note}, (err)=>{
          if(err){
            console.log(err);
            res.status(400).send(err.message);
          }
        });
      }
      foundUser.notifications = [];
      foundUser.save();
      res.status(200).send('Removed.');
    }
  });
});
router.post('/password', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      foundUser.setPassword(req.body.passChange,(err, user, authErr)=>{
        if(err){
          error(req, res, err);
        } else if(authErr){
          error(req, res, authErr);
        } else {
          foundUser.save();
          accountChange(req, res, foundUser.email);
          req.flash('success', 'Password changed successfully.');
          res.redirect('/dash');
        }
      });
    }
  });
});
router.get('/preference', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundUser.preferences.night == true) {
        foundUser.preferences.night = false;
        foundUser.save();
        req.flash('success', 'A new day dawns!');
        res.redirect('back');
      } else {
        foundUser.preferences.night = true;
        foundUser.save();
        req.flash('success', 'Welcome to the night!');
        res.redirect('back');
      }
    }
  });
});
router.post('/social', (req, res)=>{
  let behance = req.body.behance,
      deviantart  = req.body.deviantart,
      discord = req.body.discord,
      dribbble  = req.body.dribbble,
      etsy  = req.body.etsy,
      facebook  = req.body.facebook,
      instagram   = req.body.instagram,
      patreon = req.body.patreon,
      pinterest = req.body.pinterest,
      soundcloud  = req.body.soundcloud,
      tumblr  = req.body.tumblr,
      twitch  = req.body.twitch,
      twitter = req.body.twitter,
      vimeo = req.body.vimeo,
      youtube = req.body.youtube,
      social  = {behance, deviantart, discord, dribbble, etsy, facebook, instagram, patreon, pinterest, soundcloud, tumblr, twitch, twitter, vimeo, youtube};
  User.findByIdAndUpdate(req.user._id, {social}, (err, upUser)=>{
    if(err){
      error(req, res, err);
    } else {
      req.flash('success', 'Go forth and be social.');
      res.redirect('back');
    }
  });
});
router.post('/style', (req, res)=>{
  let styleStr = req.body.tagsInput,
      styles  = styleStr.split(",");
  
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      let newStyle = foundUser.style.concat(styles),
          userUpdate = {
            objectID: foundUser._id,
            tags: newStyle
          };
      
      foundUser.style = newStyle;
      foundUser.save();
      userIndex.partialUpdateObject(userUpdate, (err, response)=>{
        if(err){
          error(req, res, err);
        }
      });
      req.flash("success", "You're stylin\' now!");
      res.redirect("back");
    }
  });
});
router.get('/user/become_artist', (req, res)=>{
  let artistCountries = ['us','uk','ch','se','es','sg','pt','no','nz','nl','lu','jp','it','ie','hk','de','fr','fi','dk','ca','be','at','au'];
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(!artistCountries.includes(foundUser.address.country.code.toLowerCase())){
      error(req, res, `Sorry, but we can\'t offer artist services in ${foundUser.address.country}. Yet.`);
    } else {
      let dateToParse = new Date(),
              tosDate = Date.parse(dateToParse);
      if(foundUser.address.street != '' && foundUser.address.city != '' && foundUser.birthday && foundUser.name.first != '' && foundUser.name.last != ''){
        if(['AU','CA','US'].includes(foundUser.address.country.code.toUpperCase()) && foundUser.address.state.code){
          stripe.accounts.create({
            type:'custom',
            country: foundUser.address.country.code,
            email: foundUser.email,
            legal_entity:{
                address: {
                  city:foundUser.address.city,
                  line1:foundUser.address.line1,
                  line2:foundUser.address.line2,
                  postal_code:foundUser.address.post,
                  state:foundUser.address.state.code,
                },
                first_name:foundUser.given,
                last_name:foundUser.surname,
                dob: {
                  day: foundUser.birthday.getDate(),
                  month: foundUser.birthday.getMonth()+1,
                  year: foundUser.birthday.getFullYear()
                },
                payout_schedule: {
                  interval: 'manual'
                },
                type: 'individual'
              },
            tos_acceptance: {
              date: tosDate / 1000,
              ip: req.ip
            }
          }, (err, newAccount)=>{
            if(err){
              error(req, res, err);
            } else {
              if(newAccount.verification.fields_needed.length > 0){
                foundUser.stripe.fields_needed = newAccount.verification.fields_needed;
                foundUser.missingInfo = true;
              } else {
                foundUser.stripe.fields_needed = [];
                foundUser.missingInfo = false;
              }
              foundUser.isArtist = true;
              foundUser.stripe.id = newAccount.id;
              foundUser.save();
              req.flash('success', 'Make us proud!');
              res.redirect('/dash');
            }
          });
        } else {
          stripe.accounts.create({
            type:'custom',
            country: foundUser.address.country.code,
            email: foundUser.email,
            legal_entity:{
              address: {
                city:foundUser.address.city,
                line1:foundUser.address.line1,
                line2:foundUser.address.line2,
                postal_code:foundUser.address.post,
              },
              first_name:foundUser.given,
              last_name:foundUser.surname,
              dob: {
                day: foundUser.birthday.getDate(),
                month: foundUser.birthday.getMonth()+1,
                year: foundUser.birthday.getFullYear()
              },
              type: 'individual'
            },
            payout_schedule: {
              interval: 'manual'
            },
            tos_acceptance: {
              date: tosDate/1000,
              ip: req.ip
            },
          }, (err, newAccount)=>{
            if(err){
              error(req, res, err);
            } else {
              if(newAccount.verification.fields_needed.length > 0){
                foundUser.stripe.fields_needed = newAccount.verification.fields_needed;
                foundUser.missingInfo = true;
              } else {
                foundUser.stripe.fields_needed = [];
                foundUser.missingInfo = false;
              }
              foundUser.isArtist = true;
              foundUser.stripe.id = newAccount.id;
              foundUser.save();
              req.flash('success', 'Make us proud!');
              res.redirect('/dash');
            }
          });
        }
      } else {
        stripe.accounts.create({
          type:'custom',
          country: foundUser.address.country.code,
          email: foundUser.email,
          legal_entity: {
            type: 'individual'
          },
          payout_schedule: {
            interval: 'manual'
          },
          tos_acceptance: {
            date: tosDate/1000,
            ip: req.ip
          }
        }, (err, newAccount)=>{
          console.log(newAccount);
          if(err){
            error(req, res, err);
          } else {
            if(newAccount.verification.fields_needed.length > 0){
              foundUser.stripe.fields_needed = newAccount.verification.fields_needed;
              foundUser.missingInfo = true;
            } else {
              foundUser.stripe.fields_needed = [];
              foundUser.missingInfo = false;
            }
            foundUser.isArtist = true;
            foundUser.stripe.id = newAccount.id;
            foundUser.save();
            req.flash('success', 'Make us proud!');
            res.redirect('/dash');
          }
        });
      }
    }
  });
});
router.get('/user/delete', (req, res)=>{
  User.findById(req.user._id, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else {
      for(let year of foundArtist.analytics){
        Year.findOne({_id:year,user:foundArtist._id.toString()}, (err,foundYear)=>{
          if(err){
            error(req, res, err);
          } else {
            for(let month of foundYear.months){
              Month.findOne({_id:month, user:foundArtist._id.toString()}, (err, foundMonth)=>{
                if(err){
                  error(req, res, err);
                } else {
                  for(let day of foundMonth.days){
                    Day.findOneAndRemove({_id:day, user:foundArtist._id.toString()}, (err)=>{
                      if(err){
                        error(req, res, err);
                      }
                    });
                  }
                }
              });
              Month.findOneAndRemove({_id:month, user:foundArtist._id.toString()}, (err)=>{
                if(err){
                  error(req, res, err);
                }
              });
            }
          }
        });
        Year.findOneAndRemove({_id:year, user:foundArtist._id.toString()}, (err)=>{
          if(err){
            error(req, res, err);
          }
        });
      }
      for(let art of foundArtist.gallery){
        Gallery.findOne({_id:art}, (err, foundGal)=>{
          if(err){
            error(req, res, err);
          } else {
            for(let year of foundGal.analytics){
              Year.findOne({_id:year,gallery:foundGal._id.toString()}, (err,foundYear)=>{
                if(err){
                  error(req, res, err);
                } else {
                  for(let month of foundYear.months){
                    Month.findOne({_id:month, gallery:foundGal._id.toString()}, (err, foundMonth)=>{
                      if(err){
                        error(req, res, err);
                      } else {
                        for(let day of foundMonth.days){
                          Day.findOneAndRemove({_id:day, gallery:foundGal._id.toString()}, (err)=>{
                            if(err){
                              error(req, res, err);
                            }
                          });
                        }
                      }
                    });
                    Month.findOneAndRemove({_id:month, gallery:foundGal._id.toString()}, (err)=>{
                      if(err){
                        error(req, res, err);
                      }
                    });
                  }
                }
              });
              Year.findOneAndRemove({_id:year, gallery:foundGal._id.toString()}, (err)=>{
                if(err){
                  error(req, res, err);
                }
              });
            }
            galleryIndex.deleteObject(art.toString(), (err, content)=>{
              if(err){
                error(req, res, err);
              } else {
                Gallery.findOneAndRemove({_id:art}, (err)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
              }
            });
          }
        });
        
      }
      for(let comm of foundArtist.commissions){
        Commission.findById(comm, (err, foundComm)=>{
          if(err){
            error(req, res, err);
          } else {
            commissionIndex.deleteObject(foundComm._id, (err, content)=>{
              if(err){
                error(req, res, err);
              } else {
                for(let img of comm.example){
                  blobClient.deleteBlobIfExists('examples', img.id, (err, response)=>{
                    if(err != null){
                      error(req, res, err);
                    } else {
                      if(comm.example.indexOf(img) == comm.example.length - 1){
                        Commission.findOneAndRemove({_id:foundComm._id}, (err)=>{
                          if(err){
                            error(req, res, err);
                          }
                        });
                      }
                    }
                  });
                }
              }
            });
          }
        });
      }
      if(foundArtist.stripe.id){
        stripe.accounts
        .del(foundArtist.stripe.id)
        .then((done)=>{
          if(done.deleted != true){
            error(req, res, err);
          }
        });
      }
      userIndex.deleteObject(req.user._id, (err, content)=>{
        if(err){
          error(req, res, err);
        }
      });
      User.findOneAndRemove({_id:req.user._id}, (err)=>{
        if(err){
          error(req, res, err);
        } else {
          req.logout();
          res.redirect('/');
        }
      });
    }
  });
});
router.post('/user/missing_info', (req, res)=>{
  let given = req.body.givenName,
      surname = req.body.surname,
      line1 = req.body.street,
      line2 = req.body.suite,
      city = req.body.city,
      country = {code:req.body.country,name:countries[req.body.country.toUpperCase()]},
      post = req.body.post,
      birthday = new Date(req.body.birthdate),
      address = {line1, line2, city, country, post},
      name = {given,surname},
      valArr = [given, surname, line1, city, post, birthday],
      ready = true;
  if(req.body.state && req.body.state != ''){
    address.state = {code:req.body.state.toLowerCase(), name:states[req.body.country.toUpperCase()][req.body.state.toUpperCase()]};
  } else {
    address.state = null;
  }
  for(let val of valArr){
    if(['',null,undefined].includes(val)){
      ready = false;
    }
  }
  if(ready == true){
    User.findByIdAndUpdate(req.user._id,{address, name, birthday, missingInfo:false, isArtist:true}, (err, upUser)=>{
      if(err){
        error(req, res, err);
      } else {
        // Update Stripe Account
        if(upUser.stripe.id){
          stripe.accounts.update(upUser.stripe.id,{
            legal_entity:{
              address: {
                city,
                line1:line1,
                line2:line2,
                postal_code:post,
                state:address.state.code
              },
              first_name:given,
              last_name:surname,
              dob: {
                day: birthday.getDate(),
                month: birthday.getMonth()+1,
                year: birthday.getFullYear()
              }
            }
          })
          .then((response)=>{
            if(response.verification.fields_needed.length > 0){
              upUser.stripe.fields_needed = response.verification.fields_needed;
              upUser.save();
            }
            req.flash('success', 'You\'re (mostly) ready!');
            res.redirect('back');
          })
          .catch((err)=>{
            error(req, res, err);
          });
        } else {
          let dateToParse = new Date(Date.now()),
              tosDate = dateToParse.parse();
          stripe.accounts.create({
            type:'custom',
            country: upUser.country.toUpperCase(),
            email: upUser.email,
            legal_entity:{
              address: {
                city,
                line1:line1,
                line2:line2,
                postal_code:post,
                state:address.state.code.toLowerCase()
              },
              first_name:given,
              last_name:surname,
              dob: {
                day: birthday.getDate(),
                month: birthday.getMonth()+1,
                year: birthday.getFullYear()
              }
            },
            tos_acceptance: {
              date: tosDate,
              ip: req.ip
            }
          }, (err, newAccount)=>{
            if(err){
              error(req, res, err);
            } else {
              if(newAccount.verification.fields_needed.length > 0){
                upUser.stripe.fields_needed = newAccount.verification.fields_needed;
              }
              upUser.stripe.id = newAccount.id;
              upUser.save();
              req.flash('success', 'You\'re (mostly) ready!');
              res.redirect('back');
            }
          });
        }
      }
    });
  } else {
    error(req, res, 'You didn\'t fill out all the info.');
  }
});
router.get('/user/new', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      res.render('newUser', {user:foundUser});
    }
  });
});
router.post('/user/new/artist', (req, res)=>{
  let country = req.body.country.toUpperCase(),
      name = {given:req.body.firstName, surname:req.body.lastName, preferred:req.body.prefName},
      birthday = new Date(req.body.birthday),
      state,
      city,
      post,
      address,
      ready,
      update;
  if(country == 'AU'){
    state = req.body.auState;
  } else if(country == 'CA'){
    state = req.body.caState;
  } else if(country == 'US'){
    state = req.body.usState;
  }
  if(['AU','CA','US'].includes(country)){
    city = req.body.stateCity;
    post = req.body.statePost;
    address = {line1:req.body.street, line2:req.body.suite, city, state:{code:state,name:states[country][state]}, country:{code:country, name:countries[country]}, post};
    update = {name, birthday, address, isArtist:true};
  } else {
    city = req.body.noStateCity;
    post = req.body.noStatePost;
    address = {line1:req.body.street, line2:req.body.suite, city, country:{code:country, name:countries[country]}, post};
    update = {name, birthday, address, isArtist:true, ip: req.headers['x-forwarded-for']};
  }
  User.findOneAndUpdate({_id:req.user._id}, update, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      let ip;
      if(req.headers['x-forwarded-for'].toString().includes(':')){
        ip = req.headers['x-forwarded-for'].toString().slice(0,-6);
      } else {
        ip = req.headers['x-forwarded-for'].toString();
      }
      stripe.accounts.create({
        country: country,
        legal_entity:{
          address:{
            city: city,
            country: country,
            line1: req.body.street,
            line2: req.body.suite,
            postal_code: post,
            state: state
          },
          dob: {
            day: birthday.getDate(),
            month: birthday.getMonth() + 1,
            year: birthday.getFullYear()
          },
          first_name: req.body.firstName,
          last_name: req.body.lastName,
          type: 'individual'
        },
        payout_schedule: {
          interval: 'manual'
        },
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: ip
          },
        type: 'custom'
      })
      .then((acct)=>{
        foundUser.stripe.id = acct.id;
        if(['AU','CA','US'].includes(country)){
          foundUser.address.state = {code:state, name:states[country][state]};
        }
        foundUser.stripe.fields_needed = acct.verification.fields_needed;
        foundUser.newUser = false;
        foundUser.save();
        req.flash('success', 'Great to Meet You!');
        res.redirect('/dash');
      })
      .catch((err)=>{
        error(req, res, err);
      });
    }
  });
});
router.post('/user/new/client', (req, res)=>{
  let given = req.body.firstName,
      surname  = req.body.lastName,
      preferred = req.body.prefName,
      birthday,
      line1 = req.body.street,
      line2 = req.body.suite,
      city = req.body.city,
      country = req.body.country.toUpperCase(),
      post = req.body.post,
      name = {given, surname, preferred},
      address = {line1, line2, city, country:{code:country,name:countries[country]}, post},
      update = {name, address, isArtist:false, newUser: false},
      artistCountries = ['us','uk','ch','se','es','sg','pt','no','nz','nl','lu','jp','it','ie','hk','de','fr','fi','dk','ca','be','at','au'];
  if(artistCountries.includes(country)){
    update.canArt = true;
  } else {
    update.canArt = false;
  }
  if(req.body.birthday){
    birthday = new Date(req.body.birthday);
    update.birthday = birthday;
  }
  User.findByIdAndUpdate(req.user._id, update, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      req.flash('success', 'Great to Meet You!');
      res.redirect('/dash');
    }
  });
});


module.exports = router;

function accountChange (req, res, emailAddress){
  let email = {
    'Messages':[{
      'From':{
        'Email':'team@splatr.art',
        'Name':'The Splatr Team'
      },
      'To':[{
        'Email': emailAddress,
      }],
      'Subject': 'Your Account Was Updated.',
      'TextPart': 'Someone updated your account. We really hope it was you. If not, contact our team right away.',
      'HTMLPart': `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Welcome to Splatr. We\'re glad you\'re here!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a {font-family: "Roboto", sans-serif;text-decoration:none}small{font-size:8pt; text-align:center;margin-top:15px}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="50px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td></tr><tr><td><table width="100%"  bgcolor="#eee" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Your Account Was Updated!</h1><p>We really hope that was you. If it wasn't you need to contact us at <a href="mailto:team@splatr.art">team@splatr.art</a></p></td></tr></table></td></tr><tr><td><table width="100%" cellpadding="10px" align="center"><tr><td style="text-align:center"><address><small>Copyright &#9400; 2019 Splatr, LLC.<br>1001 River Road | Brunswick, Maine 04011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
    }]
  };
  mailjet
  .post('send', {'version':'v3.1'})
  .request(email)
  .catch((err)=>{
    error(req, res, err);
  });
}
function checkLogin (req, res, next){
  if(!req.user){
    req.flash('error', 'You need to be logged in.');
    res.redirect('/login');
  } else {
    next();
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
  SplatrError.create(errorObj, (error, newError)=>{
    if(error){
      console.log(error);
    } else {
      if(err.message){
        req.flash('error', err.message);
        if(req.get('Referer')){
          res.redirect('back');
        } else {
          res.redirect('/login');
        }
      } else {
        req.flash('error', err);
        if(req.get('Referer')){
          res.redirect('back');
        } else {
          res.redirect('/login');
        }
      }
    }
  });
}
function dateFormat(date, locale){
  let months =  ['January', 'February', 'March','April','May','June','July','August','September','October','November','December'],
      computed_date = new Date(date),
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