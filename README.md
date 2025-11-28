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

## 🚀 Key Features

### 🔐 Security & Authentication
- **AWS Cognito authentication** with hosted UI
- **JWT token-based authorization** for API access
- **Enterprise-ready security** with user pool management
- **Cross-platform login** (localhost + GitHub Pages)

### Video & Audio
- **Background blur** with configurable strength
- **Custom virtual backgrounds** via image upload
- **Screen sharing** with dedicated display tile
- Camera and microphone device selection
- Real-time video transform pipeline

### Collaboration
- **Live participants roster** with join/leave tracking
- **Mute status indicators** (🎤/🔇) for all attendees
- **Screen sharing presence** (🖥️) in participant list
- Compatible with official Chime clients

### Technical
- Modern glassmorphism UI with intuitive controls
- Clean code architecture with helper functions
- Zero installation — runs entirely in browser
- Runtime WASM loading for background filters
- AWS infrastructure deployment via SAM

---

## 🏗 Architecture

```
┌─────────────────────────┐
│   GitHub Pages          │
│   (Static Frontend)     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   API Gateway           │
│   (HTTPS Endpoint)      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Lambda Function       │
│   (Meeting Creation)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Amazon Chime Services │
│   (WebRTC Media)        │
└─────────────────────────┘
```

**Components:**

**Frontend (GitHub Pages)**
- Static web client with Amazon Chime SDK v3.20.0
- Background filters (BackgroundBlurVideoFrameProcessor, BackgroundReplacementVideoFrameProcessor)
- Screen sharing controls
- Real-time participant roster
- Transform device pipeline
- WASM models hosted in `public/background-filters/` directory

**Backend (AWS Lambda)**
- Creates meetings and attendees via AWS SDK v3
- Node.js 18.x runtime
- Stateless, serverless, low-cost
- Does not process video/audio

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

## 👤 Author
**Georges Bou Ghantous**  
Contributions and suggestions welcome!

