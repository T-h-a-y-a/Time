const IDLE_LIMIT_MS = 60 * 1000; // 60 seconds

function updateWorkTimeForActivity(user) {
  const now = new Date();

  if (!user.lastActivityAt) {
    user.lastActivityAt = now;
    user.timerRunning = true;
    return;
  }

  const diffMs = now - user.lastActivityAt;

  if (diffMs < IDLE_LIMIT_MS) {
    user.workTimeSeconds += Math.floor(diffMs / 1000);
  }

  user.lastActivityAt = now;
  user.timerRunning = true;
}

function finalizeWorkTimeOnLogout(user) {
  const now = new Date();

  if (user.timerRunning && user.lastActivityAt) {
    const diffMs = now - user.lastActivityAt;

    if (diffMs < IDLE_LIMIT_MS) {
      user.workTimeSeconds += Math.floor(diffMs / 1000);
    }
  }

  user.timerRunning = false;
  user.lastActivityAt = null;
}

module.exports = {
  updateWorkTimeForActivity,
  finalizeWorkTimeOnLogout,
  IDLE_LIMIT_MS,
};
