const mongoose  =   require('mongoose');

const CommissionSchema  =   new mongoose.Schema({
  available: mongoose.Schema.Types.Mixed,
  artist: {
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: Date,
  description: String,
  example: {
    id: String,
    url: String,
    mediaType: String
  },
  name: String,
  NSFW: {type: Boolean, default: false},
  options: [{
    price: Number,
    description: String,
    max: Number
  }],
  price: Number,
  tags: [],
  type: String
});

module.exports  =   mongoose.model('Commission', CommissionSchema);