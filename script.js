// ゆめかわTODOアプリのJavaScript

class DreamyTodoApp {
  constructor() {
    this.tasks = JSON.parse(localStorage.getItem("dreamyTodoTasks")) || {
      flower: [],
      star: [],
      ribbon: [],
      unicorn: [],
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.renderAllTasks();
    this.updateAllProgress();
    this.addSampleTasks();
  }

  bindEvents() {
    const addTaskBtn = document.getElementById("addTaskBtn");
    const taskInput = document.getElementById("taskInput");
    const categorySelect = document.getElementById("categorySelect");
    const deleteAllBtn = document.getElementById("deleteAllBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

    addTaskBtn.addEventListener("click", () => this.addTask());

    taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.addTask();
      }
    });

    // フォーカス時のアニメーション
    taskInput.addEventListener("focus", () => {
      taskInput.parentElement.style.transform = "scale(1.02)";
    });

    taskInput.addEventListener("blur", () => {
      taskInput.parentElement.style.transform = "scale(1)";
    });

    // 全削除ボタンのイベント
    deleteAllBtn.addEventListener("click", () => this.showDeleteConfirmModal());
    confirmDeleteBtn.addEventListener("click", () => this.deleteAllTasks());
    cancelDeleteBtn.addEventListener("click", () =>
      this.hideDeleteConfirmModal()
    );

    // モーダル外クリックで閉じる
    document.getElementById("confirmModal").addEventListener("click", (e) => {
      if (e.target.id === "confirmModal") {
        this.hideDeleteConfirmModal();
      }
    });
  }

  addTask() {
    const taskInput = document.getElementById("taskInput");
    const categorySelect = document.getElementById("categorySelect");

    const taskText = taskInput.value.trim();
    const category = categorySelect.value;

    if (!taskText) {
      this.showNotification("タスクを入力してください ✨", "warning");
      return;
    }

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    this.tasks[category].unshift(newTask);
    this.saveTasks();
    this.renderTasks(category);
    this.updateProgress(category);

    // 入力フィールドをクリア
    taskInput.value = "";
    taskInput.focus();

    // 成功通知
    this.showNotification("タスクを追加しました ✨", "success");

    // カードのアニメーション
    this.animateCard(category);
  }

  toggleTask(category, taskId) {
    const task = this.tasks[category].find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderTasks(category);
      this.updateProgress(category);

      const message = task.completed
        ? "完了しました！🎉"
        : "未完了に戻しました ✨";
      this.showNotification(message, task.completed ? "success" : "info");
    }
  }

  deleteTask(category, taskId) {
    const taskIndex = this.tasks[category].findIndex((t) => t.id === taskId);
    if (taskIndex !== -1) {
      const deletedTask = this.tasks[category][taskIndex];
      this.tasks[category].splice(taskIndex, 1);
      this.saveTasks();
      this.renderTasks(category);
      this.updateProgress(category);

      this.showNotification("タスクを削除しました ✨", "info");
    }
  }

  // タスクを編集モードに切り替え
  editTask(category, taskId) {
    const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
    const taskText = taskItem.querySelector(".task-text");
    const currentText = taskText.textContent;

    // 入力フィールドに変更
    taskText.innerHTML = `<input type="text" class="task-edit-input" value="${this.escapeHtml(
      currentText
    )}" />`;
    taskText.classList.add("editing");

    const input = taskText.querySelector(".task-edit-input");
    input.focus();
    input.select();

    // 編集完了のイベント
    const finishEdit = () => {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        const task = this.tasks[category].find((t) => t.id === taskId);
        if (task) {
          task.text = newText;
          this.saveTasks();
          this.renderTasks(category);
          this.showNotification("タスクを更新しました ✨", "success");
        }
      } else {
        this.renderTasks(category);
      }
    };

    input.addEventListener("blur", finishEdit);
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        finishEdit();
      }
    });
  }

  // 進捗率を更新
  updateProgress(category) {
    const tasks = this.tasks[category];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;

    const progressPercentage =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    const progressFill = document.querySelector(
      `[data-category="${category}"] .progress-fill`
    );
    const progressText = document.querySelector(
      `[data-category="${category}"] .progress-percentage`
    );
    const rarityBadge = document.querySelector(
      `[data-category="${category}"] .rarity-badge`
    );
    const card = document.querySelector(`[data-category="${category}"]`);

    if (progressFill && progressText && rarityBadge && card) {
      progressFill.style.width = `${progressPercentage}%`;
      progressText.textContent = `${progressPercentage}%`;

      // レアリティを更新
      const newRarity = this.calculateRarity(progressPercentage);
      this.updateRarityBadge(rarityBadge, newRarity);
      this.updateCardRarity(card, newRarity);
    }
  }

  // すべての進捗率を更新
  updateAllProgress() {
    Object.keys(this.tasks).forEach((category) => {
      this.updateProgress(category);
    });
  }

  // レアリティを計算
  calculateRarity(progressPercentage) {
    if (progressPercentage === 0) return "common";
    if (progressPercentage < 25) return "uncommon";
    if (progressPercentage < 50) return "rare";
    if (progressPercentage < 75) return "epic";
    if (progressPercentage < 100) return "legendary";
    return "mythic";
  }

  // レアリティバッジを更新
  updateRarityBadge(badgeElement, rarity) {
    // 古いクラスを削除
    badgeElement.classList.remove(
      "rarity-common",
      "rarity-uncommon",
      "rarity-rare",
      "rarity-epic",
      "rarity-legendary",
      "rarity-mythic"
    );

    // 新しいクラスを追加
    badgeElement.classList.add(`rarity-${rarity}`);

    // テキストを更新
    const rarityTexts = {
      common: "Common",
      uncommon: "Uncommon",
      rare: "Rare",
      epic: "Epic",
      legendary: "Legendary",
      mythic: "Mythic",
    };

    badgeElement.textContent = rarityTexts[rarity];

    // レアリティアップのアニメーション
    if (rarity !== "common") {
      badgeElement.style.animation = "none";
      badgeElement.offsetHeight; // リフロー
      badgeElement.style.animation = "rarityGlow 0.6s ease-in-out";
    }
  }

  // カードのレアリティを更新
  updateCardRarity(cardElement, rarity) {
    // 古いレアリティクラスを削除
    cardElement.classList.remove(
      "rarity-common",
      "rarity-uncommon",
      "rarity-rare",
      "rarity-epic",
      "rarity-legendary",
      "rarity-mythic"
    );

    // 新しいレアリティクラスを追加
    cardElement.classList.add(`rarity-${rarity}`);

    // レアリティアップ時の特別なアニメーション
    if (rarity !== "common") {
      cardElement.style.animation = "none";
      cardElement.offsetHeight; // リフロー

      // レアリティに応じたアニメーション
      const rarityAnimations = {
        uncommon: "uncommonGlow 0.8s ease-in-out",
        rare: "rareGlow 0.8s ease-in-out",
        epic: "epicGlow 0.8s ease-in-out",
        legendary: "legendaryGlow 0.8s ease-in-out",
        mythic: "mythicGlow 0.8s ease-in-out",
      };

      cardElement.style.animation = rarityAnimations[rarity];

      // アニメーション完了後に通常のアニメーションに戻す
      setTimeout(() => {
        if (rarity === "uncommon")
          cardElement.style.animation =
            "uncommonGlow 3s ease-in-out infinite alternate";
        else if (rarity === "rare")
          cardElement.style.animation =
            "rareGlow 3s ease-in-out infinite alternate";
        else if (rarity === "epic")
          cardElement.style.animation =
            "epicGlow 3s ease-in-out infinite alternate";
        else if (rarity === "legendary")
          cardElement.style.animation =
            "legendaryGlow 3s ease-in-out infinite alternate";
        else if (rarity === "mythic")
          cardElement.style.animation =
            "mythicGlow 3s ease-in-out infinite alternate";
      }, 800);
    }
  }

  // 全削除確認モーダルを表示
  showDeleteConfirmModal() {
    const modal = document.getElementById("confirmModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden"; // スクロールを無効化
  }

  // 全削除確認モーダルを非表示
  hideDeleteConfirmModal() {
    const modal = document.getElementById("confirmModal");
    modal.classList.remove("show");
    document.body.style.overflow = ""; // スクロールを有効化
  }

  // すべてのタスクを削除
  deleteAllTasks() {
    // 各カテゴリのタスクをクリア
    Object.keys(this.tasks).forEach((category) => {
      this.tasks[category] = [];
    });

    this.saveTasks();
    this.renderAllTasks();
    this.updateAllProgress();
    this.hideDeleteConfirmModal();

    // 成功通知
    this.showNotification("すべてのタスクを削除しました ✨", "success");

    // 全カードのアニメーション
    Object.keys(this.tasks).forEach((category) => {
      this.animateCard(category);
    });
  }

  renderTasks(category) {
    const taskList = document.getElementById(`${category}Tasks`);
    const tasks = this.tasks[category];

    if (tasks.length === 0) {
      taskList.innerHTML = `
        <div class="empty-state">
          <p style="text-align: center; color: var(--text-secondary); font-style: italic;">
            まだタスクがありません ✨<br>
            新しいタスクを追加してみましょう！
          </p>
        </div>
      `;
      return;
    }

    taskList.innerHTML = tasks
      .map(
        (task) => `
      <div class="task-item ${
        task.completed ? "completed" : ""
      }" data-task-id="${task.id}">
        <div class="task-checkbox ${task.completed ? "checked" : ""}" 
             onclick="todoApp.toggleTask('${category}', ${task.id})"></div>
        <div class="task-text" onclick="todoApp.editTask('${category}', ${
          task.id
        })">${this.escapeHtml(task.text)}</div>
        <button class="task-edit-btn" 
                onclick="todoApp.editTask('${category}', ${task.id})"
                title="タスクを編集">✏️</button>
        <button class="delete-task-btn" 
                onclick="todoApp.deleteTask('${category}', ${task.id})"
                title="タスクを削除">🗑️</button>
      </div>
    `
      )
      .join("");
  }

  renderAllTasks() {
    Object.keys(this.tasks).forEach((category) => {
      this.renderTasks(category);
    });
  }

  saveTasks() {
    localStorage.setItem("dreamyTodoTasks", JSON.stringify(this.tasks));
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showNotification(message, type = "info") {
    // 既存の通知を削除
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // 通知のスタイルを追加
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--pink-primary) 0%, var(--purple-primary) 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 15px;
      box-shadow: var(--shadow-medium);
      z-index: 1000;
      animation: slideInRight 0.5s ease-out;
      max-width: 300px;
    `;

    document.body.appendChild(notification);

    // 3秒後に自動で消える
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = "slideOutRight 0.5s ease-out";
        setTimeout(() => {
          if (notification.parentElement) {
            notification.remove();
          }
        }, 500);
      }
    }, 3000);
  }

  animateCard(category) {
    const card = document.querySelector(`[data-category="${category}"]`);
    if (card) {
      card.style.animation = "none";
      card.offsetHeight; // リフロー
      card.style.animation = "bounce 0.6s ease-in-out";
    }
  }

  addSampleTasks() {
    // 初回訪問時のみサンプルタスクを追加
    const hasVisited = localStorage.getItem("dreamyTodoVisited");
    if (hasVisited) return;

    const sampleTasks = {
      flower: [
        {
          id: Date.now() - 4,
          text: "机の上を片付ける",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: Date.now() - 3,
          text: "植物に水をやる",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      star: [
        {
          id: Date.now() - 2,
          text: "新しいレシピに挑戦する",
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: Date.now() - 1,
          text: "お気に入りの音楽を聴く",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      ribbon: [
        {
          id: Date.now(),
          text: "友達に連絡する",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unicorn: [
        {
          id: Date.now() + 1,
          text: "新しい言語を学び始める",
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    Object.keys(sampleTasks).forEach((category) => {
      this.tasks[category].push(...sampleTasks[category]);
    });

    this.saveTasks();
    this.renderAllTasks();
    this.updateAllProgress();
    localStorage.setItem("dreamyTodoVisited", "true");

    this.showNotification("サンプルタスクを追加しました！✨", "success");
  }
}

// アプリケーションの初期化
let todoApp;
document.addEventListener("DOMContentLoaded", () => {
  todoApp = new DreamyTodoApp();
});

// スライドアウトアニメーションのCSS
const style = document.createElement("style");
style.textContent = `
  @keyframes slideOutRight {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(100%);
    }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .notification-message {
    flex: 1;
  }
  
  .notification-close {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s;
  }
  
  .notification-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .task-edit-input {
    width: 100%;
    border: none;
    outline: none;
    font-family: inherit;
    font-size: 1rem;
    color: var(--text-primary);
    background: transparent;
  }
`;
document.head.appendChild(style);
