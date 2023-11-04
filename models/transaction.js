const mongoose  =   require('mongoose');

const TransSchema   =   new mongoose.Schema({
  artist: {
    username: String,
    id: String,
    profile: String
  },
  client: {
    username: String,
    id: String,
    profile: String
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  dates: {
    accept: Date,
    activity: Date,
    declined: Date,
    deposit: Date,
    final: Date,
    paid: Date,
    previewAccept: Date,
    preview: Date,
    request: Date,
    review: Date
  },
  deposit: {
    id: String,
    card: {
      brand: String,
      last4: String,
    },
    amount: Number,
    date: Number
  },
  disputed: {type:Boolean, default: false},
  final: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gallery'
  },
  options: [],
  payment:{
    amount: Number,
    card: {
      brand: String,
      last4: String
    },
    date: Number,
    id: String
  },
  preview: [{
    id: String,
    mediaType: String,
    url: String
  }],
  rating: Number,
  request: String,
  reference: [{
    id: String,
    mediaType: String,
    url: String
  }],
  review: String,
  status: String,
  type: {
    example: String,
    id: String,
    mediaType: String,
    name: String,
    price: Number
  },
  viewable_by:[]
});

module.exports  =   mongoose.model('Transaction', TransSchema);