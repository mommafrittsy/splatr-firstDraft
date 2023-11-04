const mongoose  = require('mongoose');

const ReportSchema  = new mongoose.Schema({
  dates:{
    sent: Date,
    response: Date
  },
  reporter: String,
  reason: String,
  gallery: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'gallery'
  },
  comment:{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'comment'
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'user'
  },
  commenter: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'user'
  },
  commission: {
    type: mongoose.Schema.Types.ObjectId,
    ref:  'commission'
  },
  valid: Boolean,
  status: String,
  other: String
});

module.exports  = mongoose.model('Report', ReportSchema);