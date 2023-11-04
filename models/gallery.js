const mongoose  = require('mongoose');

const GallerySchema = new mongoose.Schema({
  alt_text: String,
  analytics: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Year'
  }],
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  commissioned: {type: Boolean, default: true},
  created: Date,
  description: String,
  image: [{
    id: String,
    mediaType: String,
    originalName: String,
    public_url: String,
    url: String
  }],
  likes: [],
  linked_title: String,
  NSFW: {type: Boolean, default: true},
  paid: {type: Boolean, default: false},
  tags: [],
  title: String,
  type: String,
  views: {type:Number, default:0}
});

module.exports  = mongoose.model('Gallery', GallerySchema);