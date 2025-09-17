async function sendMessage() {
    const input = document.getElementById('user-input');
    // Display user message
    const userMsg = document.createElement('div');
    userMsg.textContent = 'You: ' + userText;
    chatWindow.appendChild(userMsg);

    try {
        // Load notification guidance JSON
        const guidance = await fetch('assets/notification_guidance.json')
            .then(res => {
                if (!res.ok) {
                    throw new Error("Failed to load JSON");
                }
                return res.json();
            });

        // Search for matching scenario
        let response = "Sorry, I need more details to recommend the right notification.";
        for (const item of guidance) {
            if (userText.toLowerCase().includes(item.scenario.toLowerCase())) {
                response = `Component: ${item.component}\nMessage: ${item.message}\nWhy: ${item.reason}\nFluent UI: ${item.fluent_link}`;
                break;
            }
        }

        // Display agent response
        const agentMsg = document.createElement('div');
        agentMsg.textContent = 'Agent: ' + response;
        chatWindow.appendChild(agentMsg);

    } catch (error) {
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Agent: Error loading guidance data.';
        chatWindow.appendChild(errorMsg);
        console.error(error);
    }

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}    const chatWindow = document.getElementById('chat-window');
    const userText = input.value.trim();
    if (!userText) return;
