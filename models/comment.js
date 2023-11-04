const mongoose  = require('mongoose');

const commentSchema = new mongoose.Schema ({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  content: String,
  date: Date,
  likes: []
});

module.exports  = mongoose.model('Comment', commentSchema);