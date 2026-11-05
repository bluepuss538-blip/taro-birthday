const wishScene = document.querySelector("#wishScene");
const holdButton = document.querySelector("#holdButton");
const holdHint = document.querySelector("#holdHint");
const childhoodCard = document.querySelector("#childhoodCard");
const enterExperience = document.querySelector("#enterExperience");
const experience = document.querySelector("#experience");
const backgroundMusic = document.querySelector("#backgroundMusic");
const musicToggle = document.querySelector("#musicToggle");

let holdStart = 0;
let holdFrame = null;
let candlesBlown = false;
let musicTarget = 0.18;
let fadeFrame = null;

function fadeMusic(target, duration = 700) {
  cancelAnimationFrame(fadeFrame);
  const from = backgroundMusic.volume;
  const start = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - start) / duration);
    backgroundMusic.volume = Math.max(0, Math.min(1, from + (target - from) * progress));
    if (progress < 1) fadeFrame = requestAnimationFrame(step);
  }

  fadeFrame = requestAnimationFrame(step);
}

async function primeMusic() {
  if (!backgroundMusic.paused) return;
  backgroundMusic.volume = 0;
  try {
    await backgroundMusic.play();
    musicToggle?.setAttribute("aria-pressed", "true");
  } catch {
    // A visible music control remains available if a browser blocks playback.
  }
}

function updateHold(now) {
  const progress = Math.min(1, (now - holdStart) / 1500);
  holdButton.style.setProperty("--hold-progress", `${progress * 360}deg`);
  holdHint.textContent = progress < 0.45 ? "Keep holding…" : progress < 0.85 ? "Almost there…" : "Make it count.";

  if (progress >= 1) {
    blowCandles();
    return;
  }
  holdFrame = requestAnimationFrame(updateHold);
}

function beginHold(event) {
  if (candlesBlown) return;
  if (event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
  event.preventDefault();
  primeMusic();
  holdStart = performance.now();
  cancelAnimationFrame(holdFrame);
  holdFrame = requestAnimationFrame(updateHold);
}

function cancelHold(event) {
  if (candlesBlown) return;
  if (event?.type === "keyup" && !["Enter", " "].includes(event.key)) return;
  cancelAnimationFrame(holdFrame);
  holdButton.style.setProperty("--hold-progress", "0deg");
  holdHint.textContent = "Keep holding until the circle completes.";
  if (backgroundMusic.volume === 0) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
  }
}

function blowCandles() {
  if (candlesBlown) return;
  candlesBlown = true;
  cancelAnimationFrame(holdFrame);
  wishScene.classList.add("blown");
  holdButton.setAttribute("aria-disabled", "true");
  fadeMusic(musicTarget, 1600);

  setTimeout(() => {
    childhoodCard.classList.add("show");
    childhoodCard.setAttribute("aria-hidden", "false");
    enterExperience.focus({ preventScroll: true });
  }, 1100);
}

holdButton.addEventListener("pointerdown", beginHold);
holdButton.addEventListener("pointerup", cancelHold);
holdButton.addEventListener("pointercancel", cancelHold);
holdButton.addEventListener("pointerleave", cancelHold);
holdButton.addEventListener("keydown", beginHold);
holdButton.addEventListener("keyup", cancelHold);

enterExperience.addEventListener("click", () => {
  wishScene.classList.add("leaving");
  setTimeout(() => {
    wishScene.hidden = true;
    experience.hidden = false;
    window.scrollTo({ top: 0, behavior: "instant" });
    observeReveals();
    document.querySelector("#translated").focus?.({ preventScroll: true });
  }, 650);
});

musicToggle.addEventListener("click", async () => {
  if (backgroundMusic.paused) {
    await backgroundMusic.play().catch(() => {});
    fadeMusic(musicTarget, 400);
    musicToggle.setAttribute("aria-pressed", "true");
    musicToggle.setAttribute("aria-label", "Pause background music");
  } else {
    backgroundMusic.pause();
    musicToggle.setAttribute("aria-pressed", "false");
    musicToggle.setAttribute("aria-label", "Play background music");
  }
});

const quiz = [
  {
    question: "What did he notice first?",
    options: ["Your voice", "Your smile", "Your calm presence", "All of the above"],
    correct: 3,
    reveal: "There was never just one thing."
  },
  {
    question: "Where is a piece of his heart permanently stuck?",
    options: ["Lumami Tower", "The campus park", "An evening walk", "Somewhere in between"],
    correct: 0,
    reveal: "Lumami Tower—the place where he confessed while apparently shivering. 😂"
  },
  {
    question: "What could he listen to forever?",
    options: ["You singing", "You laughing", "The way you call him", "Honestly, all three"],
    correct: 3,
    reveal: "Your sweet voice, your laugh, and the way you call him. All three."
  },
  {
    question: "Complete the sentence: Sabar ka phal…",
    options: ["mitha hota hae", "Taro hota hae", "always", "comes with a warning"],
    correct: 0,
    reveal: "Mitha hota hae. Some answers were always going to be yours."
  }
];

const quizCounter = document.querySelector("#quizCounter");
const quizProgress = document.querySelector("#quizProgress");
const quizQuestion = document.querySelector("#quizQuestion");
const quizOptions = document.querySelector("#quizOptions");
const quizFeedback = document.querySelector("#quizFeedback");
const quizNext = document.querySelector("#quizNext");
const insideJokes = document.querySelector("#insideJokes");
let quizIndex = 0;
let quizAnswered = false;

function renderQuiz() {
  const current = quiz[quizIndex];
  quizAnswered = false;
  quizCounter.textContent = `${String(quizIndex + 1).padStart(2, "0")} / ${String(quiz.length).padStart(2, "0")}`;
  quizProgress.style.width = `${((quizIndex + 1) / quiz.length) * 100}%`;
  quizQuestion.textContent = current.question;
  quizFeedback.textContent = "";
  quizNext.hidden = true;
  quizNext.innerHTML = quizIndex === quiz.length - 1 ? "See the classified vocabulary <span>→</span>" : "Next question <span>→</span>";
  quizOptions.replaceChildren();

  current.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => answerQuiz(button, index));
    quizOptions.append(button);
  });
}

function answerQuiz(button, index) {
  if (quizAnswered) return;
  const current = quiz[quizIndex];
  if (index !== current.correct) {
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    quizFeedback.textContent = "Close—but not the answer he gave. Try once more.";
    return;
  }

  quizAnswered = true;
  button.classList.add("correct");
  quizFeedback.textContent = current.reveal;
  [...quizOptions.children].forEach(option => { option.disabled = true; });
  quizNext.hidden = false;
}

quizNext.addEventListener("click", () => {
  if (quizIndex < quiz.length - 1) {
    quizIndex += 1;
    renderQuiz();
  } else {
    document.querySelector("#quizMachine").hidden = true;
    insideJokes.hidden = false;
    insideJokes.classList.add("reveal", "visible");
  }
});
renderQuiz();

const duetVideo = document.querySelector("#duetVideo");
const secretVideo = document.querySelector("#secretVideo");

duetVideo.addEventListener("play", () => fadeMusic(0, 500));
duetVideo.addEventListener("pause", () => {
  if (!duetVideo.ended && !backgroundMusic.paused) fadeMusic(musicTarget, 500);
});
duetVideo.addEventListener("ended", () => {
  if (!backgroundMusic.paused) fadeMusic(musicTarget, 800);
});

secretVideo.addEventListener("play", () => {
  duetVideo.pause();
  if (!backgroundMusic.paused) fadeMusic(0.055, 800);
});
secretVideo.addEventListener("pause", () => {
  if (!secretVideo.ended && !backgroundMusic.paused) fadeMusic(0.08, 600);
});
secretVideo.addEventListener("ended", () => {
  if (!backgroundMusic.paused) fadeMusic(0.13, 1000);
  document.querySelector("#finalLetter").open = true;
});

const keypad = document.querySelector("#keypad");
const codeDisplay = document.querySelector("#codeDisplay");
const lockPanel = document.querySelector("#lockPanel");
const lockStatus = document.querySelector("#lockStatus");
const secretReveal = document.querySelector("#secretReveal");
let enteredCode = "";

function renderCode() {
  [...codeDisplay.children].forEach((dot, index) => dot.classList.toggle("filled", index < enteredCode.length));
}

function addDigit(digit) {
  if (enteredCode.length >= 4) return;
  enteredCode += digit;
  renderCode();
  if (enteredCode.length === 4) checkCode();
}

function checkCode() {
  if (enteredCode === "0605") {
    lockStatus.textContent = "That date remembers you too.";
    lockPanel.classList.add("opening");
    setTimeout(() => {
      lockPanel.hidden = true;
      secretReveal.hidden = false;
      secretReveal.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 700);
  } else {
    lockStatus.textContent = "Not this one. Think of the date that belongs to both of you.";
    lockPanel.classList.remove("error");
    void lockPanel.offsetWidth;
    lockPanel.classList.add("error");
    setTimeout(() => {
      enteredCode = "";
      renderCode();
    }, 850);
  }
}

[1,2,3,4,5,6,7,8,9,0].forEach(number => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = number;
  button.setAttribute("aria-label", `Enter ${number}`);
  button.addEventListener("click", () => addDigit(String(number)));
  keypad.append(button);
});

const deleteButton = document.createElement("button");
deleteButton.type = "button";
deleteButton.className = "delete-key";
deleteButton.textContent = "⌫";
deleteButton.setAttribute("aria-label", "Delete last digit");
deleteButton.addEventListener("click", () => {
  enteredCode = enteredCode.slice(0, -1);
  renderCode();
});
keypad.append(deleteButton);

function observeReveals() {
  const items = document.querySelectorAll(".reveal:not(.visible)");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(item => item.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12, rootMargin: "0px 0px -8%" });
  items.forEach(item => observer.observe(item));
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    duetVideo.pause();
    secretVideo.pause();
  }
});
