const mongoose = require('mongoose');

const YearSchema = new mongoose.Schema({
  gallery: String,
  months: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Month'
  }],
  user: String,
  year: Number
});

module.exports = mongoose.model('Year', YearSchema);