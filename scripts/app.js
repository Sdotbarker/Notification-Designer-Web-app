// List of authorized users
const authorizedUsers = [
    "stbarker@microsoft.com"
];

// Retry configuration for Microsoft agent calls
const AGENT_RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000   // 8 seconds
};

// Helper function to implement exponential backoff retry
async function fetchWithRetry(url, options, retryConfig = AGENT_RETRY_CONFIG) {
    let lastError;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            console.log(`Microsoft agent call attempt ${attempt + 1}/${retryConfig.maxRetries + 1}`);
            
            const response = await fetch(url, options);
            
            if (response.ok) {
                return response;
            } else if (response.status >= 500 && attempt < retryConfig.maxRetries) {
                // Retry on server errors
                console.warn(`Server error ${response.status}, retrying...`);
                lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
            } else {
                // Don't retry on client errors (4xx) or if max retries reached
                return response;
            }
        } catch (error) {
            console.warn(`Network error on attempt ${attempt + 1}:`, error.message);
            lastError = error;
            
            if (attempt === retryConfig.maxRetries) {
                throw lastError;
            }
        }
        
        // Calculate delay with exponential backoff
        if (attempt < retryConfig.maxRetries) {
            const delay = Math.min(
                retryConfig.baseDelay * Math.pow(2, attempt),
                retryConfig.maxDelay
            );
            console.log(`Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

// Replace this with your actual user retrieval logic if needed
function getCurrentAuthenticatedUser() {
    // For demo purposes, hardcoded. Replace with actual logic as needed.
    return "stbarker@microsoft.com";
}

// Function to test Microsoft agent connectivity
async function testAgentConnection() {
    try {
        console.log("Testing Microsoft agent connectivity...");
        
        const testResponse = await fetchWithRetry(
            'https://m365.cloud.microsoft:443/chat/?titleId=T_99351e54-2fc0-1e52-f0cc-1756ca4ae305&source=embedded-builder',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ 
                    prompt: "test connectivity",
                    timestamp: new Date().toISOString(),
                    source: 'notification-designer-web-app'
                })
            },
            { maxRetries: 1, baseDelay: 500, maxDelay: 1000 } // Shorter config for connectivity test
        );
        
        console.log("Agent connectivity test result:", testResponse.status);
        return testResponse.ok;
    } catch (error) {
        console.log("Agent connectivity test failed:", error.message);
        return false;
    }
}

// Test agent connectivity on page load
window.addEventListener('load', async () => {
    const isConnected = await testAgentConnection();
    console.log(`Microsoft agent ${isConnected ? 'is available' : 'is not available'} - ${isConnected ? 'will use agent responses' : 'will fall back to local guidance'}`);
});

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

    // Show loading message
    const loadingMsg = document.createElement('div');
    loadingMsg.textContent = 'Agent: Thinking...';
    loadingMsg.style.opacity = '0.7';
    loadingMsg.id = 'loading-message';
    chatWindow.appendChild(loadingMsg);
    chatWindow.scrollTop = chatWindow.scrollHeight;

    let response = "";
    let agentError = false;
    let usedFallback = false;

    try {
        // Try getting response from agent with improved error handling and retry logic
        console.log("Attempting to call Microsoft agent with message:", userText);
        
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': window.location.origin
            },
            credentials: 'include',
            mode: 'cors',
            body: JSON.stringify({ 
                prompt: userText,
                timestamp: new Date().toISOString(),
                source: 'notification-designer-web-app'
            })
        };
        
        const agentResponse = await fetchWithRetry(
            'https://m365.cloud.microsoft:443/chat/?titleId=T_99351e54-2fc0-1e52-f0cc-1756ca4ae305&source=embedded-builder',
            requestOptions
        );

        console.log("Agent response status:", agentResponse.status);
        
        if (agentResponse.ok) {
            const data = await agentResponse.json();
            console.log("Agent response data:", data);
            response = data.reply || data.response || data.message || "";
        } else {
            console.warn("Agent responded with error status:", agentResponse.status, agentResponse.statusText);
            agentError = true;
        }
        
        // If response is empty, set agentError so we use fallback
        if (!response) {
            console.log("Agent returned empty response, falling back to guidance");
            agentError = true;
        }
    } catch (error) {
        agentError = true;
        console.error("Agent fetch error after retries:", error);
        console.log("Falling back to local guidance system");
    }

    // If agent fails or returns empty, fall back to guidance JSON
    if (agentError) {
        usedFallback = true;
        console.log("Using local guidance fallback system");
        
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

    // Remove loading message
    const loadingElement = document.getElementById('loading-message');
    if (loadingElement) {
        loadingElement.remove();
    }

    // Show agent/guidance response with source indicator
    const agentMsg = document.createElement('div');
    const sourceIndicator = usedFallback ? ' (using local guidance)' : ' (via Microsoft agent)';
    agentMsg.textContent = 'Agent: ' + response;
    
    // Add a subtle indicator for the response source
    if (usedFallback) {
        const sourceSpan = document.createElement('span');
        sourceSpan.textContent = ' 📚';
        sourceSpan.title = 'Response from local notification guidance';
        sourceSpan.style.opacity = '0.6';
        agentMsg.appendChild(sourceSpan);
    } else {
        const sourceSpan = document.createElement('span');
        sourceSpan.textContent = ' 🤖';
        sourceSpan.title = 'Response from Microsoft agent';
        sourceSpan.style.opacity = '0.6';
        agentMsg.appendChild(sourceSpan);
    }
    
    chatWindow.appendChild(agentMsg);

    input.value = '';
    chatWindow.scrollTop = chatWindow.scrollHeight;
}