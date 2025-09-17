
async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const userText = input.value;
    if (!userText) return;

    // Display user message
    const userMsg = document.createElement('div');
    userMsg.textContent = 'You: ' + userText;
    chatWindow.appendChild(userMsg);

    // Simulate agent response
    const response = await fetch('assets/response.json')
        .then(res => res.json())
        .then(data => data[userText.toLowerCase()] || "Sorry, I don't understand that.");

    const agentMsg = document.createElement('div');
    agentMsg.textContent = 'Agent: ' + response;
    chatWindow.appendChild(agentMsg);

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
