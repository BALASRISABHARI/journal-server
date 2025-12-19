require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
})
.then(() => console.log("MongoDB Atlas Connected 🚀"))
.catch((err) => console.log("MongoDB Error ❌:", err));
mongoose.connection.once("open", () => {
  console.log("CONNECTED TO:", mongoose.connection.name);
});


// Default Route
app.get("/", (req, res) => {
  res.send("Journal App API Running");
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/journals", require("./routes/journal"));

// Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
