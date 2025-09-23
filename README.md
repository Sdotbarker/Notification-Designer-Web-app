# Notification Designer Web App

A web-based chat interface that helps users choose the right notification component for Microsoft 365 scenarios. The application integrates with a Microsoft agent and provides fallback guidance through a local knowledge base.

## Features

### Microsoft Agent Integration
- **Primary Response Source**: Connects to Microsoft 365 agent at `https://m365.cloud.microsoft:443/chat/?titleId=T_99351e54-2fc0-1e52-f0cc-1756ca4ae305&source=embedded-builder`
- **Retry Logic**: Implements exponential backoff retry mechanism for reliability
- **CORS Support**: Proper cross-origin headers and credentials handling
- **Connection Testing**: Automatic connectivity testing on page load

### User Experience
- **Visual Source Indicators**: 
  - 🤖 Responses from Microsoft agent
  - 📚 Responses from local guidance system
- **Loading States**: Shows "Thinking..." while processing requests
- **Authorization**: Access control for authorized users only

### Fallback System
- **Local Guidance**: JSON-based notification guidance system
- **Scenario Matching**: Intelligent matching of user queries to relevant scenarios
- **Comprehensive Coverage**: Covers various Microsoft 365 notification scenarios

## Usage

1. Open `index.html` in a web browser
2. Type your notification scenario question
3. Receive guidance from either:
   - Microsoft agent (when available) 🤖
   - Local guidance system (when agent unavailable) 📚

## Technical Implementation

### Files Structure
- `index.html` - Main application interface
- `scripts/app.js` - Core functionality and Microsoft agent integration
- `styles/style.css` - User interface styling
- `assets/notification_guidance.json` - Local guidance database

### Key Functions
- `sendMessage()` - Main chat processing with agent integration
- `fetchWithRetry()` - Retry mechanism with exponential backoff
- `testAgentConnection()` - Connectivity testing for Microsoft agent

## Authorization

Currently configured for:
- `stbarker@microsoft.com`

Replace the `getCurrentAuthenticatedUser()` function with your actual authentication logic.

## Development

To run locally:
```bash
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000`