document.addEventListener("DOMContentLoaded", function () {
  const apps = {
    water: new Tracker("water", "ml"),
    protein: new Tracker("protein", "g")
  };

  let currentApp = "water";

  function switchApp(app) {
    document.getElementById(`${currentApp}-app`).classList.remove("active");
    document.getElementById(`${app}-app`).classList.add("active");
    document.getElementById(`${currentApp}-tab-btn`).classList.remove("active");
    document.getElementById(`${app}-tab-btn`).classList.add("active");
    currentApp = app;
  }

  document.getElementById("water-tab-btn").addEventListener("click", () => switchApp("water"));
  document.getElementById("protein-tab-btn").addEventListener("click", () => switchApp("protein"));

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }

  // OneSignal Test Notifications
  document.getElementById('water-test-notification').addEventListener('click', async () => {
    const playerId = localStorage.getItem("playerID");
    if (!playerId) {
      alert("Player ID not available. Make sure notifications are enabled.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("It's working", {
        body: "This is a test push from OneSignal.",
        icon: "icon.png"
      });
    }
  });

  document.getElementById('protein-test-notification').addEventListener('click', async () => {
    const playerId = localStorage.getItem("playerID");
    if (!playerId) {
      alert("Player ID not available. Make sure notifications are enabled.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification("It's working", {
        body: "This is a test push from OneSignal.",
        icon: "icon.png"
      });
    }
  });

  // Show Player ID Buttons
  document.getElementById('water-show-playerid').addEventListener('click', () => {
    const playerId = localStorage.getItem("playerID");
    if (playerId) {
      alert("Your Player ID:\n" + playerId);
    } else {
      alert("Player ID not available.");
    }
  });

  document.getElementById('protein-show-playerid').addEventListener('click', () => {
    const playerId = localStorage.getItem("playerID");
    if (playerId) {
      alert("Your Player ID:\n" + playerId);
    } else {
      alert("Player ID not available.");
    }
  });
});

class Tracker {
  constructor(type, unit) {
    this.type = type;
    this.unit = unit;
    this.goalKey = `${type}Goal`;
    this.totalKey = `${type}Total`;
    this.historyKey = `${type}History`;
    this.reminderKey = `${type}Reminder`;
    this.totalElement = document.getElementById(`${type}-total`);
    this.remainingElement = document.getElementById(`${type}-remaining`);
    this.progressBar = document.getElementById(`${type}-progress-bar`);
    this.goalInput = document.getElementById(`${type}-goal`);
    this.setGoalButton = document.getElementById(`${type}-set-goal`);
    this.buttons = document.querySelectorAll(`[data-action='${type}-add']`);
    this.manualInput = document.getElementById(`${type}-manual`);
    this.addManualButton = document.getElementById(`${type}-add-manual`);
    this.resetButton = document.getElementById(`${type}-reset-daily`);
    this.resetDataButton = document.getElementById(`${type}-reset-data`);
    this.settingsToggle = document.getElementById(`${type}-settings-toggle`);
    this.settingsSection = document.getElementById(`${type}-settings-section`);
    this.reminderInput = document.getElementById(`${type}-reminder-time`);
    this.setReminderButton = document.getElementById(`${type}-set-reminder`);
    this.enableNotificationButton = document.getElementById(`${type}-enable-notifications`);
    this.historyToggle = document.getElementById(`${type}-history-toggle`);
    this.historyPopup = document.getElementById(`${type}-history-popup`);
    this.dailyHistoryTab = document.getElementById(`${type}-daily-history`);
    this.currentIntakeTab = document.getElementById(`${type}-current-intake`);
    this.tabButtons = this.historyPopup.querySelectorAll(".tab-button");

    this.goal = parseInt(localStorage.getItem(this.goalKey)) || 0;
    this.total = parseInt(localStorage.getItem(this.totalKey)) || 0;
    this.reminderInterval = null;

    this.updateUI();
    this.bindEvents();
  }

  bindEvents() {
    this.setGoalButton.addEventListener("click", () => this.setGoal());
    this.buttons.forEach(button => {
      button.addEventListener("click", () => this.addIntake(parseInt(button.dataset.amount)));
    });
    this.addManualButton.addEventListener("click", () => {
      const amount = parseInt(this.manualInput.value);
      if (!isNaN(amount)) {
        this.addIntake(amount);
        this.manualInput.value = "";
      }
    });
    this.resetButton.addEventListener("click", () => this.resetDaily());
    this.resetDataButton.addEventListener("click", () => this.resetAllData());
    this.settingsToggle.addEventListener("click", () => {
      this.settingsSection.classList.toggle("show");
    });
    this.setReminderButton.addEventListener("click", () => this.setReminder());
    this.enableNotificationButton.addEventListener("click", () => this.enableNotifications());
    this.historyToggle.addEventListener("click", () => {
      this.historyPopup.classList.toggle("show");
      this.loadHistory();
    });
    this.tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        this.tabButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        const tabId = button.dataset.tab;
        this.dailyHistoryTab.style.display = tabId === `${this.type}-daily-history` ? "block" : "none";
        this.currentIntakeTab.style.display = tabId === `${this.type}-current-intake` ? "block" : "none";
      });
    });
  }

  updateUI() {
    this.totalElement.textContent = this.total;
    const remaining = Math.max(this.goal - this.total, 0);
    this.remainingElement.textContent = remaining;
    const percent = this.goal ? Math.min((this.total / this.goal) * 100, 100) : 0;
    this.progressBar.style.width = `${percent}%`;
  }

  setGoal() {
    const newGoal = parseInt(this.goalInput.value);
    if (!isNaN(newGoal) && newGoal > 0) {
      this.goal = newGoal;
      localStorage.setItem(this.goalKey, this.goal);
      this.updateUI();
    }
  }

  addIntake(amount) {
    const today = new Date().toLocaleDateString();
    const history = JSON.parse(localStorage.getItem(this.historyKey)) || {};
    history[today] = (history[today] || 0) + amount;
    localStorage.setItem(this.historyKey, JSON.stringify(history));

    this.total += amount;
    localStorage.setItem(this.totalKey, this.total);
    this.updateUI();
  }

  resetDaily() {
    this.total = 0;
    localStorage.setItem(this.totalKey, this.total);
    this.updateUI();
  }

  resetAllData() {
    localStorage.removeItem(this.goalKey);
    localStorage.removeItem(this.totalKey);
    localStorage.removeItem(this.historyKey);
    localStorage.removeItem(this.reminderKey);
    this.goal = 0;
    this.total = 0;
    this.updateUI();
  }

  setReminder() {
    const time = parseInt(this.reminderInput.value);
    if (!isNaN(time) && time > 0) {
      const playerId = localStorage.getItem("playerID");

      if (playerId) {
        fetch("https://hook.eu2.make.com/t3b4yjgrhzuc51gqowfjmxr061qq5f7i", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            interval: time,
            playerId: playerId,
            type: this.type
          })
        });
      }

      if (this.reminderInterval) clearInterval(this.reminderInterval);
      if (Notification.permission === "granted") {
        this.startReminder(time);
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            this.startReminder(time);
          } else {
            alert("Please enable notifications to receive reminders.");
          }
        });
      }
      localStorage.setItem(this.reminderKey, time);
    } else {
      alert("Please enter a valid time interval in minutes.");
    }
  }

  startReminder(time) {
    this.reminderInterval = setInterval(() => {
      new Notification(`Reminder to log your ${this.type} intake!`);
    }, time * 60000);
  }

  enableNotifications() {
    Notification.requestPermission().then(permission => {
      if (permission !== "granted") {
        alert("Please enable notifications to receive reminders.");
      }
    });
  }

  loadHistory() {
    const history = JSON.parse(localStorage.getItem(this.historyKey)) || {};
    const today = new Date().toLocaleDateString();
    this.dailyHistoryTab.innerHTML = "";
    this.currentIntakeTab.innerHTML = "";

    const sortedDates = Object.keys(history).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
      const value = history[date];
      const entry = document.createElement("div");
      entry.textContent = `${date}: ${value}${this.unit}`;
      if (date === today) {
        this.currentIntakeTab.appendChild(entry);
      } else {
        this.dailyHistoryTab.appendChild(entry);
      }
    });
  }
}
