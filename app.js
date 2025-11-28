/**
 * AWS Chime Client - SDK v3 (Background Blur + Replacement)
 */

const API_URL =
  "https://ytzz5sx9r1.execute-api.ap-southeast-2.amazonaws.com/prod/join";

let meetingSession = null;
let audioVideo = null;
let isVideoOn = false;
let isAudioOn = true;
let currentProcessor = null;
let videoTransformDevice = null;

const statusEl = document.getElementById("status");
const joinButton = document.getElementById("joinButton");
const leaveButton = document.getElementById("leaveButton");
const toggleVideoButton = document.getElementById("toggleVideo");
const toggleAudioButton = document.getElementById("toggleAudio");
const cameraSelect = document.getElementById("cameraSelect");
const micSelect = document.getElementById("micSelect");
const bgModeSelect = document.getElementById("bgMode");
const bgImageInput = document.getElementById("bgImage");

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
      setStatus("Please enter meeting ID and your name.");
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

    await populateDeviceLists();
    bindVideoTiles();

    setStatus("Joining meeting...");
    await audioVideo.start();

    isAudioOn = true;
    toggleAudioButton.textContent = "Mute";

    setStatus("Meeting joined. Click Start Video.");
  } catch (err) {
    console.error(err);
    setStatus("Error joining meeting: " + err.message);
  } finally {
    joinButton.disabled = false;
  }
}

async function populateDeviceLists() {
  const videoDevices = await audioVideo.listVideoInputDevices();
  cameraSelect.innerHTML = "";
  videoDevices.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || d.deviceId;
    cameraSelect.appendChild(opt);
  });

  const audioDevices = await audioVideo.listAudioInputDevices();
  micSelect.innerHTML = "";
  audioDevices.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = d.deviceId;
    opt.textContent = d.label || d.deviceId;
    micSelect.appendChild(opt);
  });

  if (audioDevices.length > 0) {
    await audioVideo.startAudioInput(audioDevices[0].deviceId);
  }
}

function bindVideoTiles() {
  audioVideo.addObserver({
    videoTileDidUpdate: (tileState) => {
      if (!tileState.boundAttendeeId) return;

      const isLocal = tileState.localTile;
      const containerId = isLocal ? "video-preview" : "remote-videos";
      const id = isLocal ? "localVideo" : `remoteVideo-${tileState.tileId}`;

      const container = document.getElementById(containerId);
      let video = document.getElementById(id);

      if (!video) {
        video = document.createElement("video");
        video.id = id;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = isLocal;
        video.style.width = "100%";
        video.style.height = "100%";
        video.style.objectFit = "cover";

        if (isLocal) container.innerHTML = "";
        container.appendChild(video);
      }

      audioVideo.bindVideoElement(tileState.tileId, video);
    },
  });
}

async function toggleVideo() {
  if (!audioVideo) return;

  if (!isVideoOn) {
    const deviceId = cameraSelect.value;

    // Start video (no background yet)
    await audioVideo.startVideoInput(deviceId);
    audioVideo.startLocalVideoTile();

    isVideoOn = true;
    toggleVideoButton.textContent = "Stop Video";
    setStatus("Video started");
  } else {
    await stopVideoWithCleanup();
    setStatus("Video stopped");
  }
}

async function stopVideoWithCleanup() {
  if (isVideoOn) {
    audioVideo.stopLocalVideoTile();
    await audioVideo.stopVideoInput();

    if (currentProcessor) {
      await currentProcessor.destroy();
      currentProcessor = null;
    }
    videoTransformDevice = null;
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
  await stopVideoWithCleanup();
  if (audioVideo) audioVideo.stop();

  meetingSession = null;
  audioVideo = null;

  document.getElementById("video-preview").innerHTML = "";
  document.getElementById("remote-videos").innerHTML = "";

  setStatus("Left the meeting.");
}

/* ---------------------- BACKGROUND EFFECTS ----------------------- */

bgModeSelect.addEventListener("change", async () => {
  if (!isVideoOn || !audioVideo) {
    setStatus("Start video before applying background effects.");
    return;
  }

  const mode = bgModeSelect.value;
  const deviceId = cameraSelect.value;

  try {
    setStatus("Applying background effect…");

    // Clean previous processor
    if (currentProcessor) {
      await currentProcessor.destroy();
      currentProcessor = null;
    }

    const workerURL =
      "https://esm.sh/amazon-chime-sdk-js@3.20.0/build/background-filters/worker.js";
    const wasmURL =
      "https://esm.sh/amazon-chime-sdk-js@3.20.0/build/background-filters/segmentation.wasm";

    if (mode === "blur") {
      currentProcessor =
        await ChimeSDK.BackgroundBlurVideoFrameProcessor.create({
          paths: { worker: workerURL, wasm: wasmURL },
          blurStrength: 40,
        });

      await applyTransform(deviceId);
      setStatus("Background blur applied");

    } else if (mode === "image") {
      const file = bgImageInput.files[0];
      if (!file) {
        setStatus("Upload an image first.");
        bgModeSelect.value = "none";
        return;
      }

      // Convert uploaded image → ImageBitmap
      const bitmap = await createImageBitmap(file);

      currentProcessor =
        await ChimeSDK.BackgroundReplacementVideoFrameProcessor.create({
          paths: { worker: workerURL, wasm: wasmURL },
          replacementImage: bitmap,
        });

      await applyTransform(deviceId);
      setStatus("Background image applied");

    } else {
      // mode = none
      await audioVideo.stopVideoInput();
      await audioVideo.startVideoInput(deviceId);
      audioVideo.startLocalVideoTile();
      setStatus("Background removed");
    }
  } catch (err) {
    console.error(err);
    setStatus("Error applying background: " + err.message);
    bgModeSelect.value = "none";
  }
});

async function applyTransform(deviceId) {
  await audioVideo.stopVideoInput();

  videoTransformDevice = new ChimeSDK.DefaultVideoTransformDevice(
    meetingSession.deviceController,
    deviceId,
    [currentProcessor]
  );

  await audioVideo.startVideoInput(videoTransformDevice);
  audioVideo.startLocalVideoTile();
}

/* ---------------------- EVENT LISTENERS ----------------------- */

joinButton.addEventListener("click", joinMeeting);
leaveButton.addEventListener("click", leaveMeeting);
toggleVideoButton.addEventListener("click", toggleVideo);
toggleAudioButton.addEventListener("click", toggleAudio);

cameraSelect.addEventListener("change", async () => {
  if (isVideoOn) {
    if (currentProcessor) {
      await applyTransform(cameraSelect.value);
    } else {
      await audioVideo.startVideoInput(cameraSelect.value);
    }
  }
});

micSelect.addEventListener("change", async () => {
  if (audioVideo) {
    await audioVideo.startAudioInput(micSelect.value);
  }
});
