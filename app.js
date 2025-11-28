/**
 * AWS Chime Client - Using SDK v3 API
 */

const API_URL = "https://ytzz5sx9r1.execute-api.ap-southeast-2.amazonaws.com/prod/join";

// Check if Chime SDK is loaded
if (typeof ChimeSDK === 'undefined') {
  console.error('Amazon Chime SDK not loaded. Please check the script tag in index.html');
}

let meetingSession = null;
let audioVideo = null;
let isVideoOn = false;
let isAudioOn = true;

const statusEl = document.getElementById("status");
const joinButton = document.getElementById("joinButton");
const leaveButton = document.getElementById("leaveButton");
const toggleVideoButton = document.getElementById("toggleVideo");
const toggleAudioButton = document.getElementById("toggleAudio");
const cameraSelect = document.getElementById("cameraSelect");
const micSelect = document.getElementById("micSelect");
const bgModeSelect = document.getElementById("bgMode");

function setStatus(message) {
  statusEl.textContent = message;
}

async function fetchMeeting(meetingId, name, region) {
  const payload = { meetingId, name, region };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Backend error: ${res.status}`);
  }
  return await res.json();
}

async function joinMeeting() {
  try {
    const meetingId = document.getElementById("meetingId").value.trim();
    const name = document.getElementById("name").value.trim();
    const region = document.getElementById("region").value;

    if (!meetingId || !name) {
      setStatus("Please enter both meeting ID and your name.");
      return;
    }

    setStatus("Requesting meeting from backend...");
    joinButton.disabled = true;

    const { meeting, attendee } = await fetchMeeting(meetingId, name, region);

    const logger = new ChimeSDK.ConsoleLogger(
      "AWSChimeClient",
      ChimeSDK.LogLevel.INFO
    );
    const deviceController = new ChimeSDK.DefaultDeviceController(logger);

    const configuration = new ChimeSDK.MeetingSessionConfiguration(
      meeting,
      attendee
    );
    meetingSession = new ChimeSDK.DefaultMeetingSession(
      configuration,
      logger,
      deviceController
    );
    audioVideo = meetingSession.audioVideo;

    setStatus("Listing devices...");
    await populateDeviceLists();

    bindVideoTiles();

    setStatus("Joining audio...");
    await audioVideo.start();

    isAudioOn = true;
    toggleAudioButton.textContent = "Mute";

    setStatus("Meeting joined. Click 'Start Video' to enable camera.");
  } catch (err) {
    console.error(err);
    setStatus("Error joining meeting: " + err.message);
  } finally {
    joinButton.disabled = false;
  }
}

async function populateDeviceLists() {
  const devices = await audioVideo.listVideoInputDevices();
  cameraSelect.innerHTML = "";
  devices.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || d.deviceId;
    cameraSelect.appendChild(opt);
  });

  const mics = await audioVideo.listAudioInputDevices();
  micSelect.innerHTML = "";
  mics.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || d.deviceId;
    micSelect.appendChild(opt);
  });

  // Select first devices but don't start them yet
  if (devices.length > 0) {
    cameraSelect.value = devices[0].deviceId;
  }
  if (mics.length > 0) {
    micSelect.value = mics[0].deviceId;
    // Start audio input automatically
    await audioVideo.startAudioInput(mics[0].deviceId);
  }
}

function bindVideoTiles() {
  const observer = {
    videoTileDidUpdate: (tileState) => {
      if (!tileState.boundAttendeeId) {
        return;
      }
      
      const videoElement = tileState.localTile
        ? document.getElementById("localVideo") || createVideoElement("localVideo", "video-preview")
        : document.getElementById(`remoteVideo-${tileState.tileId}`) || createVideoElement(`remoteVideo-${tileState.tileId}`, "remote-videos");
      
      audioVideo.bindVideoElement(tileState.tileId, videoElement);
    },
    videoTileWasRemoved: (tileId) => {
      const el = document.getElementById(`remoteVideo-${tileId}`);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    },
  };
  
  audioVideo.addObserver(observer);
}

function createVideoElement(id, containerId) {
  const container = document.getElementById(containerId);
  const video = document.createElement("video");
  video.id = id;
  video.autoplay = true;
  video.muted = id === "localVideo";
  video.playsInline = true;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "cover";
  
  if (id === "localVideo") {
    container.innerHTML = "";
  }
  container.appendChild(video);
  return video;
}

async function toggleVideo() {
  if (!audioVideo) return;
  
  if (!isVideoOn) {
    try {
      const deviceId = cameraSelect.value;
      if (deviceId) {
        await audioVideo.startVideoInput(deviceId);
        audioVideo.startLocalVideoTile();
        isVideoOn = true;
        toggleVideoButton.textContent = "Stop Video";
        setStatus("Video started");
      }
    } catch (err) {
      console.error("Error starting video:", err);
      setStatus("Error starting video: " + err.message);
    }
  } else {
    try {
      audioVideo.stopLocalVideoTile();
      await audioVideo.stopVideoInput();
      isVideoOn = false;
      toggleVideoButton.textContent = "Start Video";
      setStatus("Video stopped");
    } catch (err) {
      console.error("Error stopping video:", err);
    }
  }
}

async function toggleAudio() {
  if (!audioVideo) return;
  
  if (isAudioOn) {
    audioVideo.realtimeMuteLocalAudio();
    isAudioOn = false;
    toggleAudioButton.textContent = "Unmute";
  } else {
    audioVideo.realtimeUnmuteLocalAudio();
    isAudioOn = true;
    toggleAudioButton.textContent = "Mute";
  }
}

async function leaveMeeting() {
  if (audioVideo) {
    if (isVideoOn) {
      audioVideo.stopLocalVideoTile();
      await audioVideo.stopVideoInput();
    }
    audioVideo.stop();
  }
  meetingSession = null;
  audioVideo = null;
  isVideoOn = false;
  isAudioOn = false;
  toggleVideoButton.textContent = "Start Video";
  toggleAudioButton.textContent = "Mute";
  
  // Clear video elements
  document.getElementById("video-preview").innerHTML = "";
  document.getElementById("remote-videos").innerHTML = "";
  
  setStatus("Left the meeting.");
}

joinButton.addEventListener("click", joinMeeting);
toggleVideoButton.addEventListener("click", toggleVideo);
toggleAudioButton.addEventListener("click", toggleAudio);
leaveButton.addEventListener("click", leaveMeeting);

// Camera/mic selection change handlers
cameraSelect.addEventListener("change", async () => {
  if (isVideoOn && audioVideo) {
    await audioVideo.startVideoInput(cameraSelect.value);
  }
});

micSelect.addEventListener("change", async () => {
  if (audioVideo) {
    await audioVideo.startAudioInput(micSelect.value);
  }
});