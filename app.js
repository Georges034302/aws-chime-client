/**
 * AWS Chime Client - Full SDK v3 Client
 * Includes:
 * - Join Meeting
 * - Video + Audio
 * - Background Blur
 * - Background Replacement
 * - Screen Sharing (start/stop)
 */

const API_URL = "https://ytzz5sx9r1.execute-api.ap-southeast-2.amazonaws.com/prod/join";

let meetingSession = null;
let audioVideo = null;
let logger = null;

let isVideoOn = false;
let isAudioOn = true;
let isSharingScreen = false;

let currentProcessor = null;
let selectedBackgroundImage = null;

// UI References - will be initialized after DOM loads
let statusEl, joinButton, leaveButton, toggleVideoButton, toggleAudioButton;
let shareButton, cameraSelect, micSelect, bgModeSelect, rosterList;
const roster = {}; // attendeeId → { name, muted, isContent }


/* -------------------------------------------------------------
 * Helper
 * ------------------------------------------------------------- */
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg;
}

function updateRosterUI() {
  rosterList.innerHTML = "";

  Object.values(roster).forEach((att) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span class="roster-name">${att.name}</span>
      <span class="roster-icons">
        ${att.isContent ? "🖥️" : ""}
        ${att.muted ? "🔇" : "🎤"}
      </span>
    `;

    rosterList.appendChild(li);
  });
}


/* -------------------------------------------------------------
 * Backend Request
 * ------------------------------------------------------------- */
async function fetchMeeting(meetingId, name, region) {
  const payload = { meetingId, name, region };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Backend error ${res.status}`);
  }

  return await res.json();
}


/* -------------------------------------------------------------
 * Join Meeting
 * ------------------------------------------------------------- */
async function joinMeeting() {
  try {
    const meetingId = document.getElementById("meetingId").value.trim();
    const name = document.getElementById("name").value.trim();
    const region = document.getElementById("region").value;

    if (!meetingId || !name) {
      setStatus("Please enter meeting ID and your name.");
      return;
    }

    setStatus("Requesting meeting...");
    joinButton.disabled = true;

    const { meeting, attendee } = await fetchMeeting(meetingId, name, region);

    logger = new ChimeSDK.ConsoleLogger(
      "ChimeClient",
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

    // -----------------------
    // ROSTER OBSERVERS
    // -----------------------
    audioVideo.realtimeSubscribeToAttendeeIdPresence((attendeeId, present, externalUserId, dropped) => {
      if (present) {
        // Extract name (externalUserId is "name#something")
        const displayName = externalUserId.split("#")[0];

        roster[attendeeId] = {
          name: displayName,
          muted: false,
          isContent: false
        };
      } else {
        delete roster[attendeeId];
      }
      updateRosterUI();
    });

    audioVideo.realtimeSubscribeToMuteAndUnmuteLocalAudio((muted) => {
      const localId = meetingSession.configuration.credentials.attendeeId;
      if (roster[localId]) {
        roster[localId].muted = muted;
        updateRosterUI();
      }
    });

    audioVideo.realtimeSubscribeToVolumeIndicator(
      null,
      (attendeeId, volume, muted, signalStrength) => {
        if (roster[attendeeId]) {
          roster[attendeeId].muted = muted;
          updateRosterUI();
        }
      }
    );

    await populateDeviceLists();
    bindVideoTiles();

    setStatus("Joining audio...");
    await audioVideo.start();

    toggleAudioButton.textContent = "Mute";
    isAudioOn = true;

    setStatus("Meeting joined. Start video when ready.");

  } catch (err) {
    console.error(err);
    setStatus("Join error: " + err.message);
  } finally {
    joinButton.disabled = false;
  }
}


/* -------------------------------------------------------------
 * Populate Devices
 * ------------------------------------------------------------- */
async function populateDeviceLists() {
  const videos = await audioVideo.listVideoInputDevices();
  cameraSelect.innerHTML = "";
  videos.forEach((d) => {
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

  if (videos.length > 0) cameraSelect.value = videos[0].deviceId;
  if (mics.length > 0) {
    micSelect.value = mics[0].deviceId;
    await audioVideo.startAudioInput(mics[0].deviceId);
  }
}


/* -------------------------------------------------------------
 * Video Tile Binding
 * ------------------------------------------------------------- */
function bindVideoTiles() {
  const previewContainer = document.getElementById("video-preview");
  const remoteContainer = document.getElementById("remote-videos");

  const observer = {
    videoTileDidUpdate: (tileState) => {
      if (!tileState.boundAttendeeId) return;

      // Update roster for screen share indicator
      if (tileState.isContent) {
        if (roster[tileState.boundAttendeeId]) {
          roster[tileState.boundAttendeeId].isContent = true;
          updateRosterUI();
        }
      } else {
        if (roster[tileState.boundAttendeeId]) {
          roster[tileState.boundAttendeeId].isContent = false;
          updateRosterUI();
        }
      }

      let elementId;
      let container;

      if (tileState.isContent) {
        // Screen share tile
        elementId = "screenShareTile";
        container = remoteContainer;
      } else if (tileState.localTile) {
        elementId = "localVideo";
        container = previewContainer;
      } else {
        elementId = `remoteVideo-${tileState.tileId}`;
        container = remoteContainer;
      }

      const videoEl = createVideoElement(elementId, container);
      audioVideo.bindVideoElement(tileState.tileId, videoEl);
    },

    videoTileWasRemoved: (tileId) => {
      const el = document.getElementById(`remoteVideo-${tileId}`);
      if (el?.parentNode) el.parentNode.removeChild(el);
    },
  };

  audioVideo.addObserver(observer);
}


function createVideoElement(id, container) {
  let video = document.getElementById(id);

  if (!video) {
    video = document.createElement("video");
    video.id = id;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = id === "localVideo";
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";

    if (id === "localVideo") {
      container.innerHTML = "";
    }

    container.appendChild(video);
  }

  return video;
}


/* -------------------------------------------------------------
 * Video Toggle
 * ------------------------------------------------------------- */
async function toggleVideo() {
  if (!audioVideo) return;

  try {
    if (!isVideoOn) {
      const deviceId = cameraSelect.value;
      await audioVideo.startVideoInput(deviceId);
      audioVideo.startLocalVideoTile();

      isVideoOn = true;
      toggleVideoButton.textContent = "Stop Video";
      setStatus("Video started");
    } else {
      audioVideo.stopLocalVideoTile();
      await audioVideo.stopVideoInput();

      if (currentProcessor) {
        await currentProcessor.destroy();
        currentProcessor = null;
      }

      isVideoOn = false;
      toggleVideoButton.textContent = "Start Video";
      bgModeSelect.value = "none";
      setStatus("Video stopped");
    }
  } catch (err) {
    console.error(err);
    setStatus("Video error: " + err.message);
  }
}


/* -------------------------------------------------------------
 * Audio Toggle
 * ------------------------------------------------------------- */
async function toggleAudio() {
  if (!audioVideo) return;

  if (isAudioOn) {
    audioVideo.realtimeMuteLocalAudio();
    toggleAudioButton.textContent = "Unmute";
    isAudioOn = false;
  } else {
    audioVideo.realtimeUnmuteLocalAudio();
    toggleAudioButton.textContent = "Mute";
    isAudioOn = true;
  }
}


/* -------------------------------------------------------------
 * Screen Sharing
 * ------------------------------------------------------------- */
async function toggleScreenShare() {
  if (!audioVideo) return;

  try {
    if (!isSharingScreen) {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });

      await audioVideo.startContentShare(stream);

      isSharingScreen = true;
      shareButton.textContent = "Stop Sharing";
      setStatus("Screen sharing started");

    } else {
      await audioVideo.stopContentShare();

      isSharingScreen = false;
      shareButton.textContent = "Share Screen";
      setStatus("Screen sharing stopped");
    }
  } catch (err) {
    console.error("Screen share error:", err);
    setStatus("Screen share error: " + err.message);
  }
}


/* -------------------------------------------------------------
 * Leave Meeting
 * ------------------------------------------------------------- */
async function leaveMeeting() {
  if (isVideoOn) {
    audioVideo.stopLocalVideoTile();
    await audioVideo.stopVideoInput();
  }

  if (isSharingScreen) {
    await audioVideo.stopContentShare();
  }

  audioVideo.stop();

  if (currentProcessor) {
    await currentProcessor.destroy();
    currentProcessor = null;
  }

  document.getElementById("video-preview").innerHTML = "";
  document.getElementById("remote-videos").innerHTML = "";

  meetingSession = null;
  audioVideo = null;
  isVideoOn = false;
  isAudioOn = false;
  isSharingScreen = false;
  selectedBackgroundImage = null;

  toggleVideoButton.textContent = "Start Video";
  toggleAudioButton.textContent = "Mute";
  shareButton.textContent = "Share Screen";
  bgModeSelect.value = "none";

  setStatus("Left the meeting.");
}


/* -------------------------------------------------------------
 * Event Bindings
 * ------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI references
  statusEl = document.getElementById("status");
  joinButton = document.getElementById("joinButton");
  leaveButton = document.getElementById("leaveButton");
  toggleVideoButton = document.getElementById("toggleVideo");
  toggleAudioButton = document.getElementById("toggleAudio");
  shareButton = document.getElementById("shareScreen");
  cameraSelect = document.getElementById("cameraSelect");
  micSelect = document.getElementById("micSelect");
  bgModeSelect = document.getElementById("bgMode");
  rosterList = document.getElementById("participantsList");

  // Attach event listeners
  joinButton.addEventListener("click", joinMeeting);
  toggleVideoButton.addEventListener("click", toggleVideo);
  toggleAudioButton.addEventListener("click", toggleAudio);
  shareButton.addEventListener("click", toggleScreenShare);
  leaveButton.addEventListener("click", leaveMeeting);

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

  // Background image upload
  document.getElementById("bgImage").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    selectedBackgroundImage = file;
    setStatus("Background image loaded.");
  });

  // Background mode change
  bgModeSelect.addEventListener("change", async () => {
    if (!audioVideo || !isVideoOn) {
      setStatus("Start video first.");
      bgModeSelect.value = "none";
      return;
    }

    const mode = bgModeSelect.value;
    const deviceId = cameraSelect.value;

    try {
      setStatus("Applying background...");

      if (currentProcessor) {
        await currentProcessor.destroy();
        currentProcessor = null;
      }

      if (mode === "none") {
        await audioVideo.stopVideoInput();
        await audioVideo.startVideoInput(deviceId);
        audioVideo.startLocalVideoTile();
        setStatus("Background removed");
        return;
      }

      if (mode === "blur") {
        const spec = {
          paths: {
            worker: 'https://georges034302.github.io/aws-chime-client/public/background-filters/worker.js',
            wasm: 'https://georges034302.github.io/aws-chime-client/public/background-filters/segmentation.wasm',
            simd: 'https://georges034302.github.io/aws-chime-client/public/background-filters/segmentation-simd.wasm'
          },
          blurStrength: 40
        };
        currentProcessor = await ChimeSDK.BackgroundBlurVideoFrameProcessor.create(spec);
      }

      if (mode === "image") {
        if (!selectedBackgroundImage) {
          setStatus("Upload a background image first.");
          bgModeSelect.value = "none";
          return;
        }

        const spec = {
          paths: {
            worker: 'https://georges034302.github.io/aws-chime-client/public/background-filters/worker.js',
            wasm: 'https://georges034302.github.io/aws-chime-client/public/background-filters/segmentation.wasm',
            simd: 'https://georges034302.github.io/aws-chime-client/public/background-filters/segmentation-simd.wasm'
          },
          imageBlob: selectedBackgroundImage
        };
        currentProcessor = await ChimeSDK.BackgroundReplacementVideoFrameProcessor.create(spec);
      }

      // Wrap processor in DefaultVideoTransformDevice
      const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(
        audioVideo.deviceController,
        deviceId,
        [currentProcessor]
      );

      await audioVideo.stopVideoInput();
      await audioVideo.startVideoInput(transformDevice);

      audioVideo.startLocalVideoTile();
      setStatus("Background applied.");

    } catch (err) {
      console.error("Background error:", err);
      setStatus("Background error: " + err.message);
      bgModeSelect.value = "none";
    }
  });
});
