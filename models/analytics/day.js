const mongoose = require('mongoose');

const DaySchema = new mongoose.Schema({
  accepted: {type:Number, default: 0},
  completed_payments: {type:Number, default: 0},
  date: {
    month: String,
    day: Number,
    year: Number,
    string: String
  },
  date_id: Date,
  declined: {type:Number, default: 0},
  deposits: {type:Number, default: 0},
  fans: {type:Number, default: 0},
  finalized: {type:Number, default: 0},
  gallery: String,
  likes: {type:Number, default: 0},
  requests: {type:Number, default: 0},
  user: String,
  views: {type:Number, default: 0}
});

module.exports = mongoose.model('Day', DaySchema);