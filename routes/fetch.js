const express = require("express"),
      router  = express.Router(),
      date = new Date(),
      crypto  = require('crypto-random-string'),
      // photo uploads
      azure = require("azure-storage"),
      multer = require('multer'),
      streamifier = require('streamifier'),
      storageAccount = process.env.AZURE_STORAGE_ACCOUNT,
      storageKey = process.env.AZURE_STORAGE,
      azureEndpoint = process.env.AZURE_STORAGE_ENDPOINT,
      blobClient = azure.createBlobService(storageAccount, storageKey),
      jimp = require('jimp'),
      // search
      search = require('algoliasearch'),
      client = search('', process.env.ALGOLIA),
      artIndex = client.initIndex('galleries'),
      commissionIndex = client.initIndex('commissions'),
      transIndex = client.initIndex('transactions'),
      userIndex = client.initIndex('users'),
      // email
      mailjet = require('node-mailjet').connect(process.env.MJ_APIKEY_PUBLIC, process.env.MJ_APIKEY_PRIVATE),
      // Stripe
      stripe = require('stripe')(process.env.STRIPE),
      // models
      User = require('../models/user.js'),
      Commission = require('../models/commission.js'),
      Transaction = require('../models/transaction.js'),
      Gallery = require('../models/gallery.js'),
      Comment = require('../models/comment.js'),
      Notification = require('../models/notification.js'),
      Report = require('../models/report.js'),
      SplatrError = require('../models/error.js'),
      Dispute = require('../models/dispute.js'),
      reserved = ['login', 'register', 'about', 'search', 'legal', 'splatr', 'verify', 'faq'],
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
                  };
      
router.use((req, res, next)=>{
  checkLogin(req, res, next);
});

router.put('/:artist/follow', (req, res)=>{
  User.findOne({username:req.params.artist}, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findOne({_id:req.user._id}, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else {
          if(foundArtist.fans.indexOf(req.user._id) == -1){
            Notification.create({date, from:foundUser, text:`${foundUser.username} is now following you!`, type:'follow', url:`/${foundUser.username}`}, (err, newNote)=>{
              if(err){
                error(req, res, err);
              } else {
                foundArtist.fans.push(foundUser._id);
                foundArtist.notifications.unshift(newNote);
                foundArtist.save();
                foundUser.following.push(foundArtist._id);
                foundUser.save();
                res.status(200).send('Following');
              }
            });
          } else {
            let index = foundArtist.fans.indexOf(foundUser._id),
                artistIndex = foundUser.following.indexOf(foundArtist._id);
            foundArtist.fans.splice(index, 1);
            foundArtist.save();
            foundUser.following.splice(artistIndex,1);
            foundUser.save();
            res.status(200).send('Unfollowed');
          }
        }
      });
    }
  });
});
router.put('/address', multer().fields([]), (req, res)=>{
  let line1  = req.body.line1,
      line2   = req.body.line2,
      city    = req.body.city,
      country = {code:req.body.country, name:countries[req.body.country]},
      post    = req.body.post,
      address = {line1,line2,city,country,post},
      artistCountries = ['us','uk','ch','se','es','sg','pt','no','nz','nl','lu','jp','it','ie','hk','de','fr','fi','dk','ca','be','at','au'];
  if(['US','CA','AU'].includes(req.body.country)){
    address.state.code = req.body.state;
  }
  User.findByIdAndUpdate(req.user._id,{address},(err, foundUser)=>{
    if(err){
      error(req, res, "We couldn't find you.");
    } else {
      if(foundUser.isArtist == true){
        let stripeAddress = {
              city,
              country: req.body.country,
              line1,
              line2,
              postal_code:post,
            };
        if(['US','CA','AU'].includes(req.body.country)){
          stripeAddress.state = req.body.state;
        }
        stripe.accounts.update(foundUser.stripe.id, {
          legal_entity:{
            address: stripeAddress
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
      res.status(200).send('Done!');
    }
  });
});
router.put('/background', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, upUser)=>{
    if(err){
      error(req, res, err);
    } else {
      upUser.preferences.background = req.body.val;
      upUser.save();
      res.status(200).send('All set!');
    }
  });
});
router.put('/bio', multer().fields([]), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      foundUser.description = req.body.bio;
      foundUser.save();
      res.status(200).send('Done');
    }
  });
});
router.put('/dash_background', multer().fields([]), (req, res)=>{
  let values = ['#f0efea','#3f3050','Seattle','Paint Pallette', 'Melbourne','BFs at Sunset','Backpacker w- camera'],
      background;
  if([0,1].includes(Number(req.body.index))){
    background = values[req.body.index];
  } else {
    background = `https://ayizan.blob.core.windows.net/site-images/${values[req.body.index]}.jpeg`;
  }
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      foundUser.preferences.dash_background = background;
      foundUser.save();
      res.status(200).send(background);
    }
  });
});
router.put('/banner', multer().single('image'), (req, res)=>{
  let stream = streamifier.createReadStream(req.file.buffer),
      time = new Date().getTime(),
      id = `${req.user._id}${time}.png`,
      container = 'banners',
      url   = `${azureEndpoint + container}/${id}`,
      options =  {
        contentSettings:{
            contentType: "image/png"
        },
        metadata: {fileName:id}
      };
      
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      if(foundUser.banner.name){
        blobClient.deleteBlobIfExists(container, foundUser.banner.id, (err, response)=>{
          if(err){
            error(req, res, err);
          }
        });
      }
      blobClient.createBlockBlobFromStream(container, id, stream, req.file.size, options, (err, response)=>{
        if(err){
          error(req, res, err);
        } else {
          foundUser.banner = {id, url};
          foundUser.save();
          res.send('Done.');
        }
      });
    }
  });
});
router.delete('/commission/delete/:id', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      Commission.findOne({_id:req.params.id}, (err, foundComm)=>{
        if(err){
          error(req, res, err);
        } else if(foundUser._id.toString() != foundComm.artist.toString()){
          error(req, res, 'You can\'t delete that.');
        } else {
          let index = foundUser.commissions.indexOf(foundComm._id);
          foundUser.commissions.splice(index,1);
          foundUser.save();
          blobClient.deleteBlobIfExists('examples', foundComm.example.id, (err, response)=>{
            if(err != null){
              error(req, res, err);
            } else {
              Commission.findByIdAndRemove(foundComm._id, (err)=>{
                if(err){
                  error(req, res, err);
                } else {
                  commissionIndex.deleteObject(foundComm._id.toString(), (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                  res.status(200).send('Removed');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.put('/commission/edit/:id', multer().single('image'), (req, res)=>{
  Commission.findById(req.params.id, (err, foundComm)=>{
      if(err){
        error(req, res, err);
      } else if(foundComm.artist.toString() != req.user._id.toString()){
        error(req, res, 'That\'s not for you to edit.');
      } else {
        let example;
        if(req.file){
          let stream = streamifier.createReadStream(req.file.buffer),
              id = `exam_${crypto(24)}.png`,
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
                    error(req, res, err);
                  } else {
                    example = url;
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
            tags  = req.body.tags.split(/\s*#/),
            NSFW  = req.body.NSFW,
            upComm = {date,description,name,price,type,tags,NSFW};
        
        if(req.body.available == 0 || isNaN(req.body.available) == true){
          available = null;
        } else {
          available = req.body.available;
        }
        upComm.available = available;
        Commission.findOneAndUpdate({_id:foundComm._id}, upComm, (err,upCommish)=>{
          if(err){
            error(req, res, err);
          } else {
            let commUpdate = {
              objectID:foundComm._id,
              available,
              example,
              name,
              price: price/100,
              type,
              tags,
              NSFW
            };
            commissionIndex.partialUpdateObject(commUpdate, (err, response)=>{
              if(err){
                error(req, res, err);
              }
            });
            res.status(200).send('All set.');
          }
        });
      }
    });
});
router.put('/commission/new', multer().single('image'), (req, res)=>{
  let stream = streamifier.createReadStream(req.file.buffer),
    id = `exam_${crypto(24)}.png`,
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
          description = req.body.description,
          name  = req.body.name,
          price = req.body.price,
          type = req.body.type,
          NSFW  = req.body.NSFW,
          tags = req.body.tags.split(/\s*#/),
          example = {id, url},
          newComm = {date,description,name,price,type,NSFW,tags,example,artist:req.user._id};
      if(req.body.available == 0){
        available = null;
      } else {
        available = req.body.available;
      }
      newComm.available = available;
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
                example:example.url
              };
              commissionIndex.addObject(commObject, (err, response)=>{
                if(err){
                  error(req, res, err);
                }
              });
              for(let fan of foundUser.fans){
                User.findOne({_id:fan}, (err, foundFan)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    Notification.create({date, from:foundUser, text:`${foundUser.username} posted a new commission!`, type:'new', url:`/${foundUser.username}`}, (err, newNote)=>{
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
              foundUser.commissions.unshift(newCommish);
              foundUser.save();
              res.status(200).json(newCommish);
            }
          });
        }
      });
    }
  });
});
router.put('/description', (req, res)=>{
  User.findByIdAndUpdate(req.user._id, {description:req.body.description}, (err, upUser)=>{
    if(err){
      error(req, res, err);
    } else {
      res.status(200).send('Done');
    }
  });
});
router.delete('/gallery/delete/:id', (req, res)=>{
  Gallery.findOne({_id:req.params.id})
  .exec((err, foundGallery)=>{
    if(err) {
      error(req, res, err);
    } else {
      if(req.user._id.toString() != foundGallery.artist.toString()){
        error(req, res, 'That is not yours to delete.');
      } else {
        if(foundGallery.commissioned == false){
          Gallery.findOneAndRemove({_id:foundGallery._id})
          .exec((err)=>{
            if(err){
              error(req, res, err);
            } else {
              artIndex.deleteObject(foundGallery._id.toString(), (err, response)=>{
                if(err){
                  error(req, res, err);
                } else {
                  for(let img of foundGallery.image){
                    blobClient.deleteBlobIfExists('galleries', img.id, (err, response)=>{
                      if(err){
                        error(req, res, err);
                      }
                    });
                  }
                  User.findOne({_id:req.user._id})
                  .populate('gallery.non_commissioned')
                  .exec((err, foundUser)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      let index = foundUser.gallery.non_commissioned.indexOf(foundGallery);
                      foundUser.gallery.non_commissioned.splice(index, 1);
                      foundUser.save();
                      res.status(200).send('Done');
                    }
                  });
                }
              });
            }
          });
        } else {
          for(let img of foundGallery.image){
            if(img.public_id) {
              blobClient.deleteBlobIfExists('finals', `${img.id.substring(0,7)}_public_${img.id.substring(7)}`,(err, response)=>{
                if(err){
                  error(req, res, err);
                }
              });
              img.public_id = undefined;
            }
          }
          artIndex.deleteObject(foundGallery._id.toString(), (err, response)=>{
            if(err){
              error(req, res, err);
            }
          });
          User.findOne({_id:req.user._id})
          .populate('gallery.commissioned')
          .exec((err, foundUser)=>{
            if(err){
              error(req, res, err);
            } else {
              let index = foundUser.gallery.commissioned.indexOf(foundGallery);
              foundUser.gallery.splice(index, 1);
              foundUser.save();
              res.status(200).send('Done')
            }
          });
        }
      }
    }
  });
});
router.put('/gallery/edit', multer({limits:{files:10, fileSize:10000000}}).array('images'), (req, res)=>{
  Gallery.findOne({_id:req.body.id}, (err, foundGallery)=>{
    console.log(req.body);
    if(err){
      error(req, res, err);
    } else if(foundGallery == null){
      error(req, res, 'Your artwork doesn\'t exist.');
    } else {
      let container;
      if(foundGallery.commissioned == true){
        container = 'finals';
      } else {
        container = 'galleries';
      }
      if(req.body.prior_images.length > 0){
        for(let index of req.body.prior_images){
          blobClient.deleteBlobIfExists(container, foundGallery.image[index].id, (err, response)=>{
            if(err != null){
              error(req, res, err);
            } else {
              if(foundGallery.public_id != ''){
                blobClient.deleteBlobIfExists(container,`${foundGallery.image[index].id.substring(0,7)}public_${foundGallery.image[index].id.substring(7)}`, (err, response)=>{
                  if(err != null){
                    error(req, res, err);
                  }
                });
              }
              foundGallery.image.splice(index, 1);
              foundGallery.save();
            }
          });
        }
      }
      uploadImgs(req, res, container)
      .then((imgData)=>{
        let tags = req.body.tags.split(/ *#/);
        if(foundGallery.title != req.body.title){
          let splitTitle = req.body.title.split(' '),
              linked_title = splitTitle.join('_').toLowerCase();
          foundGallery.title = req.body.title;
          foundGallery.linked_title = linked_title;
        }
        if(req.body.NSFW == 'true'){
          foundGallery.NSFW = true;
        }
        if(req.body.type != ''){
          foundGallery.type = req.body.type;
        }
        foundGallery.alt_text = req.body.alt;
        foundGallery.description = req.body.description;
        foundGallery.image.concat(imgData);
        foundGallery.tags = tags;
        foundGallery.save();
        res.status(200).send('Done');
      });
    }
  });
});
router.post('/gallery/new', multer({limits:{files:10, fileSize:10000000}}).array('images'), (req, res)=>{
  let images = [],
      title_raw = req.body.title.split(' '),
      linked_title = `${title_raw.join('_')}-${crypto(8)}`,
      tags = req.body.tags.split(/\s*#/),
      NSFW = true;
  if(req.body.honey == ''){
    if(req.body.NSFW == 'false'){
      NSFW = false;
    }
    for(let img of req.files){
      let type = img.mimetype.substring(6),
          stream = streamifier.createReadStream(img.buffer),
          id_crypto = crypto(24),
          id= `gallery_${id_crypto}.${type}`,
          container = 'galleries',
          url = `${azureEndpoint}galleries/${id}`,
          options = {
            contentSettings: {
              contentType: `image/${type}`
            },
            metadata: {fileName:id}
          };
      
      if(req.body.downscale == 'true' && req.body.watermark == 'true'){
        jimp
        .read(img.buffer)
        .then((image)=>{
          jimp
          .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark.png')
          .then((watermark)=>{
            image.scale(.25);
            return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
          })
          .then((img_marked)=>{
            jimp.loadFont(jimp.FONT_SANS_16_WHITE)
            .then(font=>([img_marked, font]))
            .then((img_data)=>{
              let img_marked = img_data[0],
                  font = img_data[1],
                  text = `© ${date.getFullYear()} ${req.user.username}`,
                  textData = {
                    maxWidth: img_marked.bitmap.width - 50,
                    maxHeight: 92,
                    placementX: 10,
                    placementY: img_marked.bitmap.height - 82
                  };
              return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
            })
            .then((final)=>{
              final.getBufferAsync(jimp.MIME_JPEG)
              .then((buffer) => {
                let public_stream = streamifier.createReadStream(buffer),
                    public_size = buffer.byteLength,
                    public_options = {
                      metadata: {fileName:id}
                    };
                blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
              })
              .catch(err => error(req, res, err));
            })
            .catch(err => error(req, res, err));
          });
        })
        .catch(err => error(req, res, err));
      } else if (req.body.downscale == 'true') {
        jimp
        .read(img.buffer)
        .then((image)=>{
          image.scale(.25);
          image.getBufferAsync(jimp.MIME_JPEG)
          .then((buffer)=>{
            let public_stream = streamifier.createReadStream(buffer),
                public_size = buffer.byteLength,
                public_options = {
                  metadata: {fileName:id}
                };
            blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
              if(err){
                error(req, res, err);
              }
            });
          })
          .catch(err => error(req, res, err));
        })
        .catch(err => error(req, res, err));
      } else if (req.body.watermark == 'true') {  
        jimp
        .read(img.buffer)
        .then((image)=>{
          if(image.bitmap.width > 1200) {
            jimp
            .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark_lg.png')
            .then((watermark)=>{
              watermark.opacity(0.5);
              return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
            })
            .then((img_marked)=>{
              jimp.loadFont(jimp.FONT_SANS_64_WHITE)
              .then(font=>([img_marked, font]))
              .then((img_data)=>{
                let img_marked = img_data[0],
                    font = img_data[1],
                    text = `© ${date.getFullYear()} ${req.user.username}`,
                    textData = {
                      maxWidth: img_marked.bitmap.width - 50,
                      maxHeight: 92,
                      placementX: 10,
                      placementY: img_marked.bitmap.height - 152
                    };
                return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
              })
              .then((final)=>{
                final.getBufferAsync(jimp.MIME_JPEG)
                .then((buffer) => {
                  let public_stream = streamifier.createReadStream(buffer),
                      public_size = buffer.byteLength,
                      public_options = {
                        metadata: {fileName:id}
                      };
                  blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                })
                .catch(err => error(req, res, err));
              })
              .catch(err => error(req, res, err));
            });
          } else {
            jimp
            .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark.png')
            .then((watermark)=>{
              return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
            })
            .then((img_marked)=>{
              jimp.loadFont(jimp.FONT_SANS_16_WHITE)
              .then(font=>([img_marked, font]))
              .then((img_data)=>{
                let img_marked = img_data[0],
                    font = img_data[1],
                    text = `© ${date.getFullYear()} ${req.user.username}`,
                    textData = {
                      maxWidth: img_marked.bitmap.width - 50,
                      maxHeight: 92,
                      placementX: 10,
                      placementY: img_marked.bitmap.height - 82
                    };
                return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
              })
              .then((final)=>{
                final.getBufferAsync(jimp.MIME_JPEG)
                .then((buffer) => {
                  let public_stream = streamifier.createReadStream(buffer),
                      public_size = buffer.byteLength,
                      public_options = {
                        metadata: {fileName:id}
                      };
                  blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                })
                .catch(err => error(req, res, err));
              })
              .catch(err => error(req, res, err));
            });
          }
        })
        .catch(err => error(req, res, err));
      } else {   
        blobClient.createBlockBlobFromStream(container, id, stream, img.size, options, (err, response)=>{
          if(err != null){
            error(req, res, err);
          }
        });
      }
      images.push({id,url});
      if(images.length == req.files.length){
        User.findOne({_id:req.user._id}, (err, foundArtist)=>{
          if(err){
            error(req, res, err);
          } else {
            Gallery.create({alt_text:req.body.alt, artist:foundArtist._id, commissioned: false, created:req.body.date, description:req.body.description, image:images, linked_title, NSFW, tags, title:req.body.title, type:req.body.type}, (err, newGallery)=>{
              if(err){
                error(req, res, err);
              } else {
                newGallery.save();
                let artObject = {
                      objectID:newGallery._id,
                      artist: foundArtist.username,
                      commissioned: false,
                      image: newGallery.image[0].url,
                      NSFW,
                      title: newGallery.title,
                      type: req.body.type,
                      url:`gallery/${foundArtist.username}/${newGallery.linked_title}`
                    };
                foundArtist.gallery.non_commissioned.unshift(newGallery._id);
                foundArtist.save();
                artIndex.addObject(artObject, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    res.status(200).send('Done');
                  }
                });
              }
            });
          }
        });
      }
    }
  } else {
    error(req, res, 'Bots aren\'t allowed.');
  }
});
router.put('/gallery/:username/:id/comment/:commentID/like', (req, res)=>{
  Comment.findOne({_id:req.params.commentID}, (err, foundComment)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findOne({_id:req.user._id}, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else if(foundUser._id.toString() == foundComment.from.toString()){
          error(req, res, 'You really shouldn\'t like your own comments. It\'s not cool.');
        } else {
          if(foundComment.likes.includes(foundUser._id.toString())){ 
            let index = foundComment.likes.indexOf(foundUser._id.toString());
            foundComment.likes.splice(index, 1);
            foundComment.save();
            res.status(200).send('unliked');
          } else {
            User.findOne({_id:foundComment.from}, (err, foundCommenter)=>{
              if(err){
                error(req, res, err);
              } else {
                Notification.create({
                  from: foundUser._id,
                  date,
                  comment: foundComment,
                  text:`${foundUser.username} liked your comment.`,
                  type: 'commentLike',
                  url: `/gallery/${req.params.username}/${req.params._id}/#${foundComment._id}`
                }, (err, newNote)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    foundCommenter.notifications.unshift(newNote);
                    foundComment.likes.unshift(foundUser._id.toString());
                    foundCommenter.save();
                    foundComment.save();
                    res.status(200).send('liked');
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
router.put('/gallery/:username/:id/like', (req, res)=>{
  Gallery.findOne({_id:req.params.id}, (err, foundGallery)=>{
    if(err){
      error(req, res, err);
    } else {
      User.findOne({_id:req.user._id}, (err, foundUser)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findOne({username:req.params.username}, (err, foundArtist)=>{
            if(err){
              error(req, res, err);
            } else if(foundArtist._id == foundUser._id){
              error(req, res, 'You can\'t add a like to your own work.');
            } else {
              if(foundGallery.likes.includes(foundUser._id.toString())){
                let index = foundGallery.likes.indexOf(foundUser._id.toString()),
                    galleryUpdate = {
                      objectID: foundGallery._id,
                      likes: foundGallery.likes.length --
                    };
                artIndex.partialUpdateObject(galleryUpdate, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
                foundGallery.likes.splice(index, 1);
                foundGallery.save();
                res.status(200).send('unliked');
              } else {
                let name;
                if(foundGallery.title){
                  name = foundGallery.title;
                } else {
                  name = 'your piece';
                }
                Notification.create({
                  from:foundUser._id,
                  date,
                  gallery: foundGallery._id,
                  text: `${foundUser.username} liked ${name}.`,
                  type: 'like',
                  url: `gallery/${foundArtist.username}/${foundGallery._id}`
                }, (err, newNote)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    let galleryUpdate = {
                      objectID: foundGallery._id,
                      likes: foundGallery.likes.length ++
                    };
                    analytic(req, res, null, foundGallery._id.toString(), 'likes', 1);
                    foundGallery.likes.unshift(foundUser._id.toString());
                    foundArtist.notifications.unshift(newNote);
                    foundGallery.save();
                    foundArtist.save();
                    artIndex.partialUpdateObject(galleryUpdate, (err, response)=>{
                      if(err){
                        error(req, res, err);
                      }
                    });
                    res.status(200).send('liked');
                  }
                });
              }
            }
          });
        }
      });
    }
  });
});
router.put('/login', multer().fields([]), (req, res)=>{
  let username = req.body.username,
      email = req.body.email,
      marketing = req.body.marketing;
  User.findOne({username}, (err, conflictUser)=>{
    if(err){
      error(req, res, err);
    } else {
      if(conflictUser.username != req.user.username || reserved.includes(username)){
        error(req, res, 'Someone has that username.');
      } else {
        User.findOne({_id:req.user._id}, (err, foundUser)=>{
          if(err){
            error(req, res, err);
          } else {
            let marketingBool;
            if(marketing == 'true'){
              marketingBool = true;
            } else if(marketing == 'false'){
              marketingBool = false;
            }
            if(username != req.user.username){
              let userUpdate = {
                objectID:req.user._id,
                username
              };
              foundUser.username = username;
              for(let comm of foundUser.commissions){
                Commission.findOne({_id:comm}, (err, foundComm)=>{
                  let commUpdate = {
                    objectID: foundComm._id,
                    artist: username
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
              for(let piece of foundUser.gallery){
                Gallery.findOne({_id:piece}, (err, foundPiece)=>{
                  if(err){
                    error(req, res, err);
                  } else {
                    let pieceUpdate = {
                      objectID: foundPiece._id,
                      artist: username
                    };
                    artIndex.partialUpdateObject(pieceUpdate, (err, response)=>{
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
            }
            foundUser.email = email;
            foundUser.marketingEmails = marketingBool;
            accountChange(req, res, foundUser.email, foundUser.username);
            foundUser.save();
            res.status(200).send('Done');
          }
        });
      }
    }
  });
});
router.put('/motto', multer().fields([]), (req, res)=>{
  User.findByIdAndUpdate(req.user._id, {motto:req.body.motto})
  .exec((err, updatedUser)=>{
    if(err){
      res.status(404).send('We couldn\'t find you.');
    } else {
      res.status(200).send('Mottoed!');
    }
  });
});
router.put('/name', multer().fields([]), (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      let legal_entity = {first_name:req.body.given, last_name:req.body.surname};
      if(!foundUser.birthday && req.body.dob){
        let dob = req.body.dob;
        foundUser.birthday = new Date(`${dob.month}/${dob.day}/${dob.year}`);
        legal_entity.dob = dob;
      }
      foundUser.name.given = req.body.given;
      foundUser.name.surname = req.body.surname;
      foundUser.name.preferred  = req.body.preferred;
      foundUser.save();
      if(foundUser.stripe.id){
        stripe.accounts.update(foundUser.stripe.id, {legal_entity})
        .then((response)=>{
          if(response.verification.fields_needed.length > 0){
            foundUser.stripe.fields_needed = response.verification.fields_needed;
            foundUser.save();
            res.status(200).send('Success!');
          } else {
            res.status(200).send('Success!');
          }
        })
        .catch((err)=>{
          error(req, res, err);
        });
      } else {
        res.status(200).send('Success!');
      }
    }
  });
});
router.delete('/notification/:id', (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(req.params.id) {
      Notification.findOne({_id:req.params.id}, (err, foundNote)=>{
        if(err){
          error(req, res, err);
        } else {
          let index = foundUser.notifications.indexOf(foundNote._id);
          foundUser.notifications.splice(index, 1);
          foundUser.save();
          Notification.findOneAndRemove({_id:req.params.id}, (err)=>{
            if(err){
              error(req, res, err);
            } else {
              res.status(200).send('Done.');                
            }
          });
        }
      });
    } else {
      req.flash('It seems the notification you\'re looking for does not exist.');
      res.redirect('back');
    }
  });
});
router.get('/notifications/get', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(foundUser == null){
      error(req, res, 'You need to be logged in.');
    } else {
      let newNotes = [],
          current = 0;
      if(foundUser.notifications.length > 0){
        for(let note of foundUser.notifications){
        Notification.findOne({_id:note}, (err, foundNote)=>{
          if(err){
            error(req, res, err);
          } else {
            if(foundNote.popNote == true){
              newNotes.push(foundNote);
              foundNote.popNote = false;
              foundNote.save();
            }
            current++;
            if(current == foundUser.notifications.length){
              res.status(200).json({notes:newNotes});
            }
          }
        });
      }
      } else {
        res.status(200).json({notes:[]}); 
      }
    }
  });
});
router.delete('/notifications/delete/:id', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      Notification.findOne({_id:req.params.id}, (err, foundNote)=>{
        if(err){
          error(req, res, err);
        } else if(foundUser.notifications.indexOf(foundNote._id.toString()) == -1){
          error(req, res, 'That is not for you to remove');
        } else {
          let index = foundUser.notifications.indexOf(foundNote._id.toString());
          foundUser.notifications.splice(index, 1);
          foundUser.save();
          Notification.findOneAndRemove({_id:req.params.id}, (err)=>{
            if(err){
              error(req, res, err);
            } else {
              res.status(200).json({message:'Removed', notes:foundUser.notifications.length});
            }
          });
        }
      });
    }
  });
});
router.put('/notifications/view', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      for(let note of foundUser.notifications){
        Notification.findOne({_id:note}, (err, foundNote)=>{
          if(err){
            error(req, res, err);
          } else {
            if(foundNote.new == true){
              foundNote.new == false;
              foundNote.save();
            }
          }
        });
      }
      res.status(200).send('Viewed.');
    }
  });
});
router.put('/nsfw', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(foundUser == null){
      error(req, res, 'Can\'t find anything...');
    } else {
      if(foundUser.nsfw_filter == true){
        foundUser.nsfw_filter = false;
        foundUser.save();
        res.status(200).send('false');
      } else if(foundUser.nsfw_filter == false){
        foundUser.nsfw_filter = true;
        foundUser.save();
        res.status(200).send('true');
      }
    }
  });
});
router.put('/profile', multer().single('image'), (req, res)=>{
  let stream = streamifier.createReadStream(req.file.buffer),
      time = new Date().getTime(),
      id = `${req.user._id}${time}.png`,
      container = 'profiles',
      url   = `${azureEndpoint + container}/${id}`,
      options =  {
        contentSettings:{
            contentType: "image/png"
        },
        metadata: {fileName:id}
      };
      
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req,res, err);
    } else {
      if(foundUser.profile.id){
        blobClient.deleteBlobIfExists(container, foundUser.profile.id, (err, response)=>{
          if(err){
            error(req, res, err);
          }
        });
      }
      blobClient.createBlockBlobFromStream(container, id, stream, req.file.size, options, (err, response)=>{
        if(err){
          error(req, res, err);
        } else {
          let userUpdate = {
            objectID:foundUser._id,
            profile: url
          };
          foundUser.profile = {id, url};
          foundUser.save();
          userIndex.partialUpdateObject(userUpdate, (err, response)=>{
            if(err){
              error(req, res, err);
            }
          });
          res.status(200).send('Done.');
        }
      });
    }
  });
});
router.post('/reverify', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      let cryptoVerify = crypto(26),
          cryptoExpire = new Date(Number(date) + 86400000);
      foundUser.crypto = cryptoVerify;
      foundUser.cryptoExpire = cryptoExpire;
      foundUser.save();
      verifyEmail(foundUser.email, cryptoVerify);
      res.send('Done.');
    }
  });
});
router.post('/request/new/:artist/:comm', multer({limits:{files:5, fileSize:500000000}}).array('references'), (req, res)=>{
  alterImages(req.files, req.body.watermark, req.body.downscale, req.user.username)
  .then((images)=>{
    return uploadFiles(images, 'ref', 'references');
  })
  .then((uploadedFiles)=>{
    makeRequest(req, res, uploadedFiles);
  })
  .catch((err)=>{
    error(req, res, err);
  });
});
router.put('/social', multer().fields([]), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      foundUser.social[req.body.network] = req.body.value;
      foundUser.save();
      res.status(200).send('Done');
    }
  });
});
router.put('/social_all', multer().fields([]), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      for(let key of Object.keys(req.body)){
        if(req.body[key] != ''){
          if(foundUser.social[key] != req.body[key]){
            foundUser.social[key] = req.body[key];
          }
        }
      }
      foundUser.save();
      res.status(200).send('done');
    }
  });
});
router.delete('/style', multer().fields([]), (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      let styleIndex = foundUser.style.indexOf(req.body.tag),
          userUpdate = {
            objectID: req.user._id,
            tags: foundUser.style
          };
      
      foundUser.style.splice(styleIndex, 1);
      foundUser.save();
      userIndex.partialUpdateObject(userUpdate, (err, response)=>{
        if(err){
          error(req, res, err);
        }
      });
      res.status(200).send('Done.');
    }
  });
});
router.put('/style', multer().fields([]), (req, res)=>{
  User.findById(req.user._id, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else {
      let styleArray = foundUser.style.unshift(req.body.style),
          userUpdate = {
            objectID: req.user._id,
            tags:styleArray
          };
      foundUser.style = styleArray;
      foundUser.save();
      userIndex.partialUpdateObject(userUpdate, (err, response)=>{
        if(err){ 
          error(req, res, err);
        }
      });
      res.status(200).send('Stylin\'');
    }
  });
});
router.put('/transaction/:id/accept', (req, res)=>{
  Transaction.findOne({_id:req.params.id})
  .exec((err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else if(foundTrans.artist.id != req.user._id.toString() || foundTrans.dates.declined) {
      error(req, res, 'This isn\'t yours.');
    } else {
      Commission.findOne({_id:foundTrans.type.id})
      .exec((err, foundComm)=>{
        if(err){
          error(req, res, err);
        } else {
          User.findOne({_id:foundTrans.client.id})
          .exec((err, foundClient)=>{
            if(err){
              error(req, res, err);
            } else {
              Notification.create({from:req.user._id, date:Date.now(), text:`${foundTrans.artist.username} accepted your request.`, transaction:foundTrans._id, type:'accept', url:`/transation/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let transUpdate = {objectID:foundTrans._id, status:'accept', activity: Date.parse(Date.now())};
                  if(foundComm.available && foundComm.available >= 1){
                    foundComm.available = foundComm.available - 1;
                    foundComm.save();
                  }
                  analytic(req, res, foundTrans.artist.id, null, 'accepted', 1);
                  foundClient.notifications.unshift(newNote);
                  foundTrans.status = 'accept';
                  foundTrans.dates.accept = Date.now();
                  foundClient.save();
                  foundTrans.save();
                  transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                  res.status(200).send('Accepted');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.post('/transaction/:id/comment', multer().fields([]), (req, res)=>{
  Transaction.findOne({_id:req.params.id})
  .exec((err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else {
      let recipient;
      if(foundTrans.artist.id == req.user._id.toString()){
        recipient = foundTrans.client.id;
      } else if(foundTrans.client.id == req.user._id.toString()){
        recipient = foundTrans.artist.id;
      } else {
        error(req, res, 'This isn\'t yours to comment on.');
      }
      User.findOne({_id:recipient})
      .exec((err, foundRecip)=>{
        if(err){
          error(req, res, err);
        } else {
          Comment.create({from:req.user._id, date:Date.now(), content:req.body.content}, (err, newComment)=>{
            if(err){
              error(req, res, err);
            } else {
              Notification.create({from:req.user._id, date:Date.now(), transaction:foundTrans._id, comment:newComment._id, text:`${req.user.username} commented on this transaction.`, type:'transComment', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err);
                } else {
                  foundRecip.notifications.unshift(newNote._id);
                  foundTrans.comments.push(newComment._id);
                  foundRecip.save();
                  foundTrans.save();
                  res.status(200).send('done');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.put('/transaction/:id/decline', (req, res)=>{
  User.findById(req.user._id, (err, foundArtist)=>{
    if(err){
      res.status(404).send('You weren\'t found.');
    } else {
      Transaction.findById(req.params.id, (err, foundTrans)=>{
        if(err){
          error(req, res, err);
        } else if(foundArtist._id.toString() != foundTrans.artist.id || foundTrans.status == 'declined'){
              error(req, res, 'You can\'t decline that.');
        } else {
          User.findById(foundTrans.client, (err, foundClient)=>{
            if(err){
              error(req, res, err);
            } else {
              Notification.create({from:foundArtist,date,text:`${foundArtist.username} declined your request.`, transaction:foundTrans, type:'decline', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let transUpdate = {
                    objectID: foundTrans._id,
                    status: 'declined',
                    activity: Date.parse(date)
                  };
                  analytic(req, res, foundArtist._id.toString(), null, 'declined', 1);
                  foundClient.notifications.unshift(newNote);
                  foundTrans.status = 'declined';
                  foundTrans.dates.declined = date;
                  foundClient.save();
                  foundTrans.save();
                  transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                  res.status(200).send('Done!');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.put('/transaction/:id/final', multer().array('files'), (req, res)=>{
  Transaction.findOne({_id:req.params.id})
  .exec((err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else if(foundTrans.artist.id != req.user._id.toString()){
      error(req, res, 'This isn\'t yours.');
    } else {
      alterImages(req.files, req.body.watermark, req.body.downscale, req.user.username)
      .then((files)=>{
        return uploadFiles(files, 'final', 'finals');
      })
      .then((files)=>{
        User.findOne({_id:foundTrans.client.id})
        .exec((err, foundClient)=>{
          if(err){
            error(req, res, err);
          } else {
            Commission.findOne({_id:foundTrans.type.id})
            .exec((err, foundComm)=>{
              if(err){
                error(req, res, err);
              } else {
                if(foundTrans.final){
                  Gallery.findOne({_id:foundTrans.final})
                  .exec((err, foundGal)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      for(let file of files){
                        foundGal.image.push(file);
                        foundGal.save();
                        if(files.indexOf(file) == files.length - 1){
                          res.status(200).send('Done');
                        }
                      }
                    }
                  });
                }
                else {
                  Gallery.create({artist:req.user._id, created:Date.now(), NSFW:foundComm.NSFW, image:files}, (err, newGal)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      Notification.create({from:req.user._id, date:Date.now(), text:`${req.user.username} uploaded your completed commission.`, transaction:foundTrans, gallery:newGal, type:'final', url:`/transaction/${foundTrans._id}`}, (err, newNote)=>{
                        if(err){
                          error(req, res, err);
                        } else {
                          let artObject = {objectID:newGal._id, commissioned:true, type:foundComm.type, url:`/gallery/${req.user.username}/${newGal._id}`, artist:req.user.username, NSFW: foundComm.NSFW, preview:files[0].url},
                              transUpdate = {objectID:foundTrans._id, status:'final', activity: Date.parse(Date.now())};
                          analytic(req, res, req.user._id.toString(), null, 'finalized', 1);
                          foundClient.notifications.unshift(newNote);
                          User.findOne({_id:req.user._id}).exec((err, foundArtist)=>{if(err){error(req, res, err)}else{foundArtist.gallery.commissioned.unshift(newGal);foundArtist.save();}});
                          foundTrans.dates.activity = Date.now();
                          foundTrans.dates.final = Date.now();
                          foundTrans.final = newGal._id;
                          foundClient.save();
                          foundTrans.save();
                          artIndex.addObject(artObject, (err, response)=>{
                            if(err){
                              error(req, res, err);
                            }
                          });
                          transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                            if(err){
                              error(req, res, err);
                            } else {
                              res.status(200).send('Done');
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
      })
      .catch((err)=>{
        error(req, res, err);
      });
    }
  });
});
router.put('/transaction/:id/message', multer().fields([]), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundCommenter)=>{
    if(err){
      error(req, res, err);
    } else if(foundCommenter == null){
      error(req, res, {message:'We couldn\'t find you.'});
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err);
        } else if(foundTrans == null){
          error(req, res, {message:'Transaction not found.'});
        } else {
          let recipient;
          if(foundTrans.client.id == foundCommenter._id.toString()){
            recipient = foundTrans.artist.id;
          } else if(foundTrans.artist.id == foundCommenter._id.toString()){
            recipient = foundTrans.client;
          } else {
            error(req, res, 'Sorry. Public comment isn\'t allowed on transactions.');
          }
          User.findOne({_id:recipient}, (err, foundRecipient)=>{
            if(err){
              error(req, res, err);
            } else if(foundRecipient == null){
              error(req, res, 'Recipient not found.');
            } else {
              let messageObj = {
                content: req.body.message,
                date,
                from: foundCommenter,
              };
              Comment.create(messageObj, (err, newMessage)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let noteObj = {
                    date,
                    from: foundCommenter,
                    transaction: foundTrans,
                    text:`${foundCommenter.username} messaged you about your commission.`,
                    type: 'transComment',
                    url: `/transaction/${foundTrans._id}#${newMessage._id}`
                  };
                  Notification.create(noteObj, (err, newNote)=>{
                    if(err){
                      error(req, res, err);
                    } else {
                      foundRecipient.notifications.unshift(newNote);
                      foundTrans.comments.push(newMessage);
                      foundRecipient.save();
                      foundTrans.save();
                      res.status(200).send('Done');
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
router.put('/transaction/:id/preview', multer().array('files'), (req, res)=>{
  uploadFiles(req.files,'prev','previews')
  .then((files)=>{
    Transaction.findOne({_id:req.params.id})
    .exec((err, foundTrans)=>{
      if(err){
        error(req, res, err);
      } else if(foundTrans.artist.id != req.user._id){
        for(let file of files){
          blobClient.deleteBlobIfExists('previews', file.id, (err, response)=>{
            if(err){
              error(req, res, err);
            }
          });
        }
        error(req, res, 'Please don\'t upload things to other people\'s projects.');
      } else {
        User.findOne({_id:foundTrans.client.id})
        .exec((err, foundClient)=>{
          if(err){
            error(req, res, err);
          } else {
            Notification.create({from:req.user._id, date:Date.now(), text:`${req.user.username} uploaded a preview of your commission.`, transaction: foundTrans._id, type:'preview', url:`/transaction/${foundTrans._id}`},(err, newNote)=>{
              if(err){
                error(req, res, err);
              } else {
                let transUpdate = {objectId:foundTrans._id, status:'preview', activity:Date.parse(Date.now())};
                
                transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
                for(let file of files){
                  foundTrans.preview.push(file);
                }
                foundTrans.dates.activity = Date.now();
                foundTrans.dates.preview = Date.now();
                foundTrans.status = 'preview',
                foundTrans.save();
                foundClient.save();
                res.status(200).send('done');
              }
            });
          }
        });
      }
    });
  });
});
router.put('/transaction/:id/preview_accept', (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundClient)=>{
    if(err){
      error(req, res, err);
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err);
        } else if(foundTrans.client.id != foundClient._id.toString()){
          error(req, res, {message:'That is not yours to accept.'});
        } else {
          User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
            if(err){
              error(req, res, err);
            } else {
              let new_note_obj = {
                date,
                from: foundClient,
                text: `${foundClient.username} accepted the preview of your commission.`,
                transaction: foundTrans,
                type: 'previewAccept',
                url: `/transaction/${foundTrans._id}`
              };
              Notification.create(new_note_obj, (err, newNote)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let transUpdate = {
                    objectID: foundTrans._id,
                    status: 'previewAccept',
                    activity: Date.parse(date)
                  };
                  foundArtist.notifications.unshift(newNote);
                  foundTrans.status = 'previewAccept';
                  foundTrans.dates.previewAccept = date;
                  foundArtist.save();
                  foundTrans.save();
                  transIndex.partialUpdateObject(transUpdate, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                  res.status(200).send('Done!');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.put('/transaction/:id/references', multer().array('files'), (req, res)=>{
  uploadFiles(req.files, 'ref', 'references')
  .then((files)=>{
    Transaction.findOne({_id:req.params.id})
    .exec((err, foundTrans)=>{
      if(err){
        res.status(400).send(err);
      } else {
        foundTrans.reference = foundTrans.reference.concat(files);
        foundTrans.save();
        res.status(200).json(files);
      }
    });
  });
});
router.put('/transaction/:id/review', multer().fields([]), (req, res)=>{
  User.findOne({_id:req.user._id}, (err, foundClient)=>{
    if(err){
      error(req, res, err);
    } else if(foundClient == null) {
      error(req, res, {message:'We couldn\'t find you.'});
    } else {
      Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
        if(err){
          error(req, res, err);
        } else if(foundTrans.client.id != foundClient._id.toString()){
          error(req, res, {message:'Please don\'t review someone else\'s project unless you\'re paying for it.'});          
        } else {
          User.findOne({_id:foundTrans.artist.id}, (err, foundArtist)=>{
            if(err){
              error(req, res, err);
            } else if(foundArtist == null) {
              error(req, res, {message:'You artist has gone missing.'});
            } else {
              let noteObj = {
                date,
                from: foundClient._id,
                transaction: foundTrans._id,
                type: 'review',
                text: `${foundClient.username} reviewed your commission!`,
                url: `/transaction/${foundTrans._id}`
              };
              Notification.create(noteObj, (err, newNote)=>{
                if(err){
                  error(req, res, err);
                } else {
                  let userUpdate = {
                    objectID: foundArtist._id
                  },
                  rateTotal = 0,
                  searchRating,
                  transUpdate = {
                    objectID: foundTrans._id,
                    status: 'closed',
                    activity: Date.parse(date)
                  };
                  for(let rate of foundArtist.rating){
                    rateTotal += Number(rate);
                  }
                  searchRating = rateTotal / (foundArtist.rating.length + 1);
                  foundTrans.rating = req.body.rating;
                  foundTrans.review = req.body.review;
                  foundTrans.dates.review = date;
                  foundTrans.dates.activity = date;
                  foundTrans.status = 'closed';
                  foundArtist.notifications.unshift(newNote);
                  foundArtist.completed.unshift(foundTrans);
                  foundArtist.rating.push(req.body.rating);
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
                  res.status(200).send('Done');
                }
              });
            }
          });
        }
      });
    }
  });
});
router.put('/transaction/:id/dispute', multer().fields([]), (req, res)=>{
  Transaction.findOne({_id:req.params.id}, (err, foundTrans)=>{
    if(err){
      error(req, res, err);
    } else if(foundTrans == null){
      error(req, res, {message:'That\'s not a transaction to dispute.'});
    } else if(foundTrans.artist.id != req.user._id.toString() && foundTrans.client.id != req.user._id.toString()){
      error(req, res, {message:'That\'s not yours to dispute.'});
    } else {
      Dispute.create({dates:{received:date}, report:req.body.report, transaction:foundTrans._id}, (err, newDispute)=>{
        if(err){
          error(req, res, err);
        } else {
          foundTrans.disputed = true;
          foundTrans.save();
          res.status(200).send('Done.');
        }
      });
    }
  });
});
router.put('/username', multer().fields([]), (req, res)=>{
  User.findOne({username:req.body.username}, (err, foundUser)=>{
    if(err){
      error(req, res, err);
    } else if(foundUser != null||reserved.includes(req.body.username)){
      res.status(400).send("Taken");
    } else {
      res.status(200).send("Free");
    }
  });
});
router.post('/:username/commission/:id/report', (req, res)=>{
  User.findOne({username:req.params.username}, (err, foundArtist)=>{
    if(err){
      error(req, res, err);
    } else if(foundArtist == null){ 
      error(req, res, 'We can\'t find that artist.');
    } else {
      User.findOne({_id:req.user._id}, (err, foundReporter)=>{
        if(err){
          error(req, res, err);
        } else if(foundReporter == null){
          error(req, res, 'You were not found.');
        } else {
          Commission.findOne({_id:req.params.id}, (err, foundCommission)=>{
            if(err){
              error(req, res, err);
            } else if(foundCommission == null){
              error(req, res, 'No commission found.');
            } else {
              let report = {
                dates: {sent: date},
                reason: req.body.reason,
                reporter: foundReporter._id,
                artist: foundArtist._id,
                commission: foundCommission._id,
                status: 'Received'
              };
              Report.create(report, (err, newReport)=>{
                if(err){
                  error(req, res, err);
                } else {
                  res.status(200).send('Received');
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

function accountChange (req, res, emailAddress, username){
  let email = {
    'Messages':[{
      'From':{
        'Email':'team@splatr.art',
        'Name':'The Splatr Team'
      },
      'To':[
        {
          'Email': emailAddress,
          'Name': username
        }
      ],
      'Subject': 'Your Account Was Updated.',
      'TextPart': 'Someone updated your account. We really hope it was you. If not, contact our team right away.',
      'HTMLPart': `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Welcome to Splatr. We\'re glad you\'re here!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a {font-family: "Roboto", sans-serif;text-decoration:none}small{font-size:8pt; text-align:center;margin-top:15px}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="50px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td></tr><tr><td><table width="100%"  bgcolor="#eee" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Your Account Was Updated!</h1><p>We really hope that was you. If it wasn't you need to contact us at <a href="mailto:team@splatr.art">team@splatr.art</a></p></td></tr></table></td></tr><tr><td><table width="100%" cellpadding="10px" align="center"><tr><td style="text-align:center"><address><small>Copyright &#9400; 2018 Splatr, LLC.<br>511 Congress Street, Suite 700 | PO Box 9711 | Portland, Maine 04104-5011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
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
    res.status(401).send('You\'re not allowed in here.');
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
        res.status(400).send(err.message);
      } else {
        res.status(400).send(err);
      }
    }
  });
}
function verifyEmail(email, crypto){
  let emailObj = {
    'Messages':[{
    'From':{
      'Email':'team@splatr.art',
      'Name':'The Splatr Team'
    },
    'To':[{
      'Email':email
    }],
    'Subject': 'Welcome to Splatr!',
    'TextPart': 'Welcome! We\'re glad you\'re with us. We just need you to verify your email. Please click the button below and you\'ll be all set!',
    'HTMLPart': `<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><link href="https://fonts.googleapis.com/css?family=Open+Sans:700|Roboto" rel="stylesheet"><title>Welcome to Splatr. We\'re glad you\'re here!</title><style type="text/css">h1, h3, h4 {font-family: "Open Sans", sans-serif;}p, a {font-family: "Roboto", sans-serif;text-decoration:none}small{font-size:8pt; text-align:center;margin-top:15px}</style></head><body style="margin: 0; padding: 0;"><table width="100%" cellpadding="50px" cellspacing="0" align="center" bgcolor="#bbb"><tr><td><table width="600px" cellpadding="50px" cellspacing="0" bgcolor="#fff" align="center"><tr><td><table width="100%" align="center"><tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" style="padding-bottom: 25px"><tr><td><a href="https://splatr.art"><img src="https://ayizan.blob.core.windows.net/ayizanlogos/Logos/Splatr_purple.png" height="50px" alt="Splatr Logo"></a></td><td align="right"><a href="https://splatr.art/email/${crypto}" style="color:#aaa; font-size:10pt">View in browser.</a></td></tr></table></td></tr><tr><td><table width="100%"  bgcolor="#eee" cellpadding="15px" cellspacing="0" align="center"><tr><td><h1>Welcome!</h1><h1>We\'re glad you\'re with us.</h1><p>We just need you to verify your email.</p><p> Please click the button below and you\'ll be all set!</p></td></tr><tr><td><a href="https://splatr.art/verify/${crypto}" style="margin-top:125px; border-width: 2px;font-weight: 400;font-size: 0.8571em;line-height: 1.35em;margin: 10px 1px;border: none;border-radius: 0.1875rem;padding: 11px 22px;cursor: pointer;background-color: #7402c6;color: #FFFFFF; text-decoration:none">Verify Email</a></td></tr><tr><td><h3 style="color:#7402c6">From the team:</h3><h3 style="margin:0">Nate & Rachel </h3></td></tr><tr><td><table width="100%" cellpadding="10px" align="center"><tr><td style="text-align:center"><address><small>Copyright &#9400; 2019 Splatr, LLC.<br>1001 River Road | Brunswick, Maine 04011</small></address></td></tr></table></td></tr></table></td></tr></table></td></tr></table></body></html>`
    }]
  };
  mailjet
  .post('send', {'version':'v3.1'})
  .request(emailObj)
  .then((result)=>{
    console.log('Done');
  })
  .catch((err)=>{
    console.log(err.Status);
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
          Commission.findById(req.params.comm, (err, foundComm)=>{
            if(err){
              error(req, res, err);
            } else if(foundComm.available && foundComm.available <= 0){
              error(req, res, 'There are no more of that commission available');
            }  else {
              Transaction.create({artist:{id:foundArtist._id, username:foundArtist.username, profile:foundArtist.profile.url}, client:{id:foundClient._id, username:foundClient.username, profile:foundClient.profile.url}, dates:{request:date, activity:date}, status, type:{example:foundComm.example.url, id:foundComm._id, mediaType:foundComm.example.mediaType, name:foundComm.name, price:foundComm.price}, request, viewable_by:[foundArtist._id.toString(), foundClient._id.toString()]}, (err, newTrans)=>{
                if(err){
                  error(req, res, err);
                } else {
                  Notification.create({from:foundClient, date, text:`${foundClient.username} requested "${foundComm.name}."`, type:'request', url:`/transaction/${newTrans._id}`}, (err, newNote)=>{
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
                      newNote.transaction = newTrans;
                      newNote.url = `/transaction/${newTrans._id}`;
                      newNote.save();
                      foundArtist.notifications.unshift(newNote);
                      foundArtist.transactions.unshift(newTrans);
                      foundClient.transactions.unshift(newTrans);
                      foundArtist.save();
                      foundClient.save();
                      res.status(200).send('We made it!');
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
function alterImages(files, watermark, downscale, username){
  let images = [];
  
  return new Promise((resolve)=>{
    for(let file of files){
      if(file.mimetype.split('/')[0] == 'image'){
        if(watermark == 'true' && downscale == 'true'){
          jimp.read(file.buffer)
          .then((image)=>{
            jimp
            .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark.png')
            .then((watermark)=>{
              image.scale(.25);
              return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
            })
            .then((img_marked)=>{
              jimp.loadFont(jimp.FONT_SANS_16_WHITE)
              .then(font=>([img_marked,font]))
              .then((img_data)=>{
                let img_marked = img_data[0],
                    font = img_data[1],
                    text = `© ${Date.now().getFullYear()} ${username}`,
                    textData = {
                      maxWidth: img_marked.bitmap.width - 50,
                      maxHeight: 92,
                      placementX: 10,
                      placementY: img_marked.bitmap.height - 82
                    };
                return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
              })
              .then((final)=>{
                final.getBufferAsync(jimp.MIME_JPEG)
                .then((buffer)=>{
                  file.public = {buffer,size:buffer.byteLength};
                  images.push(file);
                  if(files.indexOf(file) == files.length - 1){
                    resolve(images);
                  }
                });
              });
            });
          });
        } else if(watermark == 'true'){
          jimp.read(file.buffer)
          .then((image)=>{
            if(image.bitmap.width > 1200){
              jimp
              .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark_lg.png')
              .then((watermark)=>{
                return new Promise((resolve)=>{
                  resolve(image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]));
                });
              });
            } else {
              jimp
              .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark.png')
              .then((watermark)=>{
                return new Promise((resolve)=>{
                  resolve(image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]));
                });
              });
            }
          })
          .then((img_marked)=>{
            jimp.loadFont(jimp.FONT_SANS_16_WHITE)
            .then(font=>([img_marked,font]))
            .then((img_data)=>{
              let img_marked = img_data[0],
                  font = img_data[1],
                  text = `© ${Date.now().getFullYear()} ${username}`,
                  textData = {
                    maxWidth: img_marked.bitmap.width - 50,
                    maxHeight: 92,
                    placementX: 10,
                    placementY: img_marked.bitmap.height - 82
                  };
              return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
            })
            .then((final)=>{
              final.getBufferAsync(jimp.MIME_JPEG)
              .then((buffer)=>{
                file.public = {buffer,size:buffer.byteLength};
                images.push(file);
                if(files.indexOf(file) == files.length - 1){
                  resolve(images);
                }
              });
            });
          });
        } else if(downscale == 'true'){
          jimp.read(file.buffer)
          .then((image)=>{
            image.scale(.25);
            image.getBufferAsync(jimp.MIME_JPEG)
            .then((buffer)=>{
              let newFile = file;
              newFile.public = {buffer,size:buffer.byteLength};
              images.push(newFile);
              if(files.indexOf(file) == files.length - 1){
                resolve(images);
              }
            });
          });
        } else {
          images.push(file);
          if(files.indexOf(file) == files.length - 1){
            resolve(images);
          }
        }
      } else {
        images.push(file);
        if(files.indexOf(file) == files.length - 1){
          resolve(images);
        }
      }
    }
  });
}
function uploadImgs(req, res, container){
  let images = [];
  if(req.files.length > 0){
    for(let i=0; i < req.files.length; i++){
      let type = req.files[i].mimetype.substring(6),
          stream = streamifier.createReadStream(req.files[i].buffer),
          id_crypto = crypto(24),
          id = `gallery_${id_crypto}.${type}`,
          url = `${azureEndpoint}${container}/${id}`,
          options = {
            contentSettings: {
              contentType: req.files[i].mimetype
            },
            metadata: {fileName: id}
          };
      if(req.body.downscale == 'true' && req.body.watermark == 'true'){
        jimp
        .read(req.files[i].buffer)
        .then((image)=>{
          jimp
          .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark.png')
          .then((watermark)=>{
            image.scale(.25);
            return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
          })
          .then((img_marked)=>{
            jimp.loadFont(jimp.FONT_SANS_16_WHITE)
            .then(font=>([img_marked, font]))
            .then((img_data)=>{
              let img_marked = img_data[0],
                  font = img_data[1],
                  text = `© ${date.getFullYear()} ${req.user.username}`,
                  textData = {
                    maxWidth: img_marked.bitmap.width - 50,
                    maxHeight: 92,
                    placementX: 10,
                    placementY: img_marked.bitmap.height - 82
                  };
              return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
            })
            .then((final)=>{
              final.getBufferAsync(jimp.MIME_JPEG)
              .then((buffer) => {
                let public_stream = streamifier.createReadStream(buffer),
                    public_size = buffer.byteLength,
                    public_options = {
                      metadata: {fileName:id}
                    };
                blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
                  if(err){
                    error(req, res, err);
                  }
                });
              })
              .catch(err => error(req, res, err));
            })
            .catch(err => error(req, res, err));
          });
        })
        .catch(err => error(req, res, err));
      } else if (req.body.downscale == 'true') {
        jimp
        .read(req.files[i].buffer)
        .then((image)=>{
          image.scale(.25);
          image.getBufferAsync(jimp.MIME_JPEG)
          .then((buffer)=>{
            let public_stream = streamifier.createReadStream(buffer),
                public_size = buffer.byteLength,
                public_options = {
                  metadata: {fileName:id}
                };
            blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
              if(err){
                error(req, res, err);
              }
            });
          })
          .catch(err => error(req, res, err));
        })
        .catch(err => error(req, res, err));
      } else if (req.body.watermark == 'true') {  
        jimp
        .read(req.files[i].buffer)
        .then((image)=>{
          if(image.bitmap.width > 1200) {
            jimp
            .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark_lg.png')
            .then((watermark)=>{
              watermark.opacity(0.5);
              return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
            })
            .then((img_marked)=>{
              jimp.loadFont(jimp.FONT_SANS_64_WHITE)
              .then(font=>([img_marked, font]))
              .then((img_data)=>{
                let img_marked = img_data[0],
                    font = img_data[1],
                    text = `© ${date.getFullYear()} ${req.user.username}`,
                    textData = {
                      maxWidth: img_marked.bitmap.width - 50,
                      maxHeight: 92,
                      placementX: 10,
                      placementY: img_marked.bitmap.height - 152
                    };
                return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
              })
              .then((final)=>{
                final.getBufferAsync(jimp.MIME_JPEG)
                .then((buffer) => {
                  let public_stream = streamifier.createReadStream(buffer),
                      public_size = buffer.byteLength,
                      public_options = {
                        metadata: {fileName:id}
                      };
                  blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                })
                .catch(err => error(req, res, err));
              })
              .catch(err => error(req, res, err));
            });
          } else {
            jimp
            .read('https://ayizan.blob.core.windows.net/site-images/splatr_watermark.png')
            .then((watermark)=>{
              return image.composite(watermark, (image.bitmap.width/2) - (watermark.bitmap.width/2), (image.bitmap.height/2) - (watermark.bitmap.height/2), [jimp.BLEND_DESTINATION_OVER]);
            })
            .then((img_marked)=>{
              jimp.loadFont(jimp.FONT_SANS_16_WHITE)
              .then(font=>([img_marked, font]))
              .then((img_data)=>{
                let img_marked = img_data[0],
                    font = img_data[1],
                    text = `© ${date.getFullYear()} ${req.user.username}`,
                    textData = {
                      maxWidth: img_marked.bitmap.width - 50,
                      maxHeight: 92,
                      placementX: 10,
                      placementY: img_marked.bitmap.height - 82
                    };
                return img_marked.print(font, textData.placementX, textData.placementY, {text,alignmentX: jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: jimp.VERTICAL_ALIGN_MIDDLE}, textData.maxWidth, textData.maxHeight);
              })
              .then((final)=>{
                final.getBufferAsync(jimp.MIME_JPEG)
                .then((buffer) => {
                  let public_stream = streamifier.createReadStream(buffer),
                      public_size = buffer.byteLength,
                      public_options = {
                        metadata: {fileName:id}
                      };
                  blobClient.createBlockBlobFromStream(container, id, public_stream, public_size, public_options, (err, response)=>{
                    if(err){
                      error(req, res, err);
                    }
                  });
                })
                .catch(err => error(req, res, err));
              })
              .catch(err => error(req, res, err));
            });
          }
        })
        .catch(err => error(req, res, err));
      } else {   
        blobClient.createBlockBlobFromStream(container, id, stream, req.files[i].size, options, (err, response)=>{
          if(err != null){
            error(req, res, err);
          }
        });
      }
      images.push({id,url});
      if(i == req.files.length - 1){
        return new Promise((resolve, reject)=>{
          resolve(images);
        });
      }
    }
  } else {
    return new Promise((resolve, reject)=>{
        resolve(images);
    });
  }
}
function uploadFiles(files, prefix, container){
  let images = [];
  return new Promise((resolve, reject)=>{
    for(let file of files){
      let stream = streamifier.createReadStream(file.buffer),
          id = `${prefix}_${crypto(24)}.${file.originalname.split('.').pop()}`,
          url = `${azureEndpoint}${container}/${id}`,
          options = {contentSettings:{contentType:file.mimetype}, metadata:{fileName:id}};
      
      blobClient.createBlockBlobFromStream(container, id, stream, file.size, options, (err)=>{
        if(err != null){
          reject(err);
        } else {
          let image = {id, url, mediaType:file.mimetype.split('/')[0], originalName:file.originalname},
              imagePush = ()=>{
                if(file.public){
                  let pubStream = streamifier.createReadStream(file.public.buffer);
                  blobClient.createBlockBlobFromStream(container, `public-${id}`, pubStream, file.public.size, {metadata:{fileName:`public-${id}`}}, (err)=>{
                    if(err){
                      reject(err);
                    } else {
                      image.public = `public-${id}`;
                    }
                  });
                }
                return new Promise((resolve)=>{
                  images.push(image);
                  resolve();
                });
              };
          
          imagePush()
          .then(()=>{
            if(files.indexOf(file) == files.length - 1){
              resolve(images);
            }
          });
        }
      });    
    }
  });
}