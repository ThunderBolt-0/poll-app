let currentPoll = JSON.parse(localStorage.getItem("poll")) || {
  question: "Favorite programming language?",
  options: ["JavaScript", "Python"],
  votes: [0, 0]
};

// Render Poll
function renderPoll() {
  const q = document.getElementById("question");
  const opts = document.getElementById("options");
  q.innerText = currentPoll.question;
  opts.innerHTML = "";

  currentPoll.options.forEach((opt, i) => {
    const div = document.createElement("div");
    div.className = "option";
    div.innerText = opt;
    div.onclick = () => vote(i);
    opts.appendChild(div);
  });
}

// Handle Vote
function vote(index) {
  if (localStorage.getItem("voted")) return alert("You already voted.");
  currentPoll.votes[index]++;
  localStorage.setItem("poll", JSON.stringify(currentPoll));
  localStorage.setItem("voted", "true");
  showResults();
}

// Show Results with GSAP
function showResults() {
  const res = document.getElementById("result");
  res.innerHTML = "";
  const total = currentPoll.votes.reduce((a, b) => a + b, 0);
  currentPoll.options.forEach((opt, i) => {
    const bar = document.createElement("div");
    const percent = total ? (currentPoll.votes[i] / total) * 100 : 0;
    bar.innerHTML = `${opt}: ${currentPoll.votes[i]} votes`;
    res.appendChild(bar);
    gsap.from(bar, { width: 0, duration: 1 });
  });
}

// Admin Logic
document.getElementById("admin-login").onclick = () =>
  document.getElementById("admin-panel").style.display = "block";

document.getElementById("login-btn").onclick = () => {
  const pass = document.getElementById("admin-password").value;
  if (pass === "Admin12347") {
    document.getElementById("admin-form").style.display = "block";
  } else {
    alert("Wrong password!");
  }
};

document.getElementById("add-option").onclick = () => {
  const inp = document.createElement("input");
  inp.placeholder = "Option";
  inp.className = "option-input";
  document.getElementById("options-container").appendChild(inp);
};

document.getElementById("save-poll").onclick = () => {
  const q = document.getElementById("new-question").value;
  const options = [...document.querySelectorAll(".option-input")].map(el => el.value).filter(v => v);
  if (!q || options.length < 2) return alert("Need a question and at least 2 options");
  currentPoll = { question: q, options, votes: options.map(() => 0) };
  localStorage.setItem("poll", JSON.stringify(currentPoll));
  localStorage.removeItem("voted");
  renderPoll();
};

renderPoll();
