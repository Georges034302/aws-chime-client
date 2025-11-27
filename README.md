# AWS Chime Client — Custom Web Client with Virtual Backgrounds

## Overview
This project provides a lightweight, browser-based Amazon Chime SDK client designed to enable joining official Amazon Chime meetings using a custom virtual background. It is ideal for interviews, demos, and situations where a polished visual experience is required.

The frontend is fully hosted on GitHub Pages, while a minimal backend running on AWS (Lambda + API Gateway) handles meeting and attendee creation. All media flows directly through Amazon Chime’s WebRTC services.

---

## Purpose
The client demonstrates how a simplified and customizable Chime experience can be achieved without relying on the official desktop or mobile applications.  
It is built for scenarios where users want:
- A clean interface  
- Virtual background support  
- Lightweight, browser‑only access  
- Compatibility with standard Chime meetings  

---

## Key Features
- Virtual background image replacement  
- Background blur  
- Browser‑based video and audio controls  
- No installation required  
- Fully compatible with official Amazon Chime clients  
- Zero backend state (stateless meeting creation)  
- Free static hosting via GitHub Pages  

---

## High‑Level Architecture

The system is intentionally simple and consists of only two main components.

### 1. Frontend (GitHub Pages)
- Contains the web interface and Chime SDK logic  
- Performs all video processing locally in the browser  
- Applies virtual background and blur  
- Connects directly to Amazon Chime’s media infrastructure  

### 2. Backend (AWS Lambda + API Gateway)
- Creates a new meeting and attendee when requested by the frontend  
- Does not handle any media  
- Stateless, lightweight, and inexpensive  
- Integrates directly with Amazon Chime’s signaling APIs  

---

## Architecture Diagram

```
GitHub Pages (Frontend)
        │
        ▼
API Gateway (HTTPS Endpoint)
        │
        ▼
AWS Lambda (Meeting / Attendee Creation)
        │
        ▼
Amazon Chime Media Services (WebRTC)
        │
        ▼
Other Chime Participants (Official Chime App)
```

---

## Repository Structure

```
aws-chime-client/
│── index.html
│── app.js
│── style.css
│── img/
│    └── background.jpg
│── backend/
│    └── createMeeting.js
│── architecture.png
│── logo.png
│── README.md
│── LICENSE
```

---

## Deployment Model

### Frontend (GitHub Pages)
The client is deployed as static files.  
GitHub Pages provides the hosting automatically once the repository’s Pages settings are enabled.

### Backend (AWS)
The backend uses:
- A single Lambda function  
- An HTTP endpoint exposed through API Gateway  
- CORS‑enabled request flow  

The backend only runs when the user requests to join a meeting.

---

## Usage Flow

1. User opens the hosted web client  
2. User enters or fetches a meeting identifier  
3. The client requests the meeting details from the AWS backend  
4. The backend returns the meeting and attendee information  
5. The browser joins the meeting using the Chime SDK  
6. The user selects a virtual background  
7. Video is streamed with background transformation applied  

---

## Limitations
- The official Amazon Chime app cannot be modified  
- This client must be used independently  
- Video segmentation performance depends on the user’s CPU/GPU  
- Not optimized for large meetings  

---

## License
This project is distributed under the MIT License.  
See **LICENSE** file in this repository for full terms.

---

## Maintainer
**Georges Bou Ghantous**  
Suggestions and contributions are welcome.
