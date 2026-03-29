const createFlexibleModel = require("./createFlexibleModel");

module.exports = createFlexibleModel(
  "User",
  {
    email: {
      type: String,
      index: true,
      lowercase: true,
      trim: true,
    },
    full_name: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      default: "student",
      trim: true,
    },
    avatar_url: {
      type: String,
      default: "",
      trim: true,
    },
  },
  "users"
);
