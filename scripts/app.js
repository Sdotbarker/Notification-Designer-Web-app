// Array of authorized users
const AUTHORIZED_USERS = ['Sdotbarker'];

// Microsoft agent API endpoint
const AGENT_API_URL = 'https://m365.cloud.microsoft:443/chat/?titleId=T_99351e54-2fc0-1e52-f0cc-1756ca4ae305&source=embedded-builder';

// Function to check if user is authorized
function isUserAuthorized(username) {
    return AUTHORIZED_USERS.includes(username);
}

// Function to get current user (simplified - in real app this would come from authentication)
function getCurrentUser() {
    // For demo purposes, we'll use 'Sdotbarker' as the current user
    // In a real application, this would come from your authentication system
    return 'Sdotbarker';
}

// Function to call Microsoft agent API
async function callAgentAPI(userText) {
    try {
        const response = await fetch(AGENT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: userText,
                titleId: 'T_99351e54-2fc0-1e52-f0cc-1756ca4ae305',
                source: 'embedded-builder'
            })
        });

        if (!response.ok) {
            throw new Error(`Agent API error: ${response.status}`);
        }

        const data = await response.json();
        return data.response || data.message || '';
    } catch (error) {
        console.error('Agent API error:', error);
        throw error;
    }
}

// Function to get response from local JSON fallback
async function getLocalResponse(userText) {
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
        return response;
    } catch (error) {
        console.error("Local JSON fetch error:", error);
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

    const currentUser = getCurrentUser();
    
    // Check if user is authorized to access the agent
    if (!isUserAuthorized(currentUser)) {
        const errorMsg = document.createElement('div');
        errorMsg.textContent = 'Agent: Access denied. You are not authorized to use the agent service.';
        chatWindow.appendChild(errorMsg);
        
        input.value = '';
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return;
    }

    let response = '';
    let useAgentResponse = false;

    try {
        // First, try to get response from Microsoft agent API
        console.log('Attempting to call agent API...');
        response = await callAgentAPI(userText);
        
        // Check if agent response is valid and not empty
        if (response && response.trim().length > 0) {
            useAgentResponse = true;
            console.log('Using agent response');
        } else {
            console.log('Agent returned empty response, falling back to local JSON');
            throw new Error('Agent returned empty response');
        }
    } catch (agentError) {
        console.log('Agent API failed, using local fallback:', agentError.message);
        
        try {
            // Fall back to local notification_guidance.json
            response = await getLocalResponse(userText);
            console.log('Using local JSON fallback response');
        } catch (localError) {
            // If both agent and local JSON fail, show error
            response = 'Sorry, I encountered an error and cannot provide guidance at this time. Please try again later.';
            console.error('Both agent and local fallback failed:', localError);
        }
    }

    // Display the response
    const agentMsg = document.createElement('div');
    const prefix = useAgentResponse ? 'Agent: ' : 'Agent (Local): ';
    agentMsg.textContent = prefix + response;
    chatWindow.appendChild(agentMsg);

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
