const mongoose = require('mongoose');

const MonthSchema = new mongoose.Schema({
  date: {
    month: String,
    year: Number
  },
  days:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Day'
  }],
  gallery: String,
  user: String
});

module.exports = mongoose.model('Month', MonthSchema);