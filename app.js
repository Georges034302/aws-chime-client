/**
 * AWS Chime Client - Using SDK v3 API
 */

const API_URL = "https://ytzz5sx9r1.execute-api.ap-southeast-2.amazonaws.com/prod/join";

let meetingSession = null;
let audioVideo = null;
let isVideoOn = false;
let isAudioOn = true;
let currentProcessor = null;

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
      
      // Clean up background processor
      if (currentProcessor) {
        await currentProcessor.destroy();
        currentProcessor = null;
        bgModeSelect.value = "none";
      }
      
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
  
  // Clean up background processor
  if (currentProcessor) {
    await currentProcessor.destroy();
    currentProcessor = null;
  }
  
  meetingSession = null;
  audioVideo = null;
  isVideoOn = false;
  isAudioOn = false;
  toggleVideoButton.textContent = "Start Video";
  toggleAudioButton.textContent = "Mute";
  bgModeSelect.value = "none";
  
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
    const deviceId = cameraSelect.value;
    
    // If background processor is active, recreate transform device
    if (currentProcessor) {
      try {
        await audioVideo.stopVideoInput();
        const transformDevice = await currentProcessor.createTransformDevice(deviceId);
        await audioVideo.startVideoInput(transformDevice);
        audioVideo.startLocalVideoTile();
      } catch (err) {
        console.error("Error switching camera with background:", err);
        setStatus("Error switching camera: " + err.message);
      }
    } else {
      await audioVideo.startVideoInput(deviceId);
    }
  }
});

micSelect.addEventListener("change", async () => {
  if (audioVideo) {
    await audioVideo.startAudioInput(micSelect.value);
  }
});

// Background image upload handler
document.getElementById("bgImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log("Background image file selected:", file.name, "(", (file.size / 1024).toFixed(1), "KB)");
    setStatus("✓ Background image selected. Choose 'Image' mode to apply.");
  } else {
    console.log("No file selected");
  }
});

// Background mode change handler
bgModeSelect.addEventListener("change", async () => {
  if (!audioVideo || !isVideoOn) {
    setStatus("Please start video before applying background effects.");
    return;
  }
  
  const mode = bgModeSelect.value;
  
  try {
    setStatus("Applying background effect...");
    
    // Stop current processor if exists
    if (currentProcessor) {
      await currentProcessor.destroy();
      currentProcessor = null;
    }
    
    const deviceId = cameraSelect.value;
    
    if (mode === "blur") {
      // Create background blur processor
      const { BackgroundBlurVideoFrameProcessor } = window;
      if (!BackgroundBlurVideoFrameProcessor) {
        throw new Error("Background blur not available. Check SDK loading.");
      }
      
      setStatus("Loading background blur…");
      
      currentProcessor = await BackgroundBlurVideoFrameProcessor.create();
      await audioVideo.stopVideoInput();
      
      // Create transform device with blur processor
      const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(
        meetingSession.deviceController,
        deviceId,
        [currentProcessor]
      );
      
      await audioVideo.startVideoInput(transformDevice);
      
      setStatus("Background blur applied");
      
    } else if (mode === "image") {
      const fileInput = document.getElementById("bgImage");
      const file = fileInput.files[0];

      if (!file) {
        setStatus("Please upload a background image first.");
        bgModeSelect.value = "none";
        return;
      }

      setStatus("Loading background image…");

      // Convert uploaded file → ImageBitmap (required type)
      let imageBitmap;
      try {
        imageBitmap = await createImageBitmap(file);
        console.log("ImageBitmap created:", imageBitmap.width, "x", imageBitmap.height);
      } catch (err) {
        console.error("Failed to create ImageBitmap:", err);
        setStatus("Error: Unable to load background image");
        bgModeSelect.value = "none";
        return;
      }

      // Chime v3 requires WASM + Worker paths when using browser ESM
      const workerURL = "https://esm.sh/amazon-chime-sdk-js@3.20.0/build/backgroundfilter/worker.js";
      const wasmURL = "https://esm.sh/amazon-chime-sdk-js@3.20.0/build/backgroundfilter/_cwt-wasm.wasm";

      // Build the processor correctly
      currentProcessor = await ChimeSDK.BackgroundReplacementVideoFrameProcessor.create({
        paths: {
          worker: workerURL,
          wasm: wasmURL,
        },
        replacementImage: imageBitmap,
      });

      await audioVideo.stopVideoInput();

      // Build transform device with the processor
      const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(
        meetingSession.deviceController,
        deviceId,
        [currentProcessor]
      );

      await audioVideo.startVideoInput(transformDevice);
      
      setStatus("Background image applied");
      
    } else {
      // No background effect - use regular camera
      await audioVideo.stopVideoInput();
      await audioVideo.startVideoInput(deviceId);
      setStatus("Background effect removed");
    }
    
    // Restart local video tile
    audioVideo.startLocalVideoTile();
    
  } catch (err) {
    console.error("Error applying background effect:", err);
    setStatus("Error applying background: " + err.message);
    bgModeSelect.value = "none";
  }
});