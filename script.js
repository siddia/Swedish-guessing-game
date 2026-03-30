const TOTAL_ROUNDS = 10;

const startScreen = document.getElementById('startScreen');
const quizScreen = document.getElementById('quizScreen');
const endScreen = document.getElementById('endScreen');

const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');

const scoreChip = document.getElementById('scoreChip');
const roundNumber = document.getElementById('roundNumber');
const difficultyLabel = document.getElementById('difficultyLabel');
const progressBar = document.getElementById('progressBar');
const itemName = document.getElementById('itemName');
const questionText = document.getElementById('questionText');
const answersContainer = document.getElementById('answersContainer');
const feedbackPanel = document.getElementById('feedbackPanel');
const feedbackMessage = document.getElementById('feedbackMessage');
const factText = document.getElementById('factText');

const finalTitle = document.getElementById('finalTitle');
const finalScoreText = document.getElementById('finalScoreText');
const finalMessage = document.getElementById('finalMessage');

let allQuestions = [];
let gameQuestions = [];
let currentIndex = 0;
let score = 0;
let selectedLocked = false;

startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', goToNextRound);
restartBtn.addEventListener('click', startGame);

document.addEventListener('DOMContentLoaded', preloadQuestions);

async function preloadQuestions() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error('Could not load questions.json');
    }
    allQuestions = await response.json();
  } catch (error) {
    console.error(error);
    startBtn.disabled = true;
    startBtn.textContent = 'Could not load quiz';
  }
}

function startGame() {
  if (!allQuestions.length) return;

  score = 0;
  currentIndex = 0;
  selectedLocked = false;

  const sorted = [...allQuestions].sort((a, b) => difficultyWeight(a.difficulty) - difficultyWeight(b.difficulty));
  const easy = shuffle(sorted.filter(q => q.difficulty === 'easy'));
  const medium = shuffle(sorted.filter(q => q.difficulty === 'medium'));
  const hard = shuffle(sorted.filter(q => q.difficulty === 'hard'));

  gameQuestions = [
    ...easy.slice(0, 4),
    ...medium.slice(0, 4),
    ...hard.slice(0, 2)
  ];

  if (gameQuestions.length < TOTAL_ROUNDS) {
    gameQuestions = shuffle([...allQuestions]).slice(0, TOTAL_ROUNDS);
  }

  setActiveScreen('quiz');
  updateScore();
  renderQuestion();
}

function renderQuestion() {
  const currentQuestion = gameQuestions[currentIndex];
  if (!currentQuestion) return;

  selectedLocked = false;
  feedbackPanel.classList.add('hidden');
  feedbackMessage.className = 'feedback-message';
  nextBtn.textContent = currentIndex === TOTAL_ROUNDS - 1 ? 'See Results' : 'Next Round';

  roundNumber.textContent = `${currentIndex + 1}`;
  difficultyLabel.textContent = capitalize(currentQuestion.difficulty);
  progressBar.style.width = `${(currentIndex / TOTAL_ROUNDS) * 100}%`;

  itemName.textContent = currentQuestion.name;
  questionText.textContent = currentQuestion.question;
  factText.textContent = '';

  answersContainer.innerHTML = '';
  shuffle([...currentQuestion.options]).forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'answer-btn';
    button.textContent = option;
    button.addEventListener('click', () => handleAnswer(button, option));
    answersContainer.appendChild(button);
  });
}

function handleAnswer(button, selectedOption) {
  if (selectedLocked) return;
  selectedLocked = true;

  const currentQuestion = gameQuestions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.answer;

  const buttons = [...answersContainer.querySelectorAll('.answer-btn')];
  buttons.forEach(btn => {
    btn.disabled = true;
    const isAnswer = btn.textContent === currentQuestion.answer;
    const isSelected = btn === button;

    if (isAnswer) {
      btn.classList.add('correct');
    } else if (isSelected && !isCorrect) {
      btn.classList.add('incorrect');
    } else {
      btn.classList.add('dimmed');
    }
  });

  if (isCorrect) {
    score += 1;
    updateScore();
    feedbackMessage.textContent = 'Correct! Nicely guessed.';
    feedbackMessage.classList.add('success');
    launchConfetti();
  } else {
    feedbackMessage.textContent = `Not quite. The correct answer was ${currentQuestion.answer}.`;
    feedbackMessage.classList.add('fail');
  }

  factText.textContent = currentQuestion.fact;
  feedbackPanel.classList.remove('hidden');
  progressBar.style.width = `${((currentIndex + 1) / TOTAL_ROUNDS) * 100}%`;
}

function goToNextRound() {
  currentIndex += 1;

  if (currentIndex >= TOTAL_ROUNDS) {
    showResults();
    return;
  }

  renderQuestion();
}

function showResults() {
  setActiveScreen('end');
  scoreChip.textContent = `Final Score: ${score}`;
  finalScoreText.textContent = `You scored ${score} out of ${TOTAL_ROUNDS}.`;

  if (score <= 3) {
    finalTitle.textContent = 'Bold guesses. Chaotic confidence.';
    finalMessage.textContent = 'You may not have won the flat-pack crown today, but you absolutely brought the energy.';
  } else if (score <= 6) {
    finalTitle.textContent = 'Part-time Swedish name detective.';
    finalMessage.textContent = 'A respectable run. You clearly know a few things about stylish storage and suspiciously fancy lamps.';
  } else if (score <= 8) {
    finalTitle.textContent = 'Strong Scandinavian instincts.';
    finalMessage.textContent = 'Very solid. You are one good shelf away from expert status.';
  } else {
    finalTitle.textContent = 'Flat-pack royalty unlocked.';
    finalMessage.textContent = 'Impressive. You have elite-level Swedish item intuition and probably deserve a victory cinnamon bun.';
  }
}

function updateScore() {
  scoreChip.textContent = `Score: ${score}`;
}

function setActiveScreen(screen) {
  const isStart = screen === 'start';
  const isQuiz = screen === 'quiz';
  const isEnd = screen === 'end';

  startScreen.classList.toggle('active', isStart);
  quizScreen.classList.toggle('active', isQuiz);
  endScreen.classList.toggle('active', isEnd);

  startScreen.setAttribute('aria-hidden', String(!isStart));
  quizScreen.setAttribute('aria-hidden', String(!isQuiz));
  endScreen.setAttribute('aria-hidden', String(!isEnd));
}

function difficultyWeight(level) {
  return { easy: 1, medium: 2, hard: 3 }[level] ?? 2;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function launchConfetti() {
  const colors = ['#4f7cff', '#ff8f5a', '#ffd95a', '#25b46b', '#f15b6c'];
  const launchers = [
    { x: '22px', y: '24px', direction: 1 },
    { x: '50vw', y: '24px', direction: Math.random() > 0.5 ? 1 : -1 },
    { x: 'calc(100vw - 22px)', y: '24px', direction: -1 }
  ];

  for (let i = 0; i < 210; i += 1) {
    const piece = document.createElement('span');
    const launcher = launchers[i % launchers.length];
    const horizontalDrift = (135 + Math.random() * 320) * launcher.direction;
    const verticalTravel = -(250 + Math.random() * 380);
    const spin = `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540)}deg`;

    piece.className = 'confetti-piece';
    piece.style.left = launcher.x;
    piece.style.bottom = launcher.y;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${8 + Math.random() * 6}px`;
    piece.style.height = `${14 + Math.random() * 12}px`;
    piece.style.animationDuration = `${0.95 + Math.random() * 0.55}s`;
    piece.style.animationDelay = `${Math.random() * 0.08}s`;
    piece.style.setProperty('--travel-x', `${horizontalDrift}px`);
    piece.style.setProperty('--travel-y', `${verticalTravel}px`);
    piece.style.setProperty('--spin', spin);
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(piece);

    setTimeout(() => {
      piece.remove();
    }, 2200);
  }
}
