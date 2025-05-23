import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  remove,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ====== Your Firebase config here ======
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

// DOM elements
const pollsList = document.getElementById("polls-list");
const resultDiv = document.getElementById("result");
const adminLoginBtn = document.getElementById("admin-login");
const adminPanel = document.getElementById("admin-panel");
const loginBtn = document.getElementById("login-btn");
const adminPasswordInput = document.getElementById("admin-password");
const adminForm = document.getElementById("admin-form");
const newQuestionInput = document.getElementById("new-question");
const optionsContainer = document.getElementById("options-container");
const addOptionBtn = document.getElementById("add-option");
const savePollBtn = document.getElementById("save-poll");
const logoutBtn = document.getElementById("logout-btn");

const ADMIN_PASSWORD = "ADMIN1234";

let isAdmin = false;

// Utility: Clear child elements
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// Render all polls
function renderPolls(pollsData) {
  clearChildren(pollsList);
  resultDiv.textContent = "";

  if (!pollsData) {
    pollsList.textContent = "No polls available.";
    return;
  }

  // pollsData is an object: { pollId: { question, options, votes } }
  Object.entries(pollsData).forEach(([pollId, poll]) => {
    const pollDiv = document.createElement("div");
    pollDiv.className = "container";
    pollDiv.style.marginBottom = "1rem";

    const q = document.createElement("h2");
    q.textContent = poll.question;
    pollDiv.appendChild(q);

    const optionsDiv = document.createElement("div");
    optionsDiv.id = `options-${pollId}`;
    optionsDiv.style.display = "flex";
    optionsDiv.style.flexDirection = "column";
    optionsDiv.style.gap = "0.5rem";

    // Show voting buttons or results
    if (!isAdmin) {
      // User mode - voting buttons
      poll.options.forEach((option, i) => {
        const btn = document.createElement("button");
        btn.textContent = option;
        btn.className = "option button";
        btn.onclick = () => vote(pollId, i);
        optionsDiv.appendChild(btn);
      });
    } else {
      // Admin mode - show results and delete button
      poll.options.forEach((option, i) => {
        const votesCount = poll.votes ? poll.votes[i] || 0 : 0;
        const voteInfo = document.createElement("div");
        voteInfo.textContent = `${option}: ${votesCount} vote${votesCount !== 1 ? "s" : ""}`;
        optionsDiv.appendChild(voteInfo);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete Poll";
      deleteBtn.className = "button red";
      deleteBtn.onclick = () => deletePoll(pollId);
      optionsDiv.appendChild(deleteBtn);
    }

    pollDiv.appendChild(optionsDiv);
    pollsList.appendChild(pollDiv);
  });
}

// Vote on an option
async function vote(pollId, optionIndex) {
  const votesRef = ref(db, `polls/${pollId}/votes`);

  try {
    const snapshot = await get(votesRef);
    let votes = snapshot.val();

    if (!votes) {
      votes = Array.from({ length: 10 }, () => 0); // max 10 options, initialize with zeros
    }

    // Make sure votes array is long enough
    while (votes.length < 10) votes.push(0);

    votes[optionIndex] = (votes[optionIndex] || 0) + 1;

    await set(votesRef, votes);

    resultDiv.textContent = `Thanks for voting!`;
  } catch (e) {
    console.error("Voting error:", e);
  }
}

// Delete poll (admin)
async function deletePoll(pollId) {
  if (!confirm("Are you sure you want to delete this poll?")) return;
  try {
    await remove(ref(db, `polls/${pollId}`));
  } catch (e) {
    console.error("Delete poll error:", e);
  }
}

// Save new poll (admin)
async function savePoll() {
  const question = newQuestionInput.value.trim();
  const optionInputs = optionsContainer.querySelectorAll(".option-input");
  const options = Array.from(optionInputs)
    .map(input => input.value.trim())
    .filter(opt => opt.length > 0);

  if (!question) {
    alert("Please enter a poll question.");
    return;
  }
  if (options.length < 2) {
    alert("Please enter at least two options.");
    return;
  }

  const pollRef = push(ref(db, "polls"));

  try {
    await set(pollRef, {
      question,
      options,
      votes: options.map(() => 0)
    });

    // Clear form
    newQuestionInput.value = "";
    clearChildren(optionsContainer);
    addOptionInput(); // add two inputs by default
    addOptionInput();

    alert("Poll saved!");
  } catch (e) {
    console.error("Save poll error:", e);
  }
}

// Add new option input field (admin)
function addOptionInput() {
  const input = document.createElement("input");
  input.className = "option-input input";
  input.placeholder = `Option ${optionsContainer.children.length + 1}`;
  input.maxLength = 50;
  optionsContainer.appendChild(input);
}

// Admin login
function adminLogin() {
  if (adminPasswordInput.value === ADMIN_PASSWORD) {
    isAdmin = true;
    adminPanel.style.display = "block";
    adminForm.style.display = "block";
    adminLoginBtn.style.display = "none";
    adminPasswordInput.value = "";
    loginBtn.style.display = "none";
    newQuestionInput.focus();
    loadPolls();
  } else {
    alert("Wrong admin password!");
  }
}

// Admin logout
function adminLogout() {
  isAdmin = false;
  adminPanel.style.display = "none";
  adminLoginBtn.style.display = "inline-block";
  clearChildren(pollsList);
  resultDiv.textContent = "";
  loadPolls();
}

// Load polls from Firebase
function loadPolls() {
  const pollsRef = ref(db, "polls");
  onValue(pollsRef, (snapshot) => {
    renderPolls(snapshot.val());
  });
}

// Event Listeners
adminLoginBtn.addEventListener("click", () => {
  adminPanel.style.display = "block";
});

loginBtn.addEventListener("click", adminLogin);

logoutBtn.addEventListener("click", adminLogout);

addOptionBtn.addEventListener("click", () => {
  addOptionInput();
});

savePollBtn.addEventListener("click", savePoll);

// Initialize
clearChildren(optionsContainer);
addOptionInput();
addOptionInput();
loadPolls();
