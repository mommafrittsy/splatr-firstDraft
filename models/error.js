const mongoose  =   require('mongoose');

const ErrorSchema  =   new mongoose.Schema({
  date: Number,
  error: Object,
  message: String,
  resolved: {type: Boolean, default: false},
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }
});

module.exports  =   mongoose.model('Error', ErrorSchema);