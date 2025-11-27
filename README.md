# AWS Chime Client
[<img src="https://github.com/user-attachments/assets/9db7a38b-5df2-4696-b584-ab37c5b8ba3d" width="100" style="margin-right: 20px; margin-top: 5px;" />](https://georges034302.github.io/aws-chime-client/)
<br>
## 🌐 Overview
The **AWS Chime Client** is a lightweight, browser‑based web application that enables users to join official Amazon Chime meetings with a **virtual background** or **background blur**.  
It provides a clean UI, requires **no installation**, and works seamlessly with standard Amazon Chime participants.

The frontend is served through **GitHub Pages**, while a small, stateless backend on AWS handles meeting creation.  
All video/audio media flows directly through Amazon Chime’s WebRTC infrastructure.

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
- **Virtual background replacement**  
- **Background blur**  
- Browser‑based video/audio controls  
- Zero installation (browser‑only)  
- Free static hosting via GitHub Pages  
- Interoperable with official Amazon Chime clients  
- Stateless AWS backend (Lambda + API Gateway)  

---

## 🏗 High‑Level Architecture

### 1️⃣ Frontend — GitHub Pages
- Lightweight static web client  
- Handles UI and video processing  
- Applies background image and blur  
- Connects directly to Chime WebRTC services  
- No servers or deployments required  

### 2️⃣ Backend — AWS Lambda + API Gateway
- Creates new meetings and attendees  
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
│── template.yaml              ← SAM template (must be in root)
│── backend/
│    └── createMeeting.js     ← Lambda handler
│── index.html
│── app.js                     ← Frontend 
│── style.css
│── docs/
│    └── CONTRIBUTING.md
│    └── CHANGELOG.md
│    └── CROADMAP.md
│    └── index.md
│── img/
│    └── logo_dark.png
│    └── aws_architecture.png
│── LICENSE
└── README.md
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
2. Enter or generate a meeting identifier  
3. The client requests meeting credentials from AWS  
4. Join the meeting via the browser  
5. Choose a virtual background or enable blur  
6. Video appears with applied background effects  

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

