const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5001;
const mongoUri = process.env.MONGO_URI;
const usingLocalItemStore = !mongoUri;

process.env.USE_LOCAL_ITEM_STORE = usingLocalItemStore ? "true" : "false";

const itemRoutes = require("./routes/items");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is working");
});

app.use("/api/items", itemRoutes);

if (usingLocalItemStore) {
  console.log(`Starting API on port ${PORT} using local item store`);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
} else {
  console.log("MONGO_URI loaded:", true);

  mongoose
    .connect(mongoUri)
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    });
}
