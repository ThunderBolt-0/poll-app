import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";


// Firebase config - replace with your own config
const firebaseConfig = {
  apiKey: "AIzaSyANTrZQjs6BGOq0tpmt6bCylCkI1zDFfc4",
  authDomain: "poll-app-adfec.firebaseapp.com",
  projectId: "poll-app-adfec",
  storageBucket: "poll-app-adfec.firebasestorage.app",
  messagingSenderId: "36150502134",
  appId: "1:36150502134:web:88c7c11be44a3a8f85c2d7",
  measurementId: "G-8RDL2DVR4Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Admin password
const ADMIN_PASSWORD = "Admin12347";

// DOM elements
const pollContainer = document.getElementById("poll-container");
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

let isAdmin = false;
let currentPoll = null; // will hold current poll object
let hasVoted = false;

// Fetch poll from Firebase DB
function fetchPoll() {
  const pollRef = ref(db, 'poll');
  onValue(pollRef, (snapshot) => {
    if (snapshot.exists()) {
      currentPoll = snapshot.val();
    } else {
      // Default poll if none exists in DB
      currentPoll = {
        question: "What's your favorite programming language?",
        options: ["JavaScript", "Python", "C++"],
        votes: [0, 0, 0],
      };
      set(ref(db, 'poll'), currentPoll);
    }
    hasVoted = !!localStorage.getItem("pollApp_voted");
    renderPoll();
  });
}

// Render the poll UI
function renderPoll() {
  pollContainer.innerHTML = ""; // Clear container

  const title = document.createElement("h1");
  title.textContent = "📊 Poll of the Day";
  title.className = "fade-in";
  pollContainer.appendChild(title);

  const questionElem = document.createElement("h2");
  questionElem.textContent = currentPoll.question;
  questionElem.className = "slide-in";
  pollContainer.appendChild(questionElem);

  const optionsElem = document.createElement("div");
  optionsElem.id = "options";
  pollContainer.appendChild(optionsElem);

  const resultElem = document.createElement("div");
  resultElem.id = "result";
  pollContainer.appendChild(resultElem);

  // Create vote buttons or disable if voted
  currentPoll.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.disabled = !isAdmin && hasVoted;
    btn.onclick = () => vote(i);
    optionsElem.appendChild(btn);
  });

  if (hasVoted || isAdmin) {
    showResults();
  }

  // Show admin button if not admin already
  if (!document.getElementById("admin-login") && !isAdmin) {
    const adminBtn = document.createElement("button");
    adminBtn.id = "admin-login";
    adminBtn.textContent = "Admin";
    adminBtn.className = "button blue";
    adminBtn.onclick = toggleAdminPanel;
    pollContainer.appendChild(adminBtn);
  }
}

// Show poll results with percentages
function showResults() {
  const res = document.getElementById("result");
  res.innerHTML = "";
  const totalVotes = currentPoll.votes.reduce((a, b) => a + b, 0);

  currentPoll.options.forEach((opt, i) => {
    const percent = totalVotes ? Math.round((currentPoll.votes[i] / totalVotes) * 100) : 0;
    const bar = document.createElement("div");
    bar.textContent = `${opt}: ${percent}% (${currentPoll.votes[i]} votes)`;
    res.appendChild(bar);
  });
}

// Vote function
function vote(index) {
  if (!isAdmin && hasVoted) {
    alert("You've already voted.");
    return;
  }

  currentPoll.votes[index]++;
  set(ref(db, 'poll'), currentPoll);
  if (!isAdmin) {
    localStorage.setItem("pollApp_voted", "true");
    hasVoted = true;
  }
  renderPoll();
}

// Toggle admin panel visibility
function toggleAdminPanel() {
  if (adminPanel.style.display === "block") {
    adminPanel.style.display = "none";
  } else {
    adminPanel.style.display = "block";
  }
}

// Admin login
loginBtn.onclick = () => {
  const pass = adminPasswordInput.value;
  if (pass === ADMIN_PASSWORD) {
    isAdmin = true;
    adminForm.style.display = "block";
    newQuestionInput.value = currentPoll.question;
    populateOptionsInputs();
    alert("Logged in as admin.");
    adminPasswordInput.value = "";
    adminPanel.style.display = "none";
    renderPoll();
  } else {
    alert("Wrong password.");
    adminPasswordInput.value = "";
    adminPasswordInput.focus();
  }
};

// Admin logout
logoutBtn.onclick = () => {
  isAdmin = false;
  adminForm.style.display = "none";
  adminPanel.style.display = "none";
  renderPoll();
};

// Populate option inputs for admin form
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

// Add option input (max 5)
addOptionBtn.onclick = () => {
  const currentInputs = optionsContainer.querySelectorAll("input.option-input");
  if (currentInputs.length >= 5) {
    alert("Maximum 5 options allowed.");
    return;
  }
  if (currentInputs.length > 0 && currentInputs[currentInputs.length - 1].value.trim() === "") {
    alert("Please fill the last option before adding a new one.");
    return;
  }
  const input = document.createElement("input");
  input.className = "option-input input";
  input.placeholder = `Option ${currentInputs.length + 1}`;
  input.maxLength = 50;
  optionsContainer.appendChild(input);
};

// Save poll from admin form
savePollBtn.onclick = () => {
  const question = newQuestionInput.value.trim();
  const optionInputs = [...optionsContainer.querySelectorAll("input.option-input")];
  const options = optionInputs.map(input => input.value.trim()).filter(v => v !== "");

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

  set(ref(db, 'poll'), currentPoll);
  localStorage.removeItem("pollApp_voted");
  alert("Poll saved!");
  renderPoll();
};

// Initial fetch and render
fetchPoll();