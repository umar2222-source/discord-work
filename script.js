const authPortal = document.getElementById("authPortal");
const signInPortal = document.getElementById("signInPortal");
const dashboard = document.getElementById("dashboard");
const adminSignInPortal = document.getElementById("adminSignInPortal");
const adminPortal = document.getElementById("adminPortal");
const themeMenuBtn = document.getElementById("themeMenuBtn");
const openAdminBtn = document.getElementById("openAdminBtn");
const themeMenuIcon = document.getElementById("themeMenuIcon");
const themeMenuText = document.getElementById("themeMenuText");
const signUpForm = document.getElementById("signUpForm");
const signInForm = document.getElementById("signInForm");
const adminSignInForm = document.getElementById("adminSignInForm");
const backToSignInBtn = document.getElementById("backToSignInBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const goToSignUpBtn = document.getElementById("goToSignUpBtn");
const authMessage = document.getElementById("authMessage");
const signInMessage = document.getElementById("signInMessage");
const adminSignInMessage = document.getElementById("adminSignInMessage");
const adminStatusList = document.getElementById("adminStatusList");
const adminActivityList = document.getElementById("adminActivityList");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcomeText");
const timeDisplay = document.getElementById("timeDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");
const timerStatus = document.getElementById("timerStatus");
let currentSession = null;
let timerId = null;
let elapsedMs = 0;
let startedAt = null;
let running = false;
let paused = false;
let isAdminLoggedIn = false;
let adminRefreshTimer = null;

const USERS_KEY = "account-portal-users";
const SESSION_KEY = "account-portal-session";
const THEME_KEY = "account-portal-theme";
const TIMER_EVENTS_KEY = "account-portal-timer-events";
const USER_STATUS_KEY = "account-portal-user-status";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";
const supabaseClient =
  window.supabase && SUPABASE_URL && SUPABASE_ANON_KEY
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

function useSupabase() {
  return Boolean(supabaseClient);
}

async function loadTimerEvents() {
  if (useSupabase()) {
    const { data, error } = await supabaseClient
      .from("timer_events")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error) {
      return (data || []).map((row) => ({
        name: row.name,
        email: row.email,
        action: row.action,
        at: row.at
      }));
    }
  }
  try {
    const raw = localStorage.getItem(TIMER_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveTimerEvents(events) {
  if (useSupabase()) {
    return;
  }
  localStorage.setItem(TIMER_EVENTS_KEY, JSON.stringify(events));
}

async function loadUserStatuses() {
  if (useSupabase()) {
    const { data, error } = await supabaseClient.from("user_statuses").select("*");
    if (!error) {
      const mapped = {};
      (data || []).forEach((row) => {
        mapped[row.email] = { status: row.status, at: row.at, name: row.name };
      });
      return mapped;
    }
  }
  try {
    const raw = localStorage.getItem(USER_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveUserStatuses(statuses) {
  if (useSupabase()) {
    return;
  }
  localStorage.setItem(USER_STATUS_KEY, JSON.stringify(statuses));
}

async function loadUsers() {
  if (useSupabase()) {
    const { data, error } = await supabaseClient.from("users").select("*");
    if (!error) {
      return (data || []).map((row) => ({
        name: row.name,
        email: row.email,
        password: row.password
      }));
    }
  }
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users) {
  if (useSupabase()) {
    return;
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  if (theme === "dark") {
    themeMenuIcon.textContent = "☰☀";
    themeMenuText.textContent = "Light Mode";
  } else {
    themeMenuIcon.textContent = "☰🌙";
    themeMenuText.textContent = "Dark Mode";
  }
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const theme = saved === "dark" ? "dark" : "light";
  applyTheme(theme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const nextTheme = isDark ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

function showSignUp() {
  authPortal.classList.remove("hidden");
  signInPortal.classList.add("hidden");
  dashboard.classList.add("hidden");
  adminSignInPortal.classList.add("hidden");
  adminPortal.classList.add("hidden");
  authMessage.textContent = "";
}

function showSignIn() {
  authPortal.classList.add("hidden");
  signInPortal.classList.remove("hidden");
  dashboard.classList.add("hidden");
  adminSignInPortal.classList.add("hidden");
  adminPortal.classList.add("hidden");
  signInMessage.textContent = "";
}

function showDashboard() {
  if (!currentSession) return;
  authPortal.classList.add("hidden");
  signInPortal.classList.add("hidden");
  adminSignInPortal.classList.add("hidden");
  adminPortal.classList.add("hidden");
  dashboard.classList.remove("hidden");
  welcomeText.textContent = `Logged in as ${currentSession.name} (${currentSession.email})`;
  resetTimer();
}

function showAuth() {
  signInPortal.classList.add("hidden");
  dashboard.classList.add("hidden");
  adminSignInPortal.classList.add("hidden");
  adminPortal.classList.add("hidden");
  authPortal.classList.remove("hidden");
}

function showAdminSignIn() {
  authPortal.classList.add("hidden");
  signInPortal.classList.add("hidden");
  dashboard.classList.add("hidden");
  adminPortal.classList.add("hidden");
  adminSignInPortal.classList.remove("hidden");
  adminSignInMessage.textContent = "";
  if (adminRefreshTimer) {
    clearInterval(adminRefreshTimer);
    adminRefreshTimer = null;
  }
}

async function renderAdminPortal() {
  const events = (await loadTimerEvents()).slice().reverse();
  const users = await loadUsers();
  const statuses = await loadUserStatuses();

  adminStatusList.innerHTML = "";
  if (users.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No users registered yet.";
    adminStatusList.append(li);
  } else {
    users.forEach((user) => {
      const state = statuses[user.email] || { status: "Offline", at: "N/A" };
      const li = document.createElement("li");
      li.textContent = `${user.name} (${user.email}) - ${state.status} at ${state.at}`;
      adminStatusList.append(li);
    });
  }

  adminActivityList.innerHTML = "";
  if (events.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No start/pause/stop logs yet.";
    adminActivityList.append(li);
  } else {
    events.slice(0, 50).forEach((event) => {
      const li = document.createElement("li");
      li.textContent = `${event.at} - ${event.name} (${event.email}) -> ${event.action}`;
      adminActivityList.append(li);
    });
  }
}

function showAdminPortal() {
  authPortal.classList.add("hidden");
  signInPortal.classList.add("hidden");
  dashboard.classList.add("hidden");
  adminSignInPortal.classList.add("hidden");
  adminPortal.classList.remove("hidden");
  void renderAdminPortal();
  if (adminRefreshTimer) {
    clearInterval(adminRefreshTimer);
  }
  adminRefreshTimer = setInterval(() => {
    void renderAdminPortal();
  }, 1500);
}

async function logTimerEvent(action) {
  if (!currentSession) return;
  const newEvent = {
    name: currentSession.name,
    email: currentSession.email,
    action,
    at: new Date().toLocaleString()
  };
  if (useSupabase()) {
    await supabaseClient.from("timer_events").insert(newEvent);
    return;
  }
  const events = await loadTimerEvents();
  events.push(newEvent);
  await saveTimerEvents(events.slice(-300));
}

async function updateUserStatus(status) {
  if (!currentSession) return;
  const record = {
    email: currentSession.email,
    name: currentSession.name,
    status,
    at: new Date().toLocaleString()
  };
  if (useSupabase()) {
    await supabaseClient.from("user_statuses").upsert(record, { onConflict: "email" });
    return;
  }
  const statuses = await loadUserStatuses();
  statuses[currentSession.email] = record;
  await saveUserStatuses(statuses);
}

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function currentElapsed() {
  if (!running || startedAt === null) return elapsedMs;
  return elapsedMs + (Date.now() - startedAt);
}

function refreshTime() {
  timeDisplay.textContent = formatDuration(currentElapsed());
}

function updateButtons() {
  startBtn.disabled = running;
  pauseBtn.disabled = !running;
  stopBtn.disabled = !running && !paused && elapsedMs === 0;
}

function setStatus(text) {
  timerStatus.textContent = `Status: ${text}`;
}

function resetTimer() {
  elapsedMs = 0;
  startedAt = null;
  running = false;
  paused = false;
  clearInterval(timerId);
  timerId = null;
  refreshTime();
  setStatus("Idle");
  timeDisplay.classList.remove("running");
  if (currentSession) {
    void updateUserStatus("Idle");
  }
  updateButtons();
}

function startTimer() {
  if (running) return;
  startedAt = Date.now();
  running = true;
  paused = false;
  clearInterval(timerId);
  timerId = setInterval(refreshTime, 250);
  setStatus("Working");
  timeDisplay.classList.add("running");
  void updateUserStatus("Working");
  void logTimerEvent("Start");
  updateButtons();
}

function pauseTimer() {
  if (!running) return;
  elapsedMs = currentElapsed();
  startedAt = null;
  running = false;
  paused = true;
  clearInterval(timerId);
  timerId = null;
  refreshTime();
  setStatus("Paused");
  timeDisplay.classList.remove("running");
  void updateUserStatus("Paused");
  void logTimerEvent("Pause");
  updateButtons();
}

function stopTimer() {
  void updateUserStatus("Stopped");
  void logTimerEvent("Stop");
  resetTimer();
}

signUpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("signUpName").value.trim();
  const email = document.getElementById("signUpEmail").value.trim().toLowerCase();
  const password = document.getElementById("signUpPassword").value;
  const confirmPassword = document.getElementById("signUpConfirmPassword").value;

  if (!name || !email || !password || !confirmPassword) {
    authMessage.textContent = "Please fill all fields.";
    return;
  }
  if (password !== confirmPassword) {
    authMessage.textContent = "Passwords do not match.";
    return;
  }

  const users = await loadUsers();
  const exists = users.some((user) => user.email === email);
  if (exists) {
    authMessage.textContent = "Email is already registered. Please sign in.";
    return;
  }

  if (useSupabase()) {
    const { error } = await supabaseClient.from("users").insert({ name, email, password });
    if (error) {
      authMessage.textContent = "Could not create account in Supabase.";
      return;
    }
  } else {
    users.push({ name, email, password });
    await saveUsers(users);
  }
  authMessage.textContent = "Account created. Please sign in to continue.";
  signUpForm.reset();
  showSignIn();
  document.getElementById("signInEmail").value = email;
  signInMessage.textContent = "Account created. Please sign in.";
  document.getElementById("signInPassword").focus();
});

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("signInEmail").value.trim().toLowerCase();
  const password = document.getElementById("signInPassword").value;
  const users = await loadUsers();
  const user = users.find((item) => item.email === email && item.password === password);
  if (!user) {
    signInMessage.textContent = "Invalid email or password.";
    return;
  }

  currentSession = { name: user.name, email: user.email };
  saveSession(currentSession);
  void updateUserStatus("Online");
  signInForm.reset();
  signInMessage.textContent = "";
  showDashboard();
});

adminSignInForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = document.getElementById("adminUsername").value.trim();
  const password = document.getElementById("adminPassword").value;
  const valid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  if (!valid) {
    adminSignInMessage.textContent = "Invalid admin username or password.";
    return;
  }
  adminSignInForm.reset();
  adminSignInMessage.textContent = "";
  isAdminLoggedIn = true;
  showAdminPortal();
});

themeMenuBtn.addEventListener("click", toggleTheme);
openAdminBtn.addEventListener("click", showAdminSignIn);
backToSignInBtn.addEventListener("click", showSignIn);
adminLogoutBtn.addEventListener("click", () => {
  isAdminLoggedIn = false;
  if (adminRefreshTimer) {
    clearInterval(adminRefreshTimer);
    adminRefreshTimer = null;
  }
  showAdminSignIn();
});
goToSignUpBtn.addEventListener("click", showSignUp);
startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
stopBtn.addEventListener("click", stopTimer);

window.addEventListener("storage", (event) => {
  if (!isAdminLoggedIn) return;
  if (event.key === TIMER_EVENTS_KEY || event.key === USER_STATUS_KEY || event.key === USERS_KEY) {
    void renderAdminPortal();
  }
});

logoutBtn.addEventListener("click", () => {
  void updateUserStatus("Offline");
  currentSession = null;
  clearSession();
  resetTimer();
  showSignIn();
});

currentSession = loadSession();
loadTheme();
if (useSupabase()) {
  signInMessage.textContent = "Supabase mode enabled.";
}
if (currentSession) {
  showDashboard();
} else {
  showAuth();
  showSignUp();
  resetTimer();
}
