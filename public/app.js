const IDLE_LIMIT_MS = 60 * 1000;
const TICK_INTERVAL_MS = 1000;
const SYNC_INTERVAL_MS = 10 * 1000;

let workingSeconds = 0;
let lastActivityLocal = Date.now();
let activityTimerId = null;
let lastSyncTime = 0;

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginError = document.getElementById("loginError");
const usernameInput = document.getElementById("usernameInput");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loggedUserEl = document.getElementById("loggedUser");
const workTimeEl = document.getElementById("workTime");
const statusTextEl = document.getElementById("statusText");
const idleSecEl = document.getElementById("idleSec");

function formatTime(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

async function apiPost(path, body = {}) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

async function apiGet(path) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

function showLogin() {
  loginSection.classList.remove("hidden");
  dashboardSection.classList.add("hidden");
}

function showDashboard() {
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
}

function markLocalActivity() {
  lastActivityLocal = Date.now();
}

["mousemove", "keydown", "click", "scroll"].forEach((ev) => {
  document.addEventListener(ev, markLocalActivity, { passive: true });
});

async function initActivityTracking() {
  try {
    const data = await apiGet("/me/worktime");
    workingSeconds = data.workTimeSeconds || 0;
    workTimeEl.textContent = formatTime(workingSeconds);

    if (activityTimerId) clearInterval(activityTimerId);

    activityTimerId = setInterval(async () => {
      const now = Date.now();
      const idleMs = now - lastActivityLocal;
      const idleSeconds = Math.floor(idleMs / 1000);

      idleSecEl.textContent = idleSeconds;

      if (idleMs < IDLE_LIMIT_MS) {
        statusTextEl.textContent = "Active";
        workingSeconds += 1;
        workTimeEl.textContent = formatTime(workingSeconds);

        if (now - lastSyncTime >= SYNC_INTERVAL_MS) {
          lastSyncTime = now;
          try {
            const res = await apiPost("/me/activity");
            if (typeof res.workTimeSeconds === "number") {
              workingSeconds = res.workTimeSeconds;
              workTimeEl.textContent = formatTime(workingSeconds);
            }
          } catch (err) {
            console.error("Activity sync error:", err);
          }
        }
      } else {
        statusTextEl.textContent = "Idle / Paused";
      }
    }, TICK_INTERVAL_MS);
  } catch (err) {
    console.error("initActivityTracking error:", err);
  }
}

loginBtn.addEventListener("click", async () => {
  loginError.textContent = "";
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginError.textContent = "Please enter username and password.";
    return;
  }

  try {
    const res = await apiPost("/login", { username, password });
    loggedUserEl.textContent = res.username;
    showDashboard();
    await initActivityTracking();
  } catch (err) {
    console.error("Login failed:", err);
    loginError.textContent = "Login failed. Check username/password or server.";
  }
});

logoutBtn.addEventListener("click", async () => {
  try {
    const res = await apiPost("/logout");
    if (activityTimerId) {
      clearInterval(activityTimerId);
      activityTimerId = null;
    }
    console.log("Final work time (seconds):", res.workTimeSeconds);
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    showLogin();
    workTimeEl.textContent = "00:00:00";
    statusTextEl.textContent = "-";
    idleSecEl.textContent = "0";
    usernameInput.value = "";
    passwordInput.value = "";
  }
});

showLogin();
