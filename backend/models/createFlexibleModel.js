const mongoose = require("mongoose");

module.exports = function createFlexibleModel(name, fields = {}, collectionName) {
  const schema = new mongoose.Schema(
    {
      id: {
        type: String,
        index: true,
        trim: true,
      },
      ...fields,
    },
    {
      strict: false,
      timestamps: true,
    }
  );

  return mongoose.models[name] || mongoose.model(name, schema, collectionName);
};
