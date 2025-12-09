const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { updateWorkTimeForActivity, finalizeWorkTimeOnLogout } = require("../utils/timeTracker");

// Simple auth guard using session
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }
  next();
}

// POST /api/login  { username, password }
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    let user = await User.findOne({ username });

    if (!user) {
      // Demo convenience: create user if not exists
      user = new User({ username, password });
      await user.save();
    } else {
      if (user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    req.session.userId = user._id.toString();

    updateWorkTimeForActivity(user);
    await user.save();

    res.json({
      ok: true,
      username: user.username,
      workTimeSeconds: user.workTimeSeconds,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/logout
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (user) {
      finalizeWorkTimeOnLogout(user);
      await user.save();
    }

    req.session.destroy(() => {
      res.json({
        ok: true,
        workTimeSeconds: user ? user.workTimeSeconds : 0,
      });
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
