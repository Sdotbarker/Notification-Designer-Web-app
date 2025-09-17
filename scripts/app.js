// Array of authorized users
const AUTHORIZED_USERS = ['Sdotbarker'];

// Check if current user is authorized (placeholder - in real app this would check actual user identity)
function getCurrentUser() {
    // In a real application, this would get the user from authentication context
    // For demo purposes, we'll assume 'Sdotbarker' is the current user
    // You can change this to test unauthorized access
    return 'Sdotbarker';
}

function isUserAuthorized() {
    const currentUser = getCurrentUser();
    return AUTHORIZED_USERS.includes(currentUser);
}

async function callAgent(userText) {
    try {
        const agentUrl = 'https://m365.cloud.microsoft:443/chat/?titleId=T_99351e54-2fc0-1e52-f0cc-1756ca4ae305&source=embedded-builder';
        
        const response = await fetch(agentUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userText,
                user: getCurrentUser()
            })
        });

        if (!response.ok) {
            throw new Error(`Agent API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Check if agent returned a valid response
        if (!data || !data.response || data.response.trim() === '') {
            throw new Error('Agent returned empty response');
        }

        return data.response;
    } catch (error) {
        console.error('Agent API call failed:', error);
        throw error;
    }
}

async function getFallbackResponse(userText) {
    try {
        const res = await fetch('assets/notification_guidance.json');
        if (!res.ok) {
            throw new Error("Failed to load JSON");
        }

        const guidance = await res.json();

        let response = "Sorry, I need more details to recommend the right notification.";
        for (const item of guidance) {
            // ✅ Add null/undefined check before calling toLowerCase
            if (typeof item.scenario === 'string') {
                const scenarioLower = item.scenario.toLowerCase();
                if (scenarioLower.includes(userText.toLowerCase())) {
                    response = `Component: ${item.component}\nMessage: ${item.message}\nWhy: ${item.reason}\nFluent UI: ${item.fluent_link}`;
                    break;
                }
            }
        }
        return response;
    } catch (error) {
        console.error("Fallback guidance loading failed:", error);
        throw error;
    }
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

    let response;
    let isFromAgent = false;

    // Check if user is authorized
    if (!isUserAuthorized()) {
        response = `Access denied. Only authorized users (${AUTHORIZED_USERS.join(', ')}) can access the agent. Current user: ${getCurrentUser()}`;
    } else {
        // Try agent first
        try {
            response = await callAgent(userText);
            isFromAgent = true;
        } catch (agentError) {
            console.log('Agent failed, falling back to local guidance:', agentError.message);
            
            // Fall back to local guidance
            try {
                response = await getFallbackResponse(userText);
                response = `[Fallback] ${response}`;
            } catch (fallbackError) {
                response = 'Agent: Error - both agent and local guidance failed. Please try again later.';
                console.error("Both agent and fallback failed:", fallbackError);
            }
        }
    }

    const agentMsg = document.createElement('div');
    agentMsg.textContent = `Agent${isFromAgent ? ' (Live)' : ''}: ${response}`;
    chatWindow.appendChild(agentMsg);

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
