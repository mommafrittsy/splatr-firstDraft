const mongoose = require('mongoose'),

FeedbackSchema = new mongoose.Schema({
  date: Date,
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  location: String,
  text: String,
  type: String
});

module.exports = mongoose.model('Feedback', FeedbackSchema);