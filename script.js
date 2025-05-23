import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  remove,
  get,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// --- Your Firebase config here ---
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// DOM Elements
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

// Clear children helper
function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

// Animate appearance of an element with GSAP
function animateIn(el) {
  gsap.fromTo(
    el,
    {opacity:0, y:20},
    {opacity:1, y:0, duration:0.5, ease:"power2.out"}
  );
}

// Render polls with live vote counts and buttons
function renderPolls(pollsData) {
  clearChildren(pollsList);
  resultDiv.textContent = "";

  if (!pollsData) {
    pollsList.textContent = "No polls available.";
    return;
  }

  Object.entries(pollsData).forEach(([pollId, poll]) => {
    const pollDiv = document.createElement("div");
    pollDiv.className = "container";
    pollDiv.style.marginBottom = "1.5rem";

    const q = document.createElement("h2");
    q.textContent = poll.question;
    pollDiv.appendChild(q);

    const optionsDiv = document.createElement("div");
    optionsDiv.style.display = "flex";
    optionsDiv.style.flexDirection = "column";
    optionsDiv.style.gap = "0.5rem";

    // Votes array fallback
    let votes = poll.votes || [];
    // Pad votes array to options length
    while (votes.length < poll.options.length) votes.push(0);

    if (!isAdmin) {
      // User mode: Show buttons with live counts
      poll.options.forEach((option, i) => {
        const btn = document.createElement("button");
        btn.className = "option button";

        btn.innerHTML = `${option} <span class="vote-count">(${votes[i] || 0})</span>`;

        btn.onclick = async () => {
          await vote(pollId, i);
        };

        optionsDiv.appendChild(btn);
        animateIn(btn);
      });
    } else {
      // Admin mode: Show results and delete button
      poll.options.forEach((option, i) => {
        const count = votes[i] || 0;
        const voteInfo = document.createElement("div");
        voteInfo.textContent = `${option}: ${count} vote${count !== 1 ? "s" : ""}`;
        voteInfo.style.fontWeight = "bold";
        optionsDiv.appendChild(voteInfo);
        animateIn(voteInfo);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete Poll";
      deleteBtn.className = "button red";
      deleteBtn.style.marginTop = "10px";
      deleteBtn.onclick = () => deletePoll(pollId);
      optionsDiv.appendChild(deleteBtn);
      animateIn(deleteBtn);
    }

    pollDiv.appendChild(optionsDiv);
    pollsList.appendChild(pollDiv);
    animateIn(pollDiv);
  });
}

// Voting function updates vote count on Firebase
async function vote(pollId, optionIndex) {
  const votesRef = ref(db, `polls/${pollId}/votes`);

  try {
    const snapshot = await get(votesRef);
    let votes = snapshot.val();

    if (!votes) {
      votes = Array.from({ length: 10 }, () => 0); // initialize 10 zeros max options
    }

    // Pad votes array
    while (votes.length < 10) votes.push(0);

    votes[optionIndex] = (votes[optionIndex] || 0) + 1;

    await set(votesRef, votes);

    resultDiv.textContent = "Thanks for voting!";
    gsap.fromTo(resultDiv, {opacity:0, y:-10}, {opacity:1, y:0, duration:0.6, ease:"power2.out"});

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
    addOptionInput();
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
  adminLoginBtn.style.display = "block";
  pollsList.innerHTML = "";
  resultDiv.textContent = "";
  loadPolls();
}

// Load polls and listen for changes
function loadPolls() {
  const pollsRef = ref(db, "polls");
  onValue(pollsRef, (snapshot) => {
    const data = snapshot.val();
    renderPolls(data);
  });
}

// Event listeners
adminLoginBtn.addEventListener("click", () => {
  adminPanel.style.display = "block";
  adminLoginBtn.style.display = "none";
});

loginBtn.addEventListener("click", adminLogin);

addOptionBtn.addEventListener("click", () => {
  addOptionInput();
});

savePollBtn.addEventListener("click", savePoll);

logoutBtn.addEventListener("click", adminLogout);

// Init form with two option inputs
addOptionInput();
addOptionInput();

// Start
loadPolls();
