const mongoose  = require('mongoose');

const NotificationSchema  = new  mongoose.Schema({
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  date: Date,
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fromSplatr: {type: Boolean, default: false},
  gallery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery'
  },
  new: {type: Boolean, default: true},
  popNote : {type: Boolean, default: true},
  text: String,
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  type: String,
  url: String
});

module.exports  =   mongoose.model('Notification', NotificationSchema);