const   mongoose    =   require('mongoose'),
        passMon     =   require('passport-local-mongoose');
        
const   UserSchema  =   new mongoose.Schema({
  address: {
    line1: String,
    line2: String,
    city: String,
    state: {
      code: String,
      name: String
    },
    country: {
      code: String,
      name: String
    },
    post: String
  },
  admin: {
    isAdmin: {type:Boolean, default: false},
    adminCode: String,
  },
  analytics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year'
  }],
  banner: {
    id: String,
    url: String
  },
  birthday: Date,
  canArt: {type:Boolean, default: false},
  commissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commission'
  }],
  completed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],
  crypto: String,
  cryptoExpire: Date,
  currency: String,
  description: String,
  email: String,
  facebookId: String,
  fans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  gallery: {
    commissioned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery'
    }], 
    non_commissioned: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery'
    }]
  },
  googleId: String,
  isArtist: {type:Boolean, default: false},
  isLive: {
    facebook: {type: Boolean, default: false},
    picarto: {type: Boolean, default: false},
    twitch: {type: Boolean, default: false},
    twitter: {type: Boolean, default: false},
    youtube: {type: Boolean, default: false}
  },
  lastLogin: Date,
  level: String,
  likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Gallery'
  }],
  motto: String,
  name: {
    given: String,
    surname: String,
    preferred: String
  },
  open: {type:Boolean, default: true},
  passwordCrypto: String,
  passwordExpire: Date,
  pid: {type:Boolean, default: false},
  preferences:{
    background: Number,
    dash_background: String,
    night: {type: Boolean, default: false},
  },
  profile: {
    id: String,
    url: String
  },
  newUser: {type:Boolean, default: true},
  marketingEmails: {type: Boolean, default: false},
  missingInfo: {type:Boolean, default: false},
  motto: String,
  notifications:  [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification'
  }],
  nsfw_filter: {type: Boolean, default: true},
  rating: Array,
  registered: Date,
  searchKey: String,
  social: {
    behance: String,
    deviantart: String,
    discord: String,
    dribbble: String,
    etsy: String,
    facebook: String,
    instagram: String,
    patreon: String,
    pinterest: String,
    soundcloud: String,
    tumblr: String,
    twitch: String,
    twitter: String,
    vimeo: String,
    youtube: String
  },
  stripe: {
    id: String,
    customerID: String,
    fields_needed: [],
    due_by: Date
  },
  style: [],
  transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction' 
    }],
  twitterId: String,
  username: String,
  verified: {
    date: Date,
    verified:{type: Boolean, default:false},
  },
  wasBeta: {type:Boolean, default:false}
});

UserSchema.plugin(passMon, {usernameLowerCase:true, selectFields:['_id','username','profile.url','nsfw_filter','admin.adminCode']});

module.exports  = mongoose.model('User', UserSchema);