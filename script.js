// =========================================
// Налаштування
// =========================================

const TOTAL_BUDGET = 50000;

const CATEGORIES = [
  "Продукти та товари",
  "Побачення",
  "Гроші Чоловіка",
  "Гроші Дружини",
  "Машина",
  "Квартира",
  "Десятина",
  "Медицина",
  "Подорожі",
  "Несподівані витрати",
  "Скарбничка",
];

const STORAGE_KEY = "kislenko_budget_v3";

// =========================================
// DOM
// =========================================

const categoriesGrid = document.getElementById("categoriesGrid");
const categorySelect = document.getElementById("categorySelect");
const amountInput = document.getElementById("amountInput");
const noteInput = document.getElementById("noteInput");
const expenseForm = document.getElementById("expenseForm");
const historyList = document.getElementById("historyList");
const lastSync = document.getElementById("last-sync");
const resetBtn = document.getElementById("resetBtn");
const showAllBtn = document.getElementById("showAllBtn");

const totalSpentElement = document.getElementById("totalSpent");
const moneyLeftElement = document.getElementById("moneyLeft");
const totalProgressElement = document.getElementById("totalProgress");

// Popup

const categoryModal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const modalSummary = document.getElementById("modalSummary");
const modalHistory = document.getElementById("modalHistory");
const closeModal = document.getElementById("closeModal");

// =========================================
// State
// =========================================

let showingAll = false;
let currentCategory = null;

// =========================================
// LocalStorage
// =========================================

function loadState() {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {

        const init = {

            totals: {},

            history: [],

            updatedAt: new Date().toISOString()

        };

        CATEGORIES.forEach(category => {

            init.totals[category] = 0;

        });

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(init)
        );

        return init;
    }

    try {

        const state = JSON.parse(raw);

        // якщо додались нові категорії

        CATEGORIES.forEach(category => {

            if (!(category in state.totals)) {

                state.totals[category] = 0;

            }

        });

        return state;

    } catch {

        localStorage.removeItem(STORAGE_KEY);

        return loadState();

    }

}

function saveState(state) {

    state.updatedAt = new Date().toISOString();

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
    );

    render();

}

// =========================================
// Загальний бюджет
// =========================================

function renderBudget(totals) {

    const totalSpent = Object.values(totals)
        .reduce((sum, value) => sum + Number(value), 0);

    const left = TOTAL_BUDGET - totalSpent;

    totalSpentElement.textContent =
        `${totalSpent.toFixed(2)} ₴`;

    moneyLeftElement.textContent =
        `${left.toFixed(2)} ₴`;

    const percent =
        Math.min((totalSpent / TOTAL_BUDGET) * 100, 100);

    totalProgressElement.style.width =
        percent + "%";

    if (percent < 70) {

        totalProgressElement.style.background =
            "#48bb78";

    }

    else if (percent < 90) {

        totalProgressElement.style.background =
            "#ecc94b";

    }

    else {

        totalProgressElement.style.background =
            "#f56565";

    }

}

// =========================================
// Категорії
// =========================================

function renderCategories(totals) {

    categoriesGrid.innerHTML = "";

    categorySelect.innerHTML =
        '<option value="">Оберіть категорію</option>';

    CATEGORIES.forEach(category => {

        const spent =
            Number(totals[category] || 0);

        const card =
            document.createElement("div");

        card.className = "card";

        card.style.cursor = "pointer";

        card.innerHTML = `

            <div class="category-name">

                ${category}

            </div>

            <div class="amount">

                ${spent.toFixed(2)} ₴

            </div>

        `;

        // відкриття popup

        card.addEventListener("click", () => {

            openCategory(category);

        });

        categoriesGrid.appendChild(card);

        const option =
            document.createElement("option");

        option.value = category;

        option.textContent = category;

        categorySelect.appendChild(option);

    });

}

// =========================================
// Історія
// =========================================

function renderHistory(history) {

    historyList.innerHTML = "";

    const items = showingAll
        ? history.slice().reverse()
        : history.slice().reverse().slice(0, 10);

    if (items.length === 0) {

        historyList.innerHTML =
            '<div class="small">Поки що немає витрат</div>';

        return;

    }

    items.forEach(item => {

        const div =
            document.createElement("div");

        div.className = "hist-item";

        const date =
            new Date(item.at);

        div.textContent =
            `${date.toLocaleString()} — ${item.category} • ${Number(item.amount).toFixed(2)} ₴ ${item.note ? "• " + item.note : ""}`;

        historyList.appendChild(div);

    });

    showAllBtn.textContent =
        showingAll
            ? "Показати останні 10"
            : "Показати всю історію";

}

// =========================================
// Загальний render
// =========================================

function render() {

    const state =
        loadState();

    renderBudget(state.totals);

    renderCategories(state.totals);

    renderHistory(state.history);

    lastSync.textContent =
        new Date(state.updatedAt)
            .toLocaleString();

}

// =========================================
// Popup категорії
// =========================================

function openCategory(category) {

    currentCategory = category;

    const state = loadState();

    const history = state.history.filter(item =>
        item.category === category
    );

    const total = history.reduce((sum, item) =>
        sum + Number(item.amount), 0);

    modalTitle.textContent = category;

    modalSummary.innerHTML = `
        <div class="modal-total">
            Загальна сума:
            <strong>${total.toFixed(2)} ₴</strong>
        </div>
    `;

    modalHistory.innerHTML = "";

    if (history.length === 0) {

        modalHistory.innerHTML =
            `<div class="small">У цій категорії ще немає витрат.</div>`;

    } else {

        history
            .slice()
            .reverse()
            .forEach(item => {

                const div =
                    document.createElement("div");

                div.className = "hist-item";

                const date =
                    new Date(item.at);

                div.innerHTML = `
                    <strong>${Number(item.amount).toFixed(2)} ₴</strong><br>
                    ${date.toLocaleString()}<br>
                    ${item.note ? item.note : ""}
                `;

                modalHistory.appendChild(div);

            });

    }

    categoryModal.classList.add("show");

}

// =========================================
// Закриття popup
// =========================================

closeModal.addEventListener("click", () => {

    categoryModal.classList.remove("show");

});

categoryModal.addEventListener("click", (e) => {

    if (e.target === categoryModal) {

        categoryModal.classList.remove("show");

    }

});

// =========================================
// Додавання витрати
// =========================================

expenseForm.addEventListener("submit", (e) => {

    e.preventDefault();

    const category =
        categorySelect.value;

    const amount =
        parseFloat(amountInput.value);

    if (!category) {

        alert("Оберіть категорію");

        return;

    }

    if (isNaN(amount) || amount <= 0) {

        alert("Введіть правильну суму");

        return;

    }

    const state =
        loadState();

    state.totals[category] += amount;

    state.history.push({

        category,

        amount,

        note: noteInput.value.trim(),

        at: new Date().toISOString()

    });

    saveState(state);

    amountInput.value = "";

    noteInput.value = "";

    categorySelect.value = "";

});

// =========================================
// Історія
// =========================================

showAllBtn.addEventListener("click", () => {

    showingAll = !showingAll;

    render();

});

// =========================================
// Скидання LocalStorage
// =========================================

resetBtn.addEventListener("click", () => {

    const answer =
        confirm("Видалити всі дані?");

    if (!answer) return;

    localStorage.removeItem(STORAGE_KEY);

    render();

});

// =========================================
// Перший запуск
// =========================================

render();