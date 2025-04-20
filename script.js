let stepCount = 0;
let lastAccel = { x: 0, y: 0, z: 0 };
let threshold = 12;
let activeSeconds = 0;
let lastStepTime = null;

window.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadSteps();
  document.getElementById('darkModeToggle').addEventListener('change', toggleDarkMode);
  drawChart();
  initTabs();
  startTracking();
  scheduleMidnightReset();
});

function startTracking() {
  if (typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission().then(state => {
      if (state === 'granted') {
        window.addEventListener('devicemotion', motionHandler);
      }
    });
  } else {
    window.addEventListener('devicemotion', motionHandler);
  }
}

function motionHandler(event) {
  const acc = event.accelerationIncludingGravity;
  const delta = Math.abs(acc.x - lastAccel.x) + Math.abs(acc.y - lastAccel.y) + Math.abs(acc.z - lastAccel.z);

  // Detect step movement
  if (delta > threshold) {
    stepCount++;
    updateSteps();
  }

  lastAccel = { x: acc.x, y: acc.y, z: acc.z };
}

function updateSteps() {
  const calories = (stepCount * 0.05).toFixed(2); // Each step burns 0.05 calories
  const distance = (stepCount * 0.8 / 1000).toFixed(2); // 0.8 meters per step

  // Update active walking time
  const now = Date.now();
  if (!lastStepTime || now - lastStepTime > 2000) {
    activeSeconds += 1; // Increment every 1 second of walking detected
  }
  lastStepTime = now;

  const activeMinutes = Math.floor(activeSeconds / 60);
  const remainingSeconds = activeSeconds % 60;
  const timeString = `${activeMinutes}m ${remainingSeconds}s`;

  // Update the displayed data
  document.getElementById('stepCount').innerText = stepCount;
  document.getElementById('calories').innerText = calories;
  document.getElementById('distance').innerText = distance;
  document.getElementById('time').innerText = timeString;

  updateProgressBar();
  updateMotivation();
  updateBadges();

  // Save to localStorage
  localStorage.setItem('currentSteps', stepCount);
  localStorage.setItem('activeSeconds', activeSeconds);
}

function resetSteps() {
  const date = new Date().toLocaleDateString();
  const stepHistory = JSON.parse(localStorage.getItem('stepHistory') || '[]');
  stepHistory.unshift({ date, steps: stepCount });

  localStorage.setItem('stepHistory', JSON.stringify(stepHistory));

  stepCount = 0;
  activeSeconds = 0;
  updateSteps();
  renderHistory();
  drawChart();
}

function scheduleMidnightReset() {
  const now = new Date();
  const millisUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

  setTimeout(() => {
    resetSteps();
    scheduleMidnightReset();
  }, millisUntilMidnight);
}

function setGoal() {
  const input = document.getElementById('goalInput').value;
  if (input && input > 0) {
    const goal = parseInt(input);
    document.getElementById('goal').innerText = goal;
    localStorage.setItem('stepGoal', goal);
    updateProgressBar();
  }
}

function updateProgressBar() {
  let percent = Math.min((stepCount / goal) * 100, 100);
  document.getElementById('progressFill').style.width = percent + "%";
}

function updateMotivation() {
  let msg = "";
  const pct = (stepCount / goal) * 100;
  if (pct >= 100) msg = "Goal achieved!";
  else if (pct >= 75) msg = "Almost there!";
  else if (pct >= 50) msg = "Halfway to your goal!";
  else if (pct >= 25) msg = "Great start! Keep going!";
  document.getElementById('motivation').innerText = msg;
}

function updateBadges() {
  let badges = "";
  if (stepCount >= 1000) badges += "✨ 1K Steps Badge! ";
  if (stepCount >= 5000) badges += "✨ 5K Steps Master! ";
  if (stepCount >= 10000) badges += "✨ 10K Pro Walker!";
  document.getElementById('badges').innerText = badges;
}

function toggleDarkMode(e) {
  document.body.classList.toggle('dark', e.target.checked);
  localStorage.setItem('darkMode', e.target.checked);
}

function loadSettings() {
  const savedGoal = localStorage.getItem('stepGoal');
  if (savedGoal) goal = parseInt(savedGoal);
  document.getElementById('goal').innerText = goal;

  const dark = localStorage.getItem('darkMode');
  if (dark === 'true') {
    document.body.classList.add('dark');
    document.getElementById('darkModeToggle').checked = true;
  }

  const history = JSON.parse(localStorage.getItem('stepHistory') || '[]');
  stepHistory = history;
  renderHistory();
  drawChart();
}

function loadSteps() {
  const savedSteps = localStorage.getItem('currentSteps');
  if (savedSteps) stepCount = parseInt(savedSteps);

  const savedTime = localStorage.getItem('activeSeconds');
  if (savedTime) activeSeconds = parseInt(savedTime);

  updateSteps();
}

function renderHistory() {
  const list = document.getElementById('stepHistory');
  list.innerHTML = '';
  stepHistory.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.date}: ${item.steps} steps`;
    list.appendChild(li);
  });
}

function exportCSV() {
  let csv = "Date,Steps\n";
  stepHistory.forEach(h => {
    csv += `${h.date},${h.steps}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'step_history.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function drawChart() {
  const ctx = document.getElementById('stepChart').getContext('2d');
  const labels = stepHistory.map(h => h.date);
  const data = stepHistory.map(h => h.steps);
  if (window.myChart) window.myChart.destroy();
  window.myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Steps',
        data: data,
        backgroundColor: 'rgba(76, 175, 80, 0.6)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function initTabs() {
  const select = document.getElementById("infoSelect");
  const panels = document.querySelectorAll(".tab-panel");

  select.addEventListener("change", () => {
    const target = select.value;
    panels.forEach(panel => {
      panel.style.display = panel.id === target ? "block" : "none";
    });
  });

  panels.forEach(panel => {
    panel.style.display = panel.id === select.value ? "block" : "none";
  });
}
