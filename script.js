// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyANTrZQjs6BGOq0tpmt6bCylCkI1zDFfc4",
  authDomain: "poll-app-adfec.firebaseapp.com",
  projectId: "poll-app-adfec",
  storageBucket: "poll-app-adfec.firebasestorage.app",
  messagingSenderId: "36150502134",
  appId: "1:36150502134:web:88c7c11be44a3a8f85c2d7",
  measurementId: "G-8RDL2DVR4Q"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let isAdmin = false;
let currentPoll = null;

// === DOM Elements ===
const q = document.getElementById("question");
const opts = document.getElementById("options");
const res = document.getElementById("result");

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

// === Poll Rendering ===
function renderPoll() {
  if (!currentPoll) return;

  q.innerText = currentPoll.question;
  opts.innerHTML = "";
  res.innerHTML = "";

  currentPoll.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.disabled = !isAdmin && localStorage.getItem("voted");
    btn.onclick = () => vote(i);
    opts.appendChild(btn);

    gsap.from(btn, { opacity: 0, x: -50, duration: 0.6, delay: i * 0.1 });
  });

  if (localStorage.getItem("voted") || isAdmin) {
    showResults();
  }
}

// === Vote Function ===
function vote(index) {
  if (!isAdmin && localStorage.getItem("voted")) {
    alert("You've already voted.");
    return;
  }

  currentPoll.votes[index]++;
  db.ref("poll").set(currentPoll);

  if (!isAdmin) {
    localStorage.setItem("voted", "true");
  }

  showResults();
  renderPoll();
}

// === Show Results ===
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

// === Admin Events ===
adminLoginBtn.onclick = () => {
  adminPanel.style.display = adminPanel.style.display === "block" ? "none" : "block";
};

loginBtn.onclick = () => {
  const pass = adminPasswordInput.value;
  if (pass === "Admin1234") {
    isAdmin = true;
    adminForm.style.display = "block";
    newQuestionInput.value = currentPoll.question;
    populateOptionsInputs();
    gsap.from(adminForm, { opacity: 0, y: -20, duration: 0.4 });
    alert("Logged in as admin.");
  } else {
    alert("Wrong password.");
    adminPasswordInput.value = "";
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
    input.maxLength = 50;
    input.value = opt;
    optionsContainer.appendChild(input);
  });
}

addOptionBtn.onclick = () => {
  const currentInputs = optionsContainer.querySelectorAll("input.option-input");
  if (currentInputs.length >= 5) {
    alert("Maximum 5 options allowed.");
    return;
  }
  if (currentInputs[currentInputs.length - 1].value.trim() === "") {
    alert("Fill the last option first.");
    return;
  }
  const input = document.createElement("input");
  input.className = "option-input input";
  input.placeholder = `Option ${currentInputs.length + 1}`;
  input.maxLength = 50;
  optionsContainer.appendChild(input);
};

savePollBtn.onclick = () => {
  const question = newQuestionInput.value.trim();
  const optionInputs = Array.from(optionsContainer.querySelectorAll("input.option-input"));
  const options = optionInputs.map(i => i.value.trim()).filter(v => v !== "");

  if (!question || options.length < 2) {
    alert("Enter a question and at least 2 options.");
    return;
  }

  currentPoll = {
    question,
    options,
    votes: Array(options.length).fill(0)
  };

  localStorage.removeItem("voted");
  db.ref("poll").set(currentPoll);
  alert("Poll saved!");
};

// === Firebase Listener ===
db.ref("poll").on("value", snapshot => {
  currentPoll = snapshot.val();
  renderPoll();
});
