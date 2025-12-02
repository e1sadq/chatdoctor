const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const chat = document.getElementById("chat");

function appendUserMessage(text) {
  if (!text.trim()) return;

  const row = document.createElement("div");
  row.className = "message-row user";
  row.innerHTML = `
    <div class="bubble-avatar user">你</div>
    <div>
      <div class="message-bubble user">${text
        .replace(/\n/g, "<br>")
        .trim()}</div>
      <div class="message-meta">你 · 剛剛</div>
    </div>
  `;
  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;
}

function handleSend() {
  const text = input.value;
  appendUserMessage(text);
  input.value = "";
  input.style.height = "auto";
}

if (input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // 自動調整 textarea 高度
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  });
}

if (sendBtn) {
  sendBtn.addEventListener("click", handleSend);
}
