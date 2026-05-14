# [<img src="https://github.com/user-attachments/assets/9db7a38b-5df2-4696-b584-ab37c5b8ba3d" width="40" /> AWS Chime Client v4.0](https://georges034302.github.io/aws-chime-client/)




## 🌐 Overview
A secure, enterprise-ready **Amazon Chime SDK v3** client with **AWS Cognito authentication** and advanced video features including background blur, virtual backgrounds, screen sharing, and real-time participant roster.

**Production-ready security** — requires authentication via AWS Cognito before accessing meetings. Works directly in your browser and interoperates seamlessly with official Amazon Chime participants.

Built with modern web standards:
- **Frontend**: Amazon Chime SDK JavaScript v3.20.0 (via esm.sh CDN)
- **Backend**: AWS Lambda + API Gateway (AWS SDK v3)
- **Hosting**: GitHub Pages (frontend) + AWS (backend)

All media flows through Amazon Chime's WebRTC infrastructure — the backend only handles meeting creation.

---

## 🎯 Use Cases
- Professional interviews with clean backgrounds
- Remote demos and presentations
- Testing Chime SDK video pipelines
- Lightweight browser alternative to desktop Chime app

---

## 🚀 Key Features (v4.0 - Production Ready)

### 🔐 Security & Authentication
- **✅ AWS Cognito Integration**: Complete hosted UI authentication with JWT tokens
- **✅ Production Security**: Enterprise-ready user management and access control
- **✅ Multi-Environment**: Works seamlessly in localhost, GitHub Codespaces, and production
- **✅ Token Validation**: Automatic JWT token parsing and API authorization

### 🎥 Advanced Video & Audio
- **✅ HD Video Conferencing**: Professional-grade audio/video with adaptive quality
- **✅ Background Blur**: Real-time WebAssembly-powered background blur effects
- **✅ Custom Virtual Backgrounds**: Upload and use custom background images
- **✅ Screen Sharing**: Full-screen sharing with dedicated presentation view
- **✅ Smart Device Management**: Hot-swappable camera/microphone selection
- **✅ Transform Pipeline**: Real-time video processing with minimal latency

### 👥 Enhanced Collaboration
- **✅ Live Participant Roster**: Real-time join/leave tracking with status indicators
- **✅ Audio/Video Status**: Visual mute indicators (🎤/🔇) for all participants
- **✅ Screen Share Detection**: Presenter indicators (🖥️) in participant list
- **✅ Cross-Platform Compatible**: Works with official Amazon Chime desktop/mobile apps
- **✅ Meeting Persistence**: Reliable connection handling with auto-recovery

### 🛠 Technical Excellence (v4.0)
- **✅ Modern Architecture**: ES2020+ modules with Amazon Chime SDK v3.20.0
- **✅ WebAssembly Performance**: Optimized WASM background processing via CDN
- **✅ Production UI**: Professional dark theme with glassmorphism effects
- **✅ Error Recovery**: Graceful handling of network issues and device changes
- **✅ Zero Installation**: Complete browser-based solution with PWA capabilities
- **✅ Infrastructure as Code**: Complete AWS SAM deployment automation

---

## 🏗 Architecture

```
┌─────────────────────────┐
│   User Browser          │
│   (Frontend + Auth UI)  │
└───────────┬─────────────┘
            │ 1. Login Flow
            ▼
┌─────────────────────────┐
│   AWS Cognito           │
│   (Hosted UI + JWT)     │
└───────────┬─────────────┘
            │ 2. JWT Token
            ▼
┌─────────────────────────┐
│   GitHub Pages          │
│   (Chime SDK Client)    │
└───────────┬─────────────┘
            │ 3. API Call + JWT
            ▼
┌─────────────────────────┐
│   API Gateway           │
│   (JWT Authorizer)      │
└───────────┬─────────────┘
            │ 4. Authorized Request
            ▼
┌─────────────────────────┐
│   Lambda Function       │
│   (Meeting Creation)    │
└───────────┬─────────────┘
            │ 5. Meeting Info
            ▼
┌─────────────────────────┐
│   Amazon Chime Services │
│   (WebRTC Media)        │
└─────────────────────────┘
```

**Components:**

**Authentication Layer (AWS Cognito)**
- User Pool with hosted UI for secure login/logout
- JWT token generation and validation
- OAuth 2.0 implicit flow for browser clients
- Automatic token refresh and session management

**Frontend (GitHub Pages)**
- Static web client with Amazon Chime SDK v3.20.0
- Authentication UI with login/logout controls
- JWT token handling and API authorization
- Background filters (BackgroundBlurVideoFrameProcessor, BackgroundReplacementVideoFrameProcessor)
- Screen sharing controls and real-time participant roster
- Transform device pipeline with WebAssembly processing

**API Security (API Gateway)**
- JWT Cognito authorizer protecting all endpoints
- CORS configuration for cross-origin requests
- Automatic token validation before Lambda execution
- Rate limiting and throttling protection

**Backend (AWS Lambda)**
- Secure meeting creation with authenticated requests
- AWS SDK v3 for Chime service integration
- Node.js 18.x runtime with JWT validation
- Stateless, serverless architecture
- Does not process video/audio (handled by Chime WebRTC)

---

## 📁 Repository Structure

```
.
├── LICENSE
├── README.md
├── app.js                    # Main Chime SDK application logic
├── backend/                  # AWS Lambda backend
│   ├── createMeeting.js     # Meeting creation with Cognito auth
│   └── package.json
├── background-filters/       # WebAssembly background processing
│   ├── segmentation-simd.wasm
│   ├── segmentation.wasm
│   └── worker.js
├── docs/                     # Documentation
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   ├── INSTRUCTIONS.md
│   ├── ROADMAP.md
│   └── index.md
├── img/                      # Assets and diagrams
│   ├── aws_architecture.png
│   └── logo_dark.png
├── index.html               # Main application with Cognito integration
├── scripts/                 # Deployment and utility scripts
│   ├── cleanup.sh
│   ├── deploy-cognito-fix.sh
│   └── verify-cognito.sh
├── style.css                # Modern dark theme styling
└── template.yaml            # CloudFormation infrastructure
```

---

## 🎮 Quick Start

1. **Open the app**: Visit [GitHub Pages deployment](https://georges034302.github.io/aws-chime-client/)
2. **Login**: Click "Login" button to authenticate via AWS Cognito
3. **Complete authentication**: Use Cognito hosted UI to sign in
4. **Enter meeting details**: Meeting ID, your name, and AWS region
5. **Join meeting**: Click "Join Meeting" to connect (requires authentication)
6. **Enable video**: Click camera button to start video
7. **Choose background**: Select None/Blur/Image from dropdown
8. **Upload custom image**: Click "Upload Image" for virtual backgrounds
9. **Share screen**: Click screen share button (🖥️)
10. **View participants**: See real-time roster with mute status
11. **Logout**: Click "Logout" when finished

### Camera/Mic Controls
- Select devices from dropdown menus
- Click 🎤 to mute/unmute
- Click 🎥 to start/stop video
- Click ⛔ to leave meeting

---

## 🛠 Deployment

### Quick Deploy (v4.0)
```bash
# Deploy complete stack with Cognito authentication
./scripts/deploy-cognito-fix.sh

# Verify Cognito configuration
./scripts/verify-cognito.sh

# Start local development server
python3 -m http.server 8000
```

### Detailed Setup
See [`docs/INSTRUCTIONS.md`](docs/INSTRUCTIONS.md) for complete deployment guide including:
- AWS CLI and SAM CLI setup
- Cognito User Pool configuration
- Backend deployment to AWS
- Frontend configuration
- GitHub Pages hosting
- Multi-environment support

---

## ⚠️ Limitations
- Performance depends on device CPU/GPU capabilities
- Not designed for large-scale enterprise deployments
- Background filters require modern browser with WebAssembly support

---

## 📜 License
MIT License — see [`LICENSE`](LICENSE) file for details.

---

<sub><i><span style="color:#B0B0B0">👤 Author: Dr. Georges Bou Ghantous</span></i></sub>

