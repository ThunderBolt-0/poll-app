import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  update,
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-database.js";

// Your Firebase config here
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
const db = getDatabase(app);

const POLLS_PATH = "polls";
const VOTED_STORAGE_KEY = "pollApp_voted";

let isAdmin = false;
let polls = {}; // Store all polls fetched from Firebase

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

// Track which poll is being edited (for admin)
let editingPollId = null;

// Fetch all polls and render
function fetchPolls() {
  onValue(ref(db, POLLS_PATH), (snapshot) => {
    if (snapshot.exists()) {
      polls = snapshot.val();
    } else {
      polls = {};
    }
    renderPolls();
  });
}

// Render all polls (question + options + results)
function renderPolls() {
  pollContainer.innerHTML = "<h1 class='fade-in'>📊 Polls</h1>";
  
  if (!polls || Object.keys(polls).length === 0) {
    pollContainer.innerHTML += "<p>No polls available.</p>";
    return;
  }

  Object.entries(polls).forEach(([pollId, poll], index) => {
    const pollDiv = document.createElement("div");
    pollDiv.className = "container";

    // Question
    const questionEl = document.createElement("h2");
    questionEl.textContent = poll.question;
    pollDiv.appendChild(questionEl);

    // Options container
    const optionsEl = document.createElement("div");
    optionsEl.style.display = "flex";
    optionsEl.style.flexDirection = "column";
    optionsEl.style.gap = "0.5rem";

    // Buttons for options
    poll.options.forEach((option, i) => {
      const btn = document.createElement("button");
      btn.className = "option";
      btn.textContent = option;

      // Disable if voted already (per poll) and not admin
      const votedPolls = JSON.parse(localStorage.getItem(VOTED_STORAGE_KEY) || "{}");
      const voted = votedPolls[pollId];
      btn.disabled = !isAdmin && voted;

      btn.onclick = () => vote(pollId, i);
      optionsEl.appendChild(btn);
    });
    pollDiv.appendChild(optionsEl);

    // Results
    if (isAdmin || (JSON.parse(localStorage.getItem(VOTED_STORAGE_KEY) || "{}"))[pollId]) {
      const resultDiv = document.createElement("div");
      const totalVotes = poll.votes.reduce((a, b) => a + b, 0);

      poll.options.forEach((opt, i) => {
        const percent = totalVotes ? Math.round((poll.votes[i] / totalVotes) * 100) : 0;
        const bar = document.createElement("div");
        bar.textContent = `${opt}: ${percent}% (${poll.votes[i]} votes)`;
        resultDiv.appendChild(bar);
      });

      pollDiv.appendChild(resultDiv);
    }

    // Admin controls: Edit & Delete
    if (isAdmin) {
      const adminControls = document.createElement("div");
      adminControls.style.marginTop = "1rem";
      adminControls.style.display = "flex";
      adminControls.style.gap = "10px";

      // Edit button
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className = "button blue";
      editBtn.onclick = () => loadPollToForm(pollId);
      adminControls.appendChild(editBtn);

      // Delete button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className = "button red";
      deleteBtn.onclick = () => deletePoll(pollId);
      adminControls.appendChild(deleteBtn);

      pollDiv.appendChild(adminControls);
    }

    pollContainer.appendChild(pollDiv);
  });
}

// Vote for option index on poll with pollId
function vote(pollId, optionIndex) {
  if (!isAdmin) {
    const votedPolls = JSON.parse(localStorage.getItem(VOTED_STORAGE_KEY) || "{}");
    if (votedPolls[pollId]) {
      alert("You've already voted on this poll.");
      return;
    }
    votedPolls[pollId] = true;
    localStorage.setItem(VOTED_STORAGE_KEY, JSON.stringify(votedPolls));
  }

  const poll = polls[pollId];
  poll.votes[optionIndex]++;

  // Save to Firebase
  set(ref(db, `${POLLS_PATH}/${pollId}`), poll)
    .then(() => {
      fetchPolls();
    })
    .catch((err) => alert("Error voting: " + err));
}

// Load poll data into admin form for editing
function loadPollToForm(pollId) {
  editingPollId = pollId;
  const poll = polls[pollId];
  newQuestionInput.value = poll.question;
  optionsContainer.innerHTML = "";

  poll.options.forEach((opt) => {
    const input = document.createElement("input");
    input.className = "option-input input";
    input.placeholder = "Option";
    input.maxLength = 50;
    input.value = opt;
    optionsContainer.appendChild(input);
  });

  adminForm.style.display = "block";
}

// Delete poll from Firebase
function deletePoll(pollId) {
  if (confirm("Are you sure you want to delete this poll?")) {
    remove(ref(db, `${POLLS_PATH}/${pollId}`))
      .then(() => {
        alert("Poll deleted.");
        fetchPolls();
      })
      .catch((err) => alert("Error deleting poll: " + err));
  }
}

// Add new option input
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

// Save poll (new or edited)
savePollBtn.onclick = () => {
  const question = newQuestionInput.value.trim();
  const optionInputs = [...optionsContainer.querySelectorAll("input.option-input")];
  const options = optionInputs.map((i) => i.value.trim()).filter((v) => v !== "");

  if (!question) {
    alert("Please enter a poll question.");
    return;
  }
  if (options.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  // If editing existing poll
  if (editingPollId) {
    const poll = polls[editingPollId];
    poll.question = question;
    poll.options = options;
    // Reset votes on option count change
    poll.votes = options.map(() => 0);

    set(ref(db, `${POLLS_PATH}/${editingPollId}`), poll)
      .then(() => {
        alert("Poll updated!");
        adminForm.style.display = "none";
        editingPollId = null;
        fetchPolls();
      })
      .catch((err) => alert("Error saving poll: " + err));
  } else {
    // New poll - generate new id
    const newPollId = Date.now().toString();
    const newPoll = {
      question,
      options,
      votes: options.map(() => 0),
    };

    set(ref(db, `${POLLS_PATH}/${newPollId}`), newPoll)
      .then(() => {
        alert("Poll created!");
        adminForm.style.display = "none";
        fetchPolls();
      })
      .catch((err) => alert("Error creating poll: " + err));
  }
};

// Admin login/logout
adminLoginBtn.onclick = () => {
  if (adminPanel.style.display === "block") {
    adminPanel.style.display = "none";
  } else {
    adminPanel.style.display = "block";
  }
};

loginBtn.onclick = () => {
  if (adminPasswordInput.value === "ADMIN1234") {
    isAdmin = true;
    adminForm.style.display = "block";
    adminPasswordInput.value = "";
    adminPanel.style.display = "none";
    renderPolls();
  } else {
    alert("Incorrect admin password.");
  }
};

logoutBtn.onclick = () => {
  isAdmin = false;
  adminForm.style.display = "none";
  adminPanel.style.display = "none";
  renderPolls();
};

// On load
fetchPolls();
