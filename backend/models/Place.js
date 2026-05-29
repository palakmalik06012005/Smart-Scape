const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const placeSchema = new mongoose.Schema(
  {
    placeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    map: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    timing: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
    crowd: {
      type: String,
      enum: ["high", "moderate", "low", ""],
      default: "",
    },
    ambience: {
      type: String,
      enum: ["cozy", "calm", ""],
      default: "",
    },
    budget: {
      type: String,
      enum: ["low", "medium", "high", ""],
      default: "",
    },
    occasion: {
      type: String,
      default: "",
      trim: true,
    },
    menu: {
      type: [String],
      default: [],
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret.placeId;
        delete ret._id;
        delete ret.placeId;
        return ret;
      },
    },
  }
);

placeSchema.index({ category: 1, crowd: 1, ambience: 1, budget: 1 });

module.exports = mongoose.model("Place", placeSchema);
