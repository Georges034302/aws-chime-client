# AWS Chime Client
[<img src="https://github.com/user-attachments/assets/9db7a38b-5df2-4696-b584-ab37c5b8ba3d" width="100" style="margin-right: 20px; margin-top: 5px;" />](https://georges034302.github.io/aws-chime-client/)

## 🌐 Overview
A lightweight, browser‑based **Amazon Chime SDK v3** client with advanced video features including background blur, virtual backgrounds, screen sharing, and real-time participant roster.

**No installation required** — works directly in your browser and interoperates seamlessly with official Amazon Chime participants.

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
- Free hosting via GitHub Pages

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
- WASM models loaded from AWS CDN at runtime

**Backend (AWS Lambda)**
- Creates meetings and attendees via AWS SDK v3
- Node.js 18.x runtime
- Stateless, serverless, low-cost
- Does not process video/audio

---

## 📁 Repository Structure

```
aws-chime-client/
├── app.js                     ← Frontend logic (SDK v3)
├── index.html                 ← HTML structure
├── style.css                  ← Styling
├── backend/
│   ├── createMeeting.js       ← Lambda handler
│   └── package.json           ← Dependencies
├── template.yaml              ← SAM CloudFormation template
├── docs/
│   ├── INSTRUCTIONS.md        ← Deployment guide
│   ├── CHANGELOG.md           ← Version history
│   └── ROADMAP.md             ← Feature roadmap
└── img/                       ← Assets
```

---

## 🎮 Quick Start

1. **Open the app**: Visit [GitHub Pages deployment](https://georges034302.github.io/aws-chime-client/)
2. **Enter meeting details**: Meeting ID, your name, and AWS region
3. **Join meeting**: Click "Join Meeting" to connect
4. **Enable video**: Click camera button to start video
5. **Choose background**: Select None/Blur/Image from dropdown
6. **Upload custom image**: Click "Upload Image" for virtual backgrounds
7. **Share screen**: Click screen share button (🖥️)
8. **View participants**: See real-time roster with mute status

### Camera/Mic Controls
- Select devices from dropdown menus
- Click 🎤 to mute/unmute
- Click 🎥 to start/stop video
- Click ⛔ to leave meeting

---

## 🛠 Deployment

See [`docs/INSTRUCTIONS.md`](docs/INSTRUCTIONS.md) for complete deployment guide including:
- AWS CLI and SAM CLI setup
- Backend deployment to AWS
- Frontend configuration
- GitHub Pages hosting

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

