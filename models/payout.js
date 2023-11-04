const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
  amount: Number,
  created: Number,
  external_account: String,
  id: String,
  payee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  viewable_by: String
});

module.exports = mongoose.model('Payout', PayoutSchema);