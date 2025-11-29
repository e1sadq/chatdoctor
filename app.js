const chatContainer = document.getElementById("chatContainer");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChatButton");
const projectList = document.getElementById("projectList");
const conversationList = document.getElementById("conversationList");
const currentConversationTitleEl = document.getElementById("currentConversationTitle");

const STORAGE_KEY = "chatgptDemoConversationsV1";

let isWaiting = false;
let conversations = [];
let currentConversationId = null;

// ====== localStorage 存取 ======
function saveToStorage() {
    try {
        const data = {
            conversations,
            currentConversationId,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error("儲存到 localStorage 失敗：", e);
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || !Array.isArray(data.conversations)) return false;

        conversations = data.conversations;
        currentConversationId = data.currentConversationId || (conversations[0]?.id ?? null);
        return true;
    } catch (e) {
        console.error("讀取 localStorage 失敗：", e);
        return false;
    }
}

// ====== 對話資料結構 ======
function createConversation() {
    const id = Date.now().toString();
    const conv = {
        id,
        title: "新對話",
        messages: [],        // {role: "user" | "assistant", text: string}
        isProject: false,    // 是否標記為專案
    };
    conversations.unshift(conv); // 新的放最上
    currentConversationId = id;
    saveToStorage();
    renderSidebar();
    renderConversation();
}

function getCurrentConversation() {
    return conversations.find(c => c.id === currentConversationId);
}

// 刪除對話
function deleteConversation(id) {
    const idx = conversations.findIndex(c => c.id === id);
    if (idx === -1) return;

    const ok = window.confirm("確定要刪除此對話紀錄嗎？此動作無法復原。");
    if (!ok) return;

    conversations.splice(idx, 1);

    if (currentConversationId === id) {
        if (conversations.length > 0) {
            currentConversationId = conversations[0].id;
        } else {
            currentConversationId = null;
        }
    }

    saveToStorage();

    if (!currentConversationId && conversations.length === 0) {
        createConversation();
    } else {
        renderSidebar();
        renderConversation();
    }
}

// ====== UI 渲染 ======

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderSidebar() {
    projectList.innerHTML = "";
    conversationList.innerHTML = "";

    const projects = conversations.filter(c => c.isProject);
    const histories = conversations.filter(c => !c.isProject);

    renderConversationList(projectList, projects);
    renderConversationList(conversationList, histories);
}

function renderConversationList(container, list) {
    list.forEach(conv => {
        const item = document.createElement("div");
        item.classList.add("conversation-item");
        if (conv.id === currentConversationId) {
            item.classList.add("active");
        }

        const dot = document.createElement("div");
        dot.classList.add("conversation-item-dot");

        const title = document.createElement("div");
        title.classList.add("conversation-item-title");

        // 專案用 📁 當資料夾 icon
        if (conv.isProject) {
            title.textContent = "📁 " + (conv.title || "新專案");
        } else {
            title.textContent = conv.title || "新對話";
        }

        // ⭐ 專案按鈕
        const starBtn = document.createElement("button");
        starBtn.classList.add("conversation-star-btn");
        starBtn.textContent = conv.isProject ? "★" : "☆";
        starBtn.title = conv.isProject ? "移出專案" : "加入專案";

        starBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            conv.isProject = !conv.isProject;
            saveToStorage();
            renderSidebar();
        });

        // ✏️ 重新命名按鈕
        const renameBtn = document.createElement("button");
        renameBtn.classList.add("conversation-rename-btn");
        renameBtn.textContent = "✏️";
        renameBtn.title = "重新命名";

        renameBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const newName = window.prompt("請輸入新的名稱：", conv.title || "新對話");
            if (newName && newName.trim()) {
                conv.title = newName.trim();
                saveToStorage();
                renderSidebar();
                if (conv.id === currentConversationId) {
                    renderConversation();
                }
            }
        });

        // 🗑 刪除按鈕
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("conversation-delete-btn");
        deleteBtn.textContent = "🗑";
        deleteBtn.title = "刪除此對話";

        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteConversation(conv.id);
        });

        item.appendChild(dot);
        item.appendChild(title);
        item.appendChild(renameBtn);
        item.appendChild(starBtn);
        item.appendChild(deleteBtn);

        item.addEventListener("click", () => {
            currentConversationId = conv.id;
            saveToStorage();
            renderSidebar();
            renderConversation();
        });

        container.appendChild(item);
    });
}

function renderConversation() {
    const conv = getCurrentConversation();
    chatContainer.innerHTML = "";

    if (!conv) return;

    // 上方標題：專案加 📁，一般對話不加
    if (conv.isProject) {
        currentConversationTitleEl.textContent = "📁 " + (conv.title || "新專案");
    } else {
        currentConversationTitleEl.textContent = conv.title || "新對話";
    }

    if (conv.messages.length === 0) {
        const welcome = createMessageRow(
            "assistant",
            "嗨，我是你的 ChatDoctor，有什麼想問的嗎？"
        );
        chatContainer.appendChild(welcome);
        scrollToBottom();
        return;
    }

    conv.messages.forEach(msg => {
        const row = createMessageRow(msg.role, msg.text);
        chatContainer.appendChild(row);
    });

    scrollToBottom();
}

// 建立訊息 DOM
function createMessageRow(role, text) {
    const row = document.createElement("div");
    row.classList.add("message-row", role);

    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar", role);
    avatar.textContent = role === "user" ? "🧑" : "🤖";

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");
    bubble.textContent = text;

    row.appendChild(avatar);
    row.appendChild(bubble);

    return row;
}

// 建立「正在輸入」提示
function createTypingRow() {
    const row = document.createElement("div");
    row.classList.add("message-row", "assistant");

    const avatar = document.createElement("div");
    avatar.classList.add("message-avatar", "assistant");
    avatar.textContent = "🤖";

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    const indicator = document.createElement("div");
    indicator.classList.add("typing-indicator");

    for (let i = 0; i < 3; i++) {
        const dot = document.createElement("div");
        dot.classList.add("typing-dot");
        indicator.appendChild(dot);
    }

    bubble.appendChild(indicator);
    row.appendChild(avatar);
    row.appendChild(bubble);

    return row;
}

// ====== 發送訊息 ======
async function sendMessage(message) {
    if (!message.trim()) return;
    if (isWaiting) return;
    const conv = getCurrentConversation();
    if (!conv) return;

    isWaiting = true;
    userInput.value = "";
    userInput.style.height = "auto";
    sendButton.disabled = true;

    // 更新對話資料（使用者）
    conv.messages.push({ role: "user", text: message });
    if (conv.title === "新對話") {
        conv.title = message.length > 12 ? message.slice(0, 12) + "…" : message;
    }
    saveToStorage();
    renderSidebar();

    // 顯示使用者訊息
    const userRow = createMessageRow("user", message);
    chatContainer.appendChild(userRow);
    scrollToBottom();

    // 顯示「正在輸入」
    const typingRow = createTypingRow();
    chatContainer.appendChild(typingRow);
    scrollToBottom();

    try {
        const res = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        if (!res.ok) {
            throw new Error("Server error");
        }

        const data = await res.json();
        const reply = data.reply || "(沒有收到回應內容)";

        // 更新對話資料（助手）
        conv.messages.push({ role: "assistant", text: reply });
        saveToStorage();

        chatContainer.removeChild(typingRow);
        const botRow = createMessageRow("assistant", reply);
        chatContainer.appendChild(botRow);
        scrollToBottom();
    } catch (err) {
        console.error(err);
        chatContainer.removeChild(typingRow);
        const errorText = "⚠️ 呼叫後端失敗，請檢查 /api/chat 是否正常運作。";
        conv.messages.push({ role: "assistant", text: errorText });
        saveToStorage();
        const errorRow = createMessageRow("assistant", errorText);
        chatContainer.appendChild(errorRow);
        scrollToBottom();
    } finally {
        isWaiting = false;
        sendButton.disabled = false;
        userInput.focus();
    }
}

// ====== 事件綁定 ======

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = userInput.value;
    sendMessage(message);
});

// Enter 送出 / Shift+Enter 換行
userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event("submit"));
    }
});

// 自動調整 textarea 高度
userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = userInput.scrollHeight + "px";
});

// 新對話按鈕
newChatButton.addEventListener("click", () => {
    createConversation();
});

// 點擊上方標題可以重新命名目前對話 / 專案
currentConversationTitleEl.addEventListener("click", () => {
    const conv = getCurrentConversation();
    if (!conv) return;

    const newName = window.prompt("請輸入此對話／專案的新名稱：", conv.title || "新對話");
    if (newName && newName.trim()) {
        conv.title = newName.trim();
        saveToStorage();
        renderSidebar();
        renderConversation();
    }
});

// 初始化
window.addEventListener("DOMContentLoaded", () => {
    const ok = loadFromStorage();
    if (!ok || conversations.length === 0) {
        createConversation();
    } else {
        renderSidebar();
        renderConversation();
    }
});


