/**
 * Basic AWS Chime Client front-end wiring.
 * This is a starter template; you must set API_URL to your API Gateway endpoint
 * that returns { meeting, attendee } from the backend Lambda.
 */

const API_URL = "https://ytzz5sx9r1.execute-api.ap-southeast-2.amazonaws.com/prod/join";

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
  return await res.json(); // expected: { meeting, attendee }
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

    setStatus("Meeting joined. You can now start video and choose background.");
  } catch (err) {
    console.error(err);
    setStatus("Error joining meeting: " + err.message);
  } finally {
    joinButton.disabled = false;
  }
}

async function populateDeviceLists() {
  const devices = await meetingSession.audioVideo.listVideoInputDevices();
  cameraSelect.innerHTML = "";
  devices.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || d.deviceId;
    cameraSelect.appendChild(opt);
  });

  const mics = await meetingSession.audioVideo.listAudioInputDevices();
  micSelect.innerHTML = "";
  mics.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || d.deviceId;
    micSelect.appendChild(opt);
  });

  if (devices[0]) {
    await meetingSession.audioVideo.chooseVideoInputDevice(devices[0].deviceId);
  }
  if (mics[0]) {
    await meetingSession.audioVideo.chooseAudioInputDevice(mics[0].deviceId);
  }
}

function bindVideoTiles() {
  const previewEl = document.getElementById("video-preview");
  const remoteContainer = document.getElementById("remote-videos");

  audioVideo.bindVideoElement(1, createOrGetVideoElement(previewEl, "localVideo"));

  audioVideo.observeVideoTile({
    videoTileDidUpdate: (tileState) => {
      if (!tileState.boundAttendeeId || tileState.localTile) {
        return;
      }
      const tileId = tileState.tileId;
      const videoEl = createOrGetVideoElement(
        remoteContainer,
        `remoteVideo-${tileId}`
      );
      audioVideo.bindVideoElement(tileId, videoEl);
    },
    videoTileWasRemoved: (tileId) => {
      const el = document.getElementById(`remoteVideo-${tileId}`);
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    },
  });
}

function createOrGetVideoElement(container, id) {
  let video = document.getElementById(id);
  if (!video) {
    video = document.createElement("video");
    video.id = id;
    video.autoplay = true;
    video.muted = id === "localVideo";
    video.playsInline = true;
    container.innerHTML = "";
    container.appendChild(video);
  }
  return video;
}

async function toggleVideo() {
  if (!audioVideo) return;
  if (!isVideoOn) {
    await audioVideo.startLocalVideoTile();
    isVideoOn = true;
    toggleVideoButton.textContent = "Stop Video";
  } else {
    await audioVideo.stopLocalVideoTile();
    isVideoOn = false;
    toggleVideoButton.textContent = "Start Video";
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
    audioVideo.stop();
  }
  meetingSession = null;
  audioVideo = null;
  isVideoOn = false;
  isAudioOn = false;
  toggleVideoButton.textContent = "Toggle Video";
  toggleAudioButton.textContent = "Toggle Audio";
  setStatus("Left the meeting.");
}

joinButton.addEventListener("click", joinMeeting);
toggleVideoButton.addEventListener("click", toggleVideo);
toggleAudioButton.addEventListener("click", toggleAudio);
leaveButton.addEventListener("click", leaveMeeting);

// NOTE: Background blur / replacement requires Chime SDK background filters module.
// That wiring can be added later by creating a VideoTransformDevice and
// plugging it into the chosen video input. This starter keeps it simple.