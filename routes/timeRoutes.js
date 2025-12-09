const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { updateWorkTimeForActivity } = require("../utils/timeTracker");

async function loadUser(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth loadUser error:", err);
    res.status(500).json({ error: "Server error" });
  }
}

// GET /api/me/worktime
router.get("/me/worktime", loadUser, async (req, res) => {
  const user = req.user;
  res.json({
    workTimeSeconds: user.workTimeSeconds || 0,
    timerRunning: user.timerRunning,
  });
});

// POST /api/me/activity
router.post("/me/activity", loadUser, async (req, res) => {
  try {
    const user = req.user;
    updateWorkTimeForActivity(user);
    await user.save();

    res.json({
      ok: true,
      workTimeSeconds: user.workTimeSeconds,
    });
  } catch (err) {
    console.error("Activity error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
