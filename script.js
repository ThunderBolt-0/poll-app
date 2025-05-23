import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const pollRef = ref(db, 'poll');

let isAdmin = false;
let currentPoll = null;

onValue(ref(db, "poll"), (snapshot) => {
  if (snapshot.exists()) {
    currentPoll = snapshot.val();
    renderPoll();
  } else {
    // Set a default poll if none exists
    currentPoll = {
      question: "What's your favorite programming language?",
      options: ["JavaScript", "Python", "C++"],
      votes: [0, 0, 0],
    };
    set(ref(db, "poll"), currentPoll);
    renderPoll();
  }
});


const q = document.getElementById("question");
const opts = document.getElementById("options");
const res = document.getElementById("result");

function renderPoll() {
  q.innerText = currentPoll.question;
  opts.innerHTML = "";
  res.innerHTML = "";

  currentPoll.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.disabled = !isAdmin && localStorage.getItem("pollApp_voted");
    btn.onclick = () => vote(i);
    opts.appendChild(btn);
    gsap.from(btn, { opacity: 0, x: -50, duration: 0.6, delay: i * 0.1 });
  });

  if (localStorage.getItem("pollApp_voted") || isAdmin) {
    showResults();
  }
}

function vote(index) {
  if (!isAdmin && localStorage.getItem("pollApp_voted")) {
    alert("You've already voted.");
    return;
  }

  currentPoll.votes[index]++;
  update(pollRef, { votes: currentPoll.votes });

  if (!isAdmin) {
    localStorage.setItem("pollApp_voted", "true");
  }

  showResults();
  renderPoll();
}

function showResults() {
  res.innerHTML = "";
  const totalVotes = currentPoll.votes.reduce((a, b) => a + b, 0);

  currentPoll.options.forEach((opt, i) => {
    const percent = totalVotes ? Math.round((currentPoll.votes[i] / totalVotes) * 100) : 0;
    const bar = document.createElement("div");
    bar.textContent = `${opt}: ${percent}% (${currentPoll.votes[i]} votes)`;
    res.appendChild(bar);
    gsap.from(bar, { scale: 0, duration: 0.5, ease: "back.out(1.7)", delay: i * 0.1 });
  });
}

// Admin panel
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

adminLoginBtn.onclick = () => {
  adminPanel.style.display = adminPanel.style.display === "block" ? "none" : "block";
};

loginBtn.onclick = () => {
  if (adminPasswordInput.value === "ADMIN1234") {
    isAdmin = true;
    adminForm.style.display = "block";
    newQuestionInput.value = currentPoll.question;
    populateOptionsInputs();
    alert("Logged in as admin.");
  } else {
    alert("Wrong password.");
  }
};

logoutBtn.onclick = () => {
  isAdmin = false;
  adminForm.style.display = "none";
  adminPasswordInput.value = "";
  adminPanel.style.display = "none";
  renderPoll();
};

function populateOptionsInputs() {
  optionsContainer.innerHTML = "";
  currentPoll.options.forEach((opt, i) => {
    const input = document.createElement("input");
    input.className = "option-input input";
    input.placeholder = `Option ${i + 1}`;
    input.value = opt;
    optionsContainer.appendChild(input);
  });
}

addOptionBtn.onclick = () => {
  const currentInputs = optionsContainer.querySelectorAll("input.option-input");
  if (currentInputs.length >= 5) return;
  const last = currentInputs[currentInputs.length - 1];
  if (last && last.value.trim() === "") return;

  const input = document.createElement("input");
  input.className = "option-input input";
  input.placeholder = `Option ${currentInputs.length + 1}`;
  optionsContainer.appendChild(input);
  gsap.from(input, { opacity: 0, y: -10, duration: 0.3 });
};

savePollBtn.onclick = () => {
  const question = newQuestionInput.value.trim();
  const options = [...optionsContainer.querySelectorAll("input.option-input")].map(i => i.value.trim()).filter(Boolean);
  if (!question || options.length < 2) {
    alert("Fill question and at least 2 options");
    return;
  }
  const votes = options.map(() => 0);
  const newPoll = { question, options, votes };
  set(pollRef, newPoll);
  localStorage.removeItem("pollApp_voted");
  alert("Poll saved!");
};

// Listen for database changes
onValue(pollRef, (snapshot) => {
  if (snapshot.exists()) {
    currentPoll = snapshot.val();
    renderPoll();
  }
});
