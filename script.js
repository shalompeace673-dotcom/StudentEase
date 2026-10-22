const $ = id => document.getElementById(id);

const authScreen = $("authScreen");
const app = $("app");

const pageDetails = {
    dashboard: ["Dashboard", "Organise your studies and achieve your goals."],
    assignments: ["Assignments", "Manage your coursework and deadlines."],
    planner: ["Daily Planner", "Organise your day, one activity at a time."],
    todos: ["To-Do List", "Keep track of your tasks."],
    reminders: ["Reminders & Deadlines", "Keep important dates in sight."],
    timer: ["Study Timer", "Focus on your studies and take breaks."]
};

let timerSeconds = 25 * 60;
let timerInterval = null;

// AUTHENTICATION

function showSignup() {
    $("loginForm").classList.add("hidden");
    $("signupForm").classList.remove("hidden");
}

function showLogin() {
    $("signupForm").classList.add("hidden");
    $("loginForm").classList.remove("hidden");
}

$("showSignupButton").addEventListener("click", showSignup);
$("showLoginButton").addEventListener("click", showLogin);

$("signupForm").addEventListener("submit", event => {
    event.preventDefault();

    const name = $("signupName").value.trim();
    const email = $("signupEmail").value.trim().toLowerCase();
    const password = $("signupPassword").value;

    if (!name || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    const users = JSON.parse(
        localStorage.getItem("studentEaseUsers") || "{}"
    );

    if (users[email]) {
        alert("This email is already registered. Please log in.");
        showLogin();
        $("loginEmail").value = email;
        return;
    }

    users[email] = { name, password };

    localStorage.setItem("studentEaseUsers", JSON.stringify(users));

    $("loginEmail").value = email;
    $("loginPassword").value = "";
    $("signupPassword").value = "";

    showLogin();

    alert("Account created successfully! Please log in.");
});

$("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const email = $("loginEmail").value.trim().toLowerCase();
    const password = $("loginPassword").value;

    const users = JSON.parse(
        localStorage.getItem("studentEaseUsers") || "{}"
    );

    const user = users[email];

    if (!user || user.password !== password) {
        alert("Incorrect email or password. Please sign up first.");
        return;
    }

    localStorage.setItem("studentEaseCurrentUser", email);
    openApp(user.name);
});

$("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("studentEaseCurrentUser");

    app.classList.add("hidden");
    authScreen.classList.remove("hidden");

    $("loginPassword").value = "";
    showLogin();
});

function openApp(name) {
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");

    $("userName").textContent = name;

    renderAll();
    showPage("dashboard");
}

// DATA STORAGE

function getCurrentEmail() {
    return localStorage.getItem("studentEaseCurrentUser");
}

function getData(key) {
    const email = getCurrentEmail();

    if (!email) return [];

    try {
        return JSON.parse(
            localStorage.getItem(`studentEase_${email}_${key}`) || "[]"
        );
    } catch (error) {
        console.error("Could not read saved data:", error);
        return [];
    }
}

function saveData(key, data) {
    const email = getCurrentEmail();

    if (!email) return;

    localStorage.setItem(
        `studentEase_${email}_${key}`,
        JSON.stringify(data)
    );
}

// NAVIGATION

function showPage(pageId) {
    if (!pageDetails[pageId]) return;

    document.querySelectorAll(".page").forEach(page => {
        page.classList.add("hidden");
    });

    $(pageId).classList.remove("hidden");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === pageId);
    });

    $("pageTitle").textContent = pageDetails[pageId][0];
    $("pageSubtitle").textContent = pageDetails[pageId][1];
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => showPage(link.dataset.page));
});

// FORM HELPERS

document.querySelectorAll("[data-open]").forEach(button => {
    button.addEventListener("click", () => {
        $(button.dataset.open).classList.remove("hidden");
    });
});

document.querySelectorAll("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
        const form = $(button.dataset.close);
        form.reset();
        form.classList.add("hidden");
    });
});

function makeId() {
    return Date.now().toString() + Math.random().toString(36).slice(2);
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(value) {
    if (!value) return "No date set";

    const date = new Date(value + (value.length === 10 ? "T12:00:00" : ""));

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString([], {
        dateStyle: "medium",
        ...(value.includes("T") ? { timeStyle: "short" } : {})
    });
}

function emptyMessage(message) {
    return `<p class="empty-message">${escapeHTML(message)}</p>`;
}

function listItem(title, detail, actions = "", status = "") {
    return `
        <div class="list-item">
            <div class="item-info">
                <strong>${escapeHTML(title)}</strong>
                <small>${escapeHTML(detail)}</small>
            </div>
            <div class="item-actions">
                ${status}
                ${actions}
            </div>
        </div>
    `;
}

// ASSIGNMENTS

$("assignmentForm").addEventListener("submit", event => {
    event.preventDefault();

    const items = getData("assignments");

    items.push({
        id: makeId(),
        title: $("assignmentTitle").value.trim(),
        course: $("courseCode").value.trim(),
        due: $("assignmentDue").value,
        description: $("assignmentDescription").value.trim(),
        completed: false
    });

    saveData("assignments", items);

    event.target.reset();
    event.target.classList.add("hidden");

    renderAll();
});

function toggleAssignment(id) {
    const items = getData("assignments");
    const item = items.find(item => item.id === id);

    if (item) item.completed = !item.completed;

    saveData("assignments", items);
    renderAll();
}

function deleteAssignment(id) {
    if (!confirm("Delete this assignment?")) return;

    saveData(
        "assignments",
        getData("assignments").filter(item => item.id !== id)
    );

    renderAll();
}

function renderAssignments() {
    const items = getData("assignments");

    $("assignmentList").innerHTML = items.map(item => listItem(
        item.title,
        `${item.course} · Due ${formatDate(item.due)}`,
        `<button data-action="toggleAssignment" data-id="${item.id}">${item.completed ? "Undo" : "Done"}</button>
         <button class="delete-btn" data-action="deleteAssignment" data-id="${item.id}">Delete</button>`,
        `<span class="status ${item.completed ? "done" : ""}">${item.completed ? "Completed" : "Pending"}</span>`
    )).join("") || emptyMessage("No assignments yet.");

    $("dashboardAssignments").innerHTML = items.slice(0, 4).map(item =>
        listItem(
            item.title,
            `${item.course} · ${formatDate(item.due)}`,
            "",
            `<span class="status ${item.completed ? "done" : ""}">${item.completed ? "Done" : "Pending"}</span>`
        )
    ).join("") || emptyMessage("No assignments added yet.");
}

// DAILY PLANNER

$("plannerForm").addEventListener("submit", event => {
    event.preventDefault();

    const items = getData("planner");

    items.push({
        id: makeId(),
        title: $("activityTitle").value.trim(),
        date: $("activityDate").value,
        time: $("activityTime").value
    });

    saveData("planner", items);

    event.target.reset();
    event.target.classList.add("hidden");

    renderAll();
});

function deleteActivity(id) {
    saveData(
        "planner",
        getData("planner").filter(item => item.id !== id)
    );

    renderAll();
}

function renderPlanner() {
    const items = getData("planner").sort((a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time)
    );

    $("plannerList").innerHTML = items.map(item => listItem(
        item.title,
        `${formatDate(item.date)} · ${item.time}`,
        `<button class="delete-btn" data-action="deleteActivity" data-id="${item.id}">Delete</button>`
    )).join("") || emptyMessage("No activities scheduled yet.");

    const today = new Date();
    const localToday = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    $("dashboardPlanner").innerHTML = items
        .filter(item => item.date === localToday)
        .map(item => listItem(item.title, item.time))
        .join("") || emptyMessage("Nothing planned for today.");
}

// TO-DO LIST

$("todoForm").addEventListener("submit", event => {
    event.preventDefault();

    const items = getData("todos");

    items.push({
        id: makeId(),
        title: $("todoTitle").value.trim(),
        due: $("todoDue").value,
        completed: false
    });

    saveData("todos", items);

    event.target.reset();
    event.target.classList.add("hidden");

    renderAll();
});

function toggleTodo(id) {
    const items = getData("todos");
    const item = items.find(item => item.id === id);

    if (item) item.completed = !item.completed;

    saveData("todos", items);
    renderAll();
}

function deleteTodo(id) {
    saveData(
        "todos",
        getData("todos").filter(item => item.id !== id)
    );

    renderAll();
}

function renderTodos() {
    const items = getData("todos");

    $("todoList").innerHTML = items.map(item => `
        <div class="list-item">
            <input class="task-check" type="checkbox"
                data-action="toggleTodo"
                data-id="${item.id}"
                ${item.completed ? "checked" : ""}>

            <div class="item-info">
                <strong style="${item.completed ? "text-decoration:line-through;color:#64748b" : ""}">
                    ${escapeHTML(item.title)}
                </strong>
                <small>${item.due ? "Due " + escapeHTML(formatDate(item.due)) : "No deadline"}</small>
            </div>

            <div class="item-actions">
                <button class="delete-btn" data-action="deleteTodo" data-id="${item.id}">Delete</button>
            </div>
        </div>
    `).join("") || emptyMessage("Your to-do list is empty.");

    $("dashboardTodos").innerHTML = items
        .filter(item => !item.completed)
        .slice(0, 4)
        .map(item => `
            <div class="list-item">
                <div class="item-info">
                    <strong>${escapeHTML(item.title)}</strong>
                </div>
                <input class="task-check" type="checkbox"
                    data-action="toggleTodo" data-id="${item.id}">
            </div>
        `).join("") || emptyMessage("No pending tasks.");
}

// REMINDERS

$("reminderForm").addEventListener("submit", event => {
    event.preventDefault();

    const items = getData("reminders");

    items.push({
        id: makeId(),
        title: $("reminderTitle").value.trim(),
        date: $("reminderDate").value
    });

    saveData("reminders", items);

    event.target.reset();
    event.target.classList.add("hidden");

    renderAll();
});

function deleteReminder(id) {
    saveData(
        "reminders",
        getData("reminders").filter(item => item.id !== id)
    );

    renderAll();
}

function renderReminders() {
    const items = getData("reminders").sort((a, b) =>
        a.date.localeCompare(b.date)
    );

    $("reminderList").innerHTML = items.map(item => listItem(
        item.title,
        formatDate(item.date),
        `<button class="delete-btn" data-action="deleteReminder" data-id="${item.id}">Delete</button>`
    )).join("") || emptyMessage("No reminders yet.");

    $("dashboardReminders").innerHTML = items.slice(0, 4).map(item =>
        listItem(item.title, formatDate(item.date))
    ).join("") || emptyMessage("No upcoming reminders.");
}

// BUTTON ACTIONS

document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    switch (button.dataset.action) {
        case "toggleAssignment":
            toggleAssignment(id);
            break;
        case "deleteAssignment":
            deleteAssignment(id);
            break;
        case "deleteActivity":
            deleteActivity(id);
            break;
        case "toggleTodo":
            toggleTodo(id);
            break;
        case "deleteTodo":
            deleteTodo(id);
            break;
        case "deleteReminder":
            deleteReminder(id);
            break;
    }
});

document.addEventListener("change", event => {
    const input = event.target.closest('[data-action="toggleTodo"]');

    if (!input) return;

    toggleTodo(input.dataset.id);
});

// DASHBOARD

function renderDashboard() {
    const assignments = getData("assignments");
    const todos = getData("todos");
    const reminders = getData("reminders");

    const allTasks = [...assignments, ...todos];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingAssignments = assignments.filter(item => {
        if (item.completed || !item.due) return false;

        const due = new Date(item.due + "T00:00:00");
        return due >= today;
    });

    const upcomingReminders = reminders.filter(item => {
        if (!item.date) return false;

        const due = new Date(item.date + "T00:00:00");
        return due >= today;
    });

    $("totalAssignments").textContent = assignments.length;

    $("pendingTasks").textContent =
        allTasks.filter(item => !item.completed).length;

    $("completedTasks").textContent =
        allTasks.filter(item => item.completed).length;

    $("upcomingDeadlines").textContent =
        upcomingAssignments.length + upcomingReminders.length;
}

function renderAll() {
    renderAssignments();
    renderPlanner();
    renderTodos();
    renderReminders();
    renderDashboard();
}

// STUDY TIMER=

function updateTimerDisplay() {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    $("timerDisplay").textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setTimer(minutes) {
    clearInterval(timerInterval);
    timerInterval = null;

    timerSeconds = minutes * 60;
    $("timerStart").textContent = "Start";

    updateTimerDisplay();
}

document.querySelectorAll("[data-minutes]").forEach(button => {
    button.addEventListener("click", () => {
        setTimer(Number(button.dataset.minutes));
    });
});

$("timerStart").addEventListener("click", () => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        $("timerStart").textContent = "Resume";
        return;
    }

    if (timerSeconds <= 0) {
        timerSeconds = 25 * 60;
    }

    $("timerStart").textContent = "Pause";

    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();

        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;

            $("timerStart").textContent = "Start";

            alert("Study session complete! Take a break.");
        }
    }, 1000);
});

$("timerReset").addEventListener("click", () => {
    setTimer(25);
});


function startApp() {
    const savedEmail = localStorage.getItem("studentEaseCurrentUser");
    const users = JSON.parse(
        localStorage.getItem("studentEaseUsers") || "{}"
    );

    if (savedEmail && users[savedEmail]) {
        openApp(users[savedEmail].name);
    } else {
        app.classList.add("hidden");
        authScreen.classList.remove("hidden");
        showLogin();
    }

    updateTimerDisplay();
}

startApp();