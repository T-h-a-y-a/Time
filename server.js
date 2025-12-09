const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const timeRoutes = require("./routes/timeRoutes");

const app = express();

// ======= MONGODB CONNECTION =======
mongoose
  .connect("mongodb+srv://Thaya:123456@@cluster0.2i5t5pd.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// ======= MIDDLEWARE =======
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: "super-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
  })
);

// Static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api", authRoutes);
app.use("/api", timeRoutes);

// Fallback to index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
