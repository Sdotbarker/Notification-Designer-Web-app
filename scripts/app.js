// List of authorized users
const authorizedUsers = [
    "stbarker@microsoft.com"
];

// Replace this with your actual user retrieval logic if needed
function getCurrentAuthenticatedUser() {
    // For demo purposes, hardcoded. Replace with actual logic as needed.
    return "stbarker@microsoft.com";
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const chatWindow = document.getElementById('chat-window');
    const userText = input.value.trim();
    if (!userText) return;

    // Display user message
    const userMsg = document.createElement('div');
    userMsg.textContent = 'You: ' + userText;
    chatWindow.appendChild(userMsg);

    // Authorization check
    const currentUser = getCurrentAuthenticatedUser();
    if (!authorizedUsers.includes(currentUser)) {
        const agentMsg = document.createElement('div');
        agentMsg.textContent = 'Agent: You are not authorized to access this agent.';
        chatWindow.appendChild(agentMsg);
        input.value = '';
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return;
    }

    let response = "";
    let agentError = false;

    try {
        // Try getting response from agent
        const agentResponse = await fetch('https://m365.cloud.microsoft:443/chat/?titleId=T_99351e54-2fc0-1e52-f0cc-1756ca4ae305&source=embedded-builder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: userText })
        });

        if (agentResponse.ok) {
            const data = await agentResponse.json();
            response = data.reply || data.response || "";
        }
        // If response is empty, set agentError so we use fallback
        if (!response) agentError = true;
    } catch (error) {
        agentError = true;
        console.error("Agent fetch error:", error);
    }

    // If agent fails or returns empty, fall back to guidance JSON
    if (agentError) {
        try {
            const res = await fetch('assets/notification_guidance.json');
            if (res.ok) {
                const guidance = await res.json();
                response = "Sorry, I need more details to recommend the right notification.";
                for (const item of guidance) {
                    if (
                        typeof item.scenario === 'string' &&
                        userText.toLowerCase().includes(item.scenario.toLowerCase())
                    ) {
                        response = `Component: ${item.component}\nMessage: ${item.message}\nWhy: ${item.reason}\nFluent UI: ${item.fluent_link}`;
                        break;
                    }
                }
            } else {
                response = 'Agent: Error loading guidance data.';
            }
        } catch (error) {
            response = 'Agent: Error loading guidance data.';
            console.error("Guidance fetch error:", error);
        }
    }

    // Show agent/guidance response
    const agentMsg = document.createElement('div');
    agentMsg.textContent = 'Agent: ' + response;
    chatWindow.appendChild(agentMsg);

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}