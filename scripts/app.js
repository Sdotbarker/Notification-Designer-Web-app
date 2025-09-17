async function sendMessage() {
  const input = document.getElementById('user-input');
  const chatWindow = document.getElementById('chat-window');
  const userText = input.value.trim();
  if (!userText) return;

  // Display user message
  const userMsg = document.createElement('div');
  userMsg.textContent = 'You: ' + userText;
  chatWindow.appendChild(userMsg);

  try {
    if (!res.ok) {
      throw new Error("Failed to get response from flow");
    }

    const data = await res.json();
    const agentMsg = document.createElement('div');
    agentMsg.textContent = 'Agent: ' + data.response;
    chatWindow.appendChild(agentMsg);

  } catch (error) {
    const errorMsg = document.createElement('div');
    errorMsg.textContent = 'Agent: Something went wrong.';
    chatWindow.appendChild(errorMsg);
    console.error("Fetch error:", error);
  }

  input.value = '';
  chatWindow.scrollTop = chatWindow.scrollHeight;
}    const res = await fetch("https://839eace659ab424397eca5b8fcc104.e4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/31947aed3b3a497ca22c3d527cbbc0ed/triggers/manual/paths/invoke?api-version=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ userInput: userText })
    });

