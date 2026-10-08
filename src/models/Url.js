const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    shortCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    originalUrl: {
      type: String,
      required: true,
      trim: true
    },
    clicks: {
      type: Number,
      default: 0
    },
    lastAccessedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Url', urlSchema);
