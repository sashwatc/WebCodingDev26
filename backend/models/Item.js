const mongoose = require("mongoose");

function createExternalId() {
  return `found_${new mongoose.Types.ObjectId().toString()}`;
}

const ratingSchema = new mongoose.Schema(
  {
    claimId: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: {
      type: String,
      default: "",
      trim: true,
    },
    claimantName: {
      type: String,
      default: "",
      trim: true,
    },
    reviewerEmail: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "pending",
      trim: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const itemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: createExternalId,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
    brand: {
      type: String,
      default: "",
      trim: true,
    },
    locationFound: {
      type: String,
      default: "",
      trim: true,
    },
    dateFound: {
      type: String,
      default: "",
      trim: true,
    },
    timeFound: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    photoUrls: {
      type: [String],
      default: [],
    },
    storageLocation: {
      type: String,
      default: "",
      trim: true,
    },
    condition: {
      type: String,
      default: "",
      trim: true,
    },
    distinguishingFeatures: {
      type: String,
      default: "",
      trim: true,
    },
    finderName: {
      type: String,
      default: "",
      trim: true,
    },
    finderEmail: {
      type: String,
      default: "",
      trim: true,
    },
    finderRole: {
      type: String,
      default: "",
      trim: true,
    },
    aiDescription: {
      type: String,
      default: "",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      default: "pending_review",
      trim: true,
    },
    itemType: {
      type: String,
      default: "found",
      trim: true,
    },
    priority: {
      type: String,
      default: "",
      trim: true,
    },
    itemCode: {
      type: String,
      default: "",
      trim: true,
    },
    assignedTo: {
      type: String,
      default: "",
      trim: true,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    linkedLostReportId: {
      type: String,
      default: "",
      trim: true,
    },
    claimConfirmed: {
      type: Boolean,
      default: false,
    },
    claimConfirmedAt: {
      type: Date,
      default: null,
    },
    ratings: {
      type: [ratingSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Item || mongoose.model("Item", itemSchema);
