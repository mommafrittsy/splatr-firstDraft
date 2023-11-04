const mongoose = require('mongoose'),

  DisputeSchema = new mongoose.Schema({
    dates: {
      received: Date,
      resolved: Date
    },
    report: String,
    resolution: {
      decision: String,
      favor: String,
      prejudice: Boolean,
      report: String,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  });
      
module.exports = mongoose.model('Dispute', DisputeSchema);