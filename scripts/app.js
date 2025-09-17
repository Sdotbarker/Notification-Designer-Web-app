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
        const res = await fetch('assets/notification_guidance.json');
        if (!res.ok) {
            throw new Error("Failed to load JSON");
        }

        const guidance = await res.json();

        let response = "Sorry, I need more details to recommend the right notification.";
        for (const item of guidance) {
            // ✅ Add null/undefined check before calling toLowerCase
            if (
                typeof item.scenario === 'string' &&
                userText.toLowerCase().includes(item.scenario.toLowerCase())
            ) {
                response = `Component: ${item.component}\nMessage: ${item.message}\nWhy: ${item.reason}\nFluent UI: ${item.fluent_link}`;
                break;
            }
        }

        const agentMsg = document.createElement('div');
        agentMsg.textContent = 'Agent: ' + response;
        chatWindow.appendChild(agentMsg);

    } catch (error) {
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Agent: Error loading guidance data.';
        chatWindow.appendChild(errorMsg);
        console.error("Fetch error:", error);
    }

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
