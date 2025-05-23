import {
  initializeApp,
  getDatabase,
  ref,
  onValue,
  set,
  push,
  remove,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase as getDB,
  ref as dbRef,
  onValue as dbOnValue,
  set as dbSet,
  push as dbPush,
  remove as dbRemove,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Admin flag
let isAdmin = false;

// UI Elements
const pollsList = document.getElementById("polls-list");
const resultDiv = document.getElementById("result");
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

// Polls data local cache
let polls = {};

// Track votes by localStorage to prevent double votes
const VOTED_STORAGE_KEY_PREFIX = "pollApp_voted_";

// Render all polls
function renderPolls() {
  pollsList.innerHTML = "";
  resultDiv.innerHTML = "";

  for (const pollId in polls) {
    const poll = polls[pollId];

    const pollDiv = document.createElement("div");
    pollDiv.className = "poll";

    const questionEl = document.createElement("h2");
    questionEl.textContent = poll.question;
    pollDiv.appendChild(questionEl);

    // Options buttons
    poll.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = opt;

      // Disable button if already voted on this poll & not admin
      if (!isAdmin && localStorage.getItem(VOTED_STORAGE_KEY_PREFIX + pollId)) {
        btn.disabled = true;
      }
      btn.onclick = () => vote(pollId, i);

      pollDiv.appendChild(btn);
    });

    // Show results if voted or admin
    if (isAdmin || localStorage.getItem(VOTED_STORAGE_KEY_PREFIX + pollId)) {
      const totalVotes = poll.votes.reduce((a, b) => a + b, 0);
      const resDiv = document.createElement("div");
      resDiv.className = "results";

      poll.options.forEach((opt, i) => {
        const percent = totalVotes ? Math.round((poll.votes[i] / totalVotes) * 100) : 0;
        const bar = document.createElement("div");
        bar.textContent = `${opt}: ${percent}% (${poll.votes[i]} votes)`;
        resDiv.appendChild(bar);
      });

      pollDiv.appendChild(resDiv);
    }

    // Add delete button for admin
    if (isAdmin) {
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete Poll";
      delBtn.className = "button red";
      delBtn.style.marginTop = "0.5rem";
      delBtn.onclick = () => deletePoll(pollId);
      pollDiv.appendChild(delBtn);
    }

    pollsList.appendChild(pollDiv);
  }
}

// Vote function
function vote(pollId, optionIndex) {
  if (!isAdmin && localStorage.getItem(VOTED_STORAGE_KEY_PREFIX + pollId)) {
    alert("You've already voted on this poll.");
    return;
  }

  const poll = polls[pollId];
  poll.votes[optionIndex]++;
  dbSet(dbRef(database, "polls/" + pollId), poll)
    .then(() => {
      if (!isAdmin) localStorage.setItem(VOTED_STORAGE_KEY_PREFIX + pollId, "true");
      renderPolls();
    })
    .catch(console.error);
}

// Delete poll
function deletePoll(pollId) {
  if (!confirm("Delete this poll?")) return;
  dbRemove(dbRef(database, "polls/" + pollId))
    .then(() => {
      delete polls[pollId];
      renderPolls();
    })
    .catch(console.error);
}

// Admin Panel toggle
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

// Admin login
loginBtn.onclick = () => {
  if (adminPasswordInput.value === "Admin12347") {
    isAdmin = true;
    adminForm.style.display = "block";
    adminPasswordInput.value = "";
    populateOptionsInputs();
    gsap.from(adminForm, { opacity: 0, y: -20, duration: 0.4 });
    alert("Logged in as admin.");
    renderPolls();
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
  renderPolls();
};

// Populate options inputs with empty defaults for adding new poll
function populateOptionsInputs() {
  optionsContainer.innerHTML = "";
  for (let i = 1; i <= 2; i++) {
    const input = document.createElement("input");
    input.className = "option-input input";
    input.placeholder = `Option ${i}`;
    input.maxLength = 50;
    optionsContainer.appendChild(input);
  }
  newQuestionInput.value = "";
}

// Add new option input (max 5)
addOptionBtn.onclick = () => {
  if (optionsContainer.children.length >= 5) {
    alert("Maximum 5 options allowed.");
    return;
  }
  const input = document.createElement("input");
  input.className = "option-input input";
  input.placeholder = `Option ${optionsContainer.children.length + 1}`;
  input.maxLength = 50;
  optionsContainer.appendChild(input);
};

// Save new poll
savePollBtn.onclick = () => {
  const question = newQuestionInput.value.trim();
  if (!question) {
    alert("Please enter a poll question.");
    return;
  }
  const optionInputs = [...optionsContainer.querySelectorAll(".option-input")];
  const options = optionInputs
    .map((input) => input.value.trim())
    .filter((opt) => opt !== "");
  if (options.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  // Create new poll object
  const newPoll = {
    question,
    options,
    votes: options.map(() => 0),
  };

  // Push to Firebase
  const pollsRef = dbRef(database, "polls");
  dbPush(pollsRef, newPoll)
    .then(() => {
      alert("Poll saved!");
      newQuestionInput.value = "";
      populateOptionsInputs();
    })
    .catch((e) => {
      alert("Error saving poll: " + e.message);
    });
};

// Load polls from Firebase
const pollsRef = dbRef(database, "polls");
onValue(pollsRef, (snapshot) => {
  polls = snapshot.val() || {};
  renderPolls();
});

// Initialize
populateOptionsInputs();
renderPolls();
