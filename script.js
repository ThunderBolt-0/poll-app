// Sample Poll
let currentPoll = JSON.parse(localStorage.getItem("poll")) || {
  question: "What's your favorite programming language?",
  options: ["JavaScript", "Python", "C++"],
  votes: [0, 0, 0]
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
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = opt;
    div.onclick = () => vote(i);
    opts.appendChild(div);

    // GSAP entrance animation
    gsap.from(div, { opacity: 0, x: -50, duration: 0.6, delay: i * 0.1 });
  });
}

// === VOTE FUNCTION ===
function vote(index) {
  if (localStorage.getItem("voted")) {
    alert("You've already voted.");
    return;
  }

  currentPoll.votes[index]++;
  localStorage.setItem("poll", JSON.stringify(currentPoll));
  localStorage.setItem("voted", "true");
  showResults();
}

// === SHOW RESULTS ===
function showResults() {
  const res = document.getElementById("result");
  res.innerHTML = "";
  const total = currentPoll.votes.reduce((a, b) => a + b, 0);

  currentPoll.options.forEach((opt, i) => {
    const percent = total ? Math.round((currentPoll.votes[i] / total) * 100) : 0;
    const bar = document.createElement("div");
    bar.innerText = `${opt}: ${percent}% (${currentPoll.votes[i]} votes)`;
    res.appendChild(bar);
    gsap.from(bar, { scale: 0, duration: 0.5, ease: "back.out(1.7)", delay: i * 0.1 });
  });
}

// === ADMIN PANEL ===
document.getElementById("admin-login").onclick = () => {
  gsap.to("#admin-panel", { display: "block", opacity: 1, duration: 0.5 });
};

document.getElementById("login-btn").onclick = () => {
  const pass = document.getElementById("admin-password").value;
  if (pass === "Admin12347") {
    document.getElementById("admin-form").style.display = "block";
    gsap.from("#admin-form", { opacity: 0, y: -20, duration: 0.4 });
  } else {
    alert("Wrong password.");
  }
};

document.getElementById("add-option").onclick = () => {
  const input = document.createElement("input");
  input.placeholder = "Option";
  input.className = "option-input input";
  document.getElementById("options-container").appendChild(input);
  gsap.from(input, { opacity: 0, y: -10, duration: 0.3 });
};

document.getElementById("save-poll").onclick = () => {
  const question = document.getElementById("new-question").value;
  const options = [...document.querySelectorAll(".option-input")].map(el => el.value).filter(v => v.trim() !== "");

  if (!question || options.length < 2) {
    aler
