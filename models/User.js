const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  // For demo only – in production store a password hash instead.
  password: { type: String, required: true },

  // Time tracking
  workTimeSeconds: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: null },
  timerRunning: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", userSchema);
