const STORAGE_KEY = 'regime-tracker-v1';

const state = {
  data: loadData(),
  selectedDate: toDateInputValue(new Date())
};

const selectedDateEl = document.getElementById('selectedDate');
const todayBtn = document.getElementById('todayBtn');
const summaryCards = document.getElementById('summaryCards');
const nutritionSummary = document.getElementById('nutritionSummary');
const foodForm = document.getElementById('foodForm');
const sportForm = document.getElementById('sportForm');
const weightForm = document.getElementById('weightForm');
const foodList = document.getElementById('foodList');
const sportList = document.getElementById('sportList');
const weightDisplay = document.getElementById('weightDisplay');
const historyList = document.getElementById('historyList');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');
const resetBtn = document.getElementById('resetBtn');
const template = document.getElementById('entryTemplate');

selectedDateEl.value = state.selectedDate;
ensureDayExists(state.selectedDate);
render();
registerServiceWorker();

selectedDateEl.addEventListener('change', () => {
  state.selectedDate = selectedDateEl.value;
  ensureDayExists(state.selectedDate);
  saveData();
  render();
});

todayBtn.addEventListener('click', () => {
  state.selectedDate = toDateInputValue(new Date());
  selectedDateEl.value = state.selectedDate;
  ensureDayExists(state.selectedDate);
  render();
});

foodForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const food = {
    id: crypto.randomUUID(),
    name: document.getElementById('foodName').value.trim(),
    quantity: document.getElementById('foodQty').value.trim(),
    calories: Number(document.getElementById('foodCalories').value || 0)
  };
  if (!food.name || !food.quantity || food.calories < 0) return;
  getDay(state.selectedDate).foods.unshift(food);
  foodForm.reset();
  saveData();
  render();
});

sportForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const sport = {
    id: crypto.randomUUID(),
    name: document.getElementById('sportName').value.trim(),
    duration: document.getElementById('sportDuration').value.trim(),
    calories: Number(document.getElementById('sportCalories').value || 0)
  };
  if (!sport.name || !sport.duration || sport.calories < 0) return;
  getDay(state.selectedDate).sports.unshift(sport);
  sportForm.reset();
  saveData();
  render();
});

weightForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = Number(document.getElementById('weightValue').value || 0);
  if (value <= 0) return;
  getDay(state.selectedDate).weight = value;
  weightForm.reset();
  saveData();
  render();
});

exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mon-regime-${state.selectedDate}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!imported || typeof imported !== 'object' || !imported.days) throw new Error('Format invalide');
    state.data = imported;
    ensureDayExists(state.selectedDate);
    saveData();
    render();
    alert('Importation réussie.');
  } catch {
    alert('Impossible d’importer ce fichier JSON.');
  } finally {
    importInput.value = '';
  }
});

resetBtn.addEventListener('click', () => {
  if (!confirm('Supprimer toutes les données enregistrées ?')) return;
  state.data = { days: {} };
  ensureDayExists(state.selectedDate);
  saveData();
  render();
});

function render() {
  const day = getDay(state.selectedDate);
  const caloriesIn = totalCalories(day.foods);
  const caloriesOut = totalCalories(day.sports);
  const balance = caloriesIn - caloriesOut;

  renderSummary(caloriesIn, caloriesOut, balance, day.weight);
  renderEntries(foodList, day.foods, (item) => `${escapeHtml(item.name)} — ${escapeHtml(item.quantity)} · <strong>${item.calories} kcal</strong>`, 'Aucun aliment enregistré.', 'foods');
  renderEntries(sportList, day.sports, (item) => `${escapeHtml(item.name)} — ${escapeHtml(item.duration)} · <strong>${item.calories} kcal</strong>`, 'Aucune activité enregistrée.', 'sports');
  weightDisplay.innerHTML = day.weight ? `Poids enregistré : <strong>${day.weight.toFixed(1)} kg</strong>` : 'Aucun poids enregistré.';
  renderHistory();
}

function renderSummary(caloriesIn, caloriesOut, balance, weight) {
  const cards = [
    { label: 'Calories consommées', value: `${caloriesIn} kcal` },
    { label: 'Calories dépensées', value: `${caloriesOut} kcal` },
    { label: 'Bilan net', value: `${balance} kcal` },
    { label: 'Poids', value: weight ? `${weight.toFixed(1)} kg` : '—' }
  ];

  summaryCards.innerHTML = cards.map(card => `
    <div class="summary-card">
      <div class="label">${card.label}</div>
      <div class="value">${card.value}</div>
    </div>
  `).join('');

  let message = 'Journée à compléter.';
  if (caloriesIn === 0 && caloriesOut === 0) {
    message = 'Aucune donnée aujourd’hui. Commence par ajouter un aliment, une activité et ton poids.';
  } else if (balance < 0) {
    message = 'Bilan nutritionnel : tu as dépensé plus de calories que tu n’en as consommé. Vérifie que cela reste adapté à ton objectif.';
  } else if (balance <= 400) {
    message = 'Bilan nutritionnel : journée plutôt équilibrée. Continue à surveiller la qualité des aliments et la régularité du sport.';
  } else {
    message = 'Bilan nutritionnel : apport calorique assez élevé aujourd’hui. Le suivi des portions peut aider à mieux stabiliser la journée.';
  }
  nutritionSummary.textContent = message;
}

function renderEntries(container, items, formatter, emptyText, bucketName) {
  if (!items.length) {
    container.className = 'entry-list empty-state';
    container.textContent = emptyText;
    return;
  }
  container.className = 'entry-list';
  container.innerHTML = '';
  items.forEach(item => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('.entry-text').innerHTML = formatter(item);
    node.querySelector('.delete-btn').addEventListener('click', () => {
      const bucket = getDay(state.selectedDate)[bucketName];
      getDay(state.selectedDate)[bucketName] = bucket.filter(entry => entry.id !== item.id);
      saveData();
      render();
    });
    container.appendChild(node);
  });
}

function renderHistory() {
  const days = Object.entries(state.data.days)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7);

  if (!days.length) {
    historyList.className = 'history-list empty-state';
    historyList.textContent = 'Aucune donnée enregistrée.';
    return;
  }

  historyList.className = 'history-list';
  historyList.innerHTML = days.map(([date, day]) => {
    const inTotal = totalCalories(day.foods);
    const outTotal = totalCalories(day.sports);
    return `
      <div class="history-item">
        <div>
          <div class="history-date">${formatDate(date)}</div>
          <div class="history-meta">${day.foods.length} aliment(s) · ${day.sports.length} activité(s) · Poids : ${day.weight ? `${day.weight.toFixed(1)} kg` : '—'}</div>
        </div>
        <div class="history-meta">${inTotal} / ${outTotal} kcal</div>
      </div>
    `;
  }).join('');
}

function getDay(date) {
  return state.data.days[date];
}

function ensureDayExists(date) {
  state.data.days[date] ??= { foods: [], sports: [], weight: null };
}

function totalCalories(items) {
  return items.reduce((sum, item) => sum + Number(item.calories || 0), 0);
}

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { days: {} };
  } catch {
    return { days: {} };
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function toDateInputValue(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}
