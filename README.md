# AWS Chime Client
[<img src="https://github.com/user-attachments/assets/9db7a38b-5df2-4696-b584-ab37c5b8ba3d" width="100" style="margin-right: 20px; margin-top: 5px;" />](https://georges034302.github.io/aws-chime-client/)
<br>
## 🌐 Overview
The **AWS Chime Client** is a lightweight, browser‑based web application that enables users to join official Amazon Chime meetings with a **virtual background** or **background blur**.  
It provides a clean UI, requires **no installation**, and works seamlessly with standard Amazon Chime participants.

Built with **Amazon Chime SDK v3** on the frontend and **AWS SDK v3** on the backend, the application leverages modern JavaScript APIs for optimal performance.

The frontend is served through **GitHub Pages**, while a small, stateless backend on AWS handles meeting creation.  
All video/audio media flows directly through Amazon Chime's WebRTC infrastructure.

---

## 🎯 Purpose
This project is ideal for:  
- **Interviews** requiring a clean background  
- **Professional demos**  
- **Testing Chime SDK video pipelines**  
- Users needing a simple browser‑based alternative to the official Chime app  

The goal is to demonstrate how a minimal, elegant Chime client can be built using modern browser capabilities and AWS‑managed services.

---

## 🚀 Key Features
- **Background blur** using BackgroundBlurVideoFrameProcessor  
- **Virtual background replacement** with custom image upload  
- **Transform device pipeline** for real-time video effects with helper functions  
- **Clean code architecture** with applyTransform() and stopVideoWithCleanup() helpers  
- Browser‑based video/audio controls with device selection  
- Zero installation (browser‑only)  
- Free static hosting via GitHub Pages  
- Interoperable with official Amazon Chime clients  
- Stateless AWS backend (Lambda + API Gateway)  
- Runtime WASM/model loading from AWS CDN  

---

## 🏗 High‑Level Architecture

### 1️⃣ Frontend — GitHub Pages
- Lightweight static web client  
- Uses Amazon Chime SDK JavaScript v3.20.0 (loaded via esm.sh CDN)  
- Clean SDK loading with minimal global namespace pollution  
- Background filters: BackgroundBlurVideoFrameProcessor & BackgroundReplacementVideoFrameProcessor  
- Transform device pipeline for real-time video effects  
- Helper functions (applyTransform, stopVideoWithCleanup) for maintainable code  
- Handles UI, device selection, and video processing  
- WASM segmentation models loaded from AWS CDN at runtime  
- Connects directly to Chime WebRTC services  
- No servers or deployments required  

### 2️⃣ Backend — AWS Lambda + API Gateway
- Creates new meetings and attendees using AWS SDK v3  
- Built with @aws-sdk/client-chime-sdk-meetings package  
- Node.js 18.x runtime with CommonJS modules  
- Stateless and extremely low‑cost  
- Exposed via a single HTTPS endpoint  
- Does **not** process video or audio  

---

## 🧩 Architecture Diagram

```
GitHub Pages (Frontend)
        │
        ▼
API Gateway (HTTPS Endpoint)
        │
        ▼
AWS Lambda (Meeting + Attendee Creation)
        │
        ▼
Amazon Chime Media Services (WebRTC)
        │
        ▼
Other Chime Participants (Official Chime App)
```

---

## 📁 Repository Structure

```
aws-chime-client/
├── LICENSE
├── README.md
├── app.js                     ← Frontend JavaScript (SDK v3 + Background Filters)
├── backend/
│   ├── createMeeting.js       ← Lambda handler (AWS SDK v3)
│   └── package.json           ← Dependencies (@aws-sdk/client-chime-sdk-meetings)
├── cleanup.sh                 ← Cleanup script
├── docs/
│   ├── CHANGELOG.md
│   ├── CONTRIBUTING.md
│   ├── INSTRUCTIONS.md        ← This file
│   ├── ROADMAP.md
│   └── index.md
├── img/
│   ├── aws_architecture.png
│   └── logo_dark.png
├── index.html                 ← Frontend HTML
├── samconfig.toml             ← SAM deployment config (auto-generated)
├── style.css                  ← Frontend CSS
└── template.yaml              ← SAM template
```

---

## 🚀 Deployment Model

### 🌐 Frontend Hosting (GitHub Pages)
- Provides static, globally available hosting  
- No maintenance required  
- Instant redeployment via repo updates  
- Accessible via a public HTTPS URL  

### ☁️ Backend Hosting (AWS)
- Lambda function triggered by API Gateway  
- Stateless, highly reliable, low‑cost  
- Only invoked during meeting join requests  
- Completely independent of video media traffic  

---

## 🎮 Usage Overview
1. Open the GitHub Pages‑hosted site  
2. Enter meeting ID and your name  
3. The client requests meeting credentials from AWS Lambda  
4. Join the meeting via the browser  
5. Click "Start Video" to enable camera  
6. Select camera and microphone from device dropdowns  
7. Choose background mode:  
   - **None**: Regular camera feed  
   - **Blur**: Apply background blur effect  
   - **Image**: Upload and apply custom background image  
8. Video appears with applied background effects in real-time  
9. Switch cameras while preserving background effects  

---

## ⚠️ Limitations
- The official Amazon Chime application cannot be modified  
- Performance may vary depending on CPU/GPU capabilities  
- Not intended for large‑scale enterprise meetings  

---

## 📜 License
This project is distributed under the **MIT License**.  
See the `LICENSE` file for full details.

---

## 👤 Author ✍️
**Georges Bou Ghantous**  
Suggestions and contributions are appreciated!

