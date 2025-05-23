// Global admin flag
let isAdmin = false;

// Storage keys
const POLL_STORAGE_KEY = "pollApp_poll";
const VOTED_STORAGE_KEY = "pollApp_voted";

// Load poll from localStorage or default poll
let currentPoll = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || {
  question: "What's your favorite programming language?",
  options: ["JavaScript", "Python", "C++"],
  votes: [0, 0, 0],
};

// === RENDER POLL ===
function renderPoll() {
  const q = document.getElementById("question");
  const opts = document.getElementById("options");
  const res = document.getElementById("result");

  q.innerText = currentPoll.question;
  opts.innerHTML = "";
  res.innerHTML = "";

  currentPoll.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.disabled = !isAdmin && localStorage.getItem(VOTED_STORAGE_KEY);
    btn.onclick = () => vote(i);
    opts.appendChild(btn);

    gsap.from(btn, { opacity: 0, x: -50, duration: 0.6, delay: i * 0.1 });
  });

  if (localStorage.getItem(VOTED_STORAGE_KEY) || isAdmin) {
    showResults();
  }
}

// === VOTE FUNCTION ===
function vote(index) {
  if (!isAdmin && localStorage.getItem(VOTED_STORAGE_KEY)) {
    alert("You've already voted.");
    return;
  }

  currentPoll.votes[index]++;
  localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(currentPoll));

  if (!isAdmin) {
    localStorage.setItem(VOTED_STORAGE_KEY, "true");
  }

  showResults();
  renderPoll(); // refresh buttons to disable them for voter
}

// === SHOW RESULTS ===
function showResults() {
  const res = document.getElementById("result");
  res.innerHTML = "";
  const totalVotes = currentPoll.votes.reduce((a, b) => a + b, 0);

  currentPoll.options.forEach((opt, i) => {
    const percent = totalVotes
      ? Math.round((currentPoll.votes[i] / totalVotes) * 100)
      : 0;
    const bar = document.createElement("div");
    bar.textContent = `${opt}: ${percent}% (${currentPoll.votes[i]} votes)`;
    res.appendChild(bar);
    gsap.from(bar, {
      scale: 0,
      duration: 0.5,
      ease: "back.out(1.7)",
      delay: i * 0.1,
    });
  });
}

// === ADMIN PANEL ELEMENTS & EVENTS ===
const adminPanel = document.getElementById("admin-panel");
const adminLoginBtn = document.getElementById("admin-login");
const loginBtn = document.getElementById("login-btn");
const adminForm = document.getElementById("admin-form");
const adminPasswordInput = document.getElementById("admin-password");
const optionsContainer = document.getElementById("options-container");
const addOptionBtn = document.getElementById("add-option");
const savePollBtn = document.getElementById("save-poll");
const logoutBtn = document.getElementById("logout-btn");
const newQuestionInput = document.getElementById("new-question");

// Toggle admin panel visibility
adminLoginBtn.onclick = () => {
  if (adminPanel.style.display === "block") {
    gsap.to(adminPanel, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => (adminPanel.style.display = "none"),
    });
  } else {
    adminPanel.style.display = "block";
    gsap.fromTo(adminPanel, { opacity: 0 }, { opacity: 1, duration: 0.5 });
  }
};

// Login admin
loginBtn.onclick = () => {
  const pass = adminPasswordInput.value;
  if (pass === "Admin12347") {
    isAdmin = true;
    adminForm.style.display = "block";
    newQuestionInput.value = currentPoll.question;
    populateOptionsInputs();
    gsap.from(adminForm, { opacity: 0, y: -20, duration: 0.4 });
    alert("Logged in as admin.");
  } else {
    alert("Wrong password.");
    adminPasswordInput.value = "";
    adminPasswordInput.focus();
  }
};

// Logout admin
logoutBtn.onclick = () => {
  isAdmin = false;
  adminForm.style.display = "none";
  adminPasswordInput.value = "";
  adminPanel.style.display = "none";
  renderPoll();
};

// Populate options inputs with current poll options
function populateOptionsInputs() {
  optionsContainer.innerHTML = "";
  currentPoll.options.forEach((opt, i) => {
    const input = document.createElement("input");
    input.className = "option-input input";
    input.placeholder = `Option ${i + 1}`;
    input.maxLength = 50;
    input.value = opt;
    optionsContainer.appendChild(input);
  });
}

// Add new option input (max 5)
addOptionBtn.onclick = () => {
  const currentInputs = optionsContainer.querySelectorAll("input.option-input");
  if (currentInputs.length >= 5) {
    alert("Maximum 5 options allowed.");
    return;
  }
  // Prevent adding if last input is empty
  if (
    currentInputs.length > 0 &&
    currentInputs[currentInputs.length - 1].value.trim() === ""
  ) {
    alert("Please fill the last option before adding a new one.");
    return;
  }
  const input = document.createElement("input");
  input.className = "option-input input";
  input.placeholder = `Option ${currentInputs.length + 1}`;
  input.maxLength = 50;
  optionsContainer.appendChild(input);
  gsap.from(input, { opacity: 0, y: -10, duration: 0.3 });
};

// Save new poll
savePollBtn.onclick = () => {
  const question = newQuestionInput.value.trim();
  const optionInputs = [
    ...optionsContainer.querySelectorAll("input.option-input"),
  ];
  const options = optionInputs
    .map((input) => input.value.trim())
    .filter((v) => v !== "");

  if (!question) {
    alert("Please enter a poll question.");
    return;
  }
  if (options.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  currentPoll = {
    question,
    options,
    votes: options.map(() => 0),
  };

  localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(currentPoll));
  localStorage.removeItem(VOTED_STORAGE_KEY);
  alert("Poll saved!");

  renderPoll();
};

// Initial render
renderPoll();
