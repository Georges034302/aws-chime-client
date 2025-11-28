# AWS Chime Client — Deployment & Configuration Instructions

This guide explains how how to deploy the AWS backend (Lambda + API Gateway) using AWS SAM in **ap-southeast-2**, and how to configure the frontend (`app.js`) so the Chime app works end-to-end for any user.

---

## 1. Project Structure

Ensure the project has the following layout:

```
aws-chime-client/
├── LICENSE
├── README.md
├── app.js                     ← Frontend JavaScript (SDK v3 + Background Filters)
├── backend/
│   ├── createMeeting.js       ← Lambda handler (AWS SDK v3)
│   └── package.json           ← Node.js dependencies
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
├── index.html                 ← Frontend HTML (loads SDK v3 + background filters)
├── samconfig.toml             ← SAM deployment config (auto-generated)
├── style.css                  ← Frontend CSS
└── template.yaml              ← SAM template
```

**Important Files:**

### `backend/createMeeting.js`
```javascript
// Lambda handler for creating an Amazon Chime SDK meeting + attendee.
// Uses AWS SDK v3 for Node.js 18+ compatibility.

const { ChimeSDKMeetingsClient, CreateMeetingCommand, CreateAttendeeCommand } = require("@aws-sdk/client-chime-sdk-meetings");

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const meetingId = body.meetingId || `demo-${Date.now()}`;
    const name = body.name || "Guest";
    const region = body.region || "us-east-1";

    const client = new ChimeSDKMeetingsClient({ region: "us-east-1" });
    const requestToken = `${meetingId}-${Date.now()}`;

    // Create meeting
    const createMeetingCommand = new CreateMeetingCommand({
      ClientRequestToken: requestToken,
      MediaRegion: region,
      ExternalMeetingId: meetingId,
    });

    const meetingResponse = await client.send(createMeetingCommand);

    // Create attendee
    const createAttendeeCommand = new CreateAttendeeCommand({
      MeetingId: meetingResponse.Meeting.MeetingId,
      ExternalUserId: name,
    });

    const attendeeResponse = await client.send(createAttendeeCommand);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        meeting: meetingResponse.Meeting,
        attendee: attendeeResponse.Attendee,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
```

### `backend/package.json`
```json
{
  "name": "chime-meeting-backend",
  "version": "1.0.0",
  "description": "AWS Chime SDK Meeting Creator Lambda",
  "main": "createMeeting.js",
  "dependencies": {
    "@aws-sdk/client-chime-sdk-meetings": "^3.700.0"
  }
}
```

### `template.yaml`
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AWS Chime Client Backend - Meeting + Attendee Creation

Globals:
  Function:
    Timeout: 10
    Runtime: nodejs18.x
    MemorySize: 256
    Architectures:
      - arm64
    Environment:
      Variables:
        CHIME_REGION: ap-southeast-2

Resources:
  ApiGatewayRestApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Cors:
        AllowMethods: "'POST,OPTIONS'"
        AllowHeaders: "'Content-Type'"
        AllowOrigin: "'*'"

  CreateMeetingFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: CreateMeetingFunction
      Handler: createMeeting.handler
      CodeUri: backend/
      Policies:
        - Statement:
            - Effect: Allow
              Action:
                - chime:CreateMeeting
                - chime:CreateAttendee
                - chime:CreateMeetingWithAttendees
              Resource: "*"
      Events:
        JoinMeetingApi:
          Type: Api
          Properties:
            Path: /join
            Method: POST
            RestApiId: !Ref ApiGatewayRestApi

Outputs:
  ApiURL:
    Description: "Invoke URL for Join Meeting"
    Value: !Sub "https://${ApiGatewayRestApi}.execute-api.ap-southeast-2.amazonaws.com/prod/join"
```

### `index.html` (Frontend SDK)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AWS Chime Client</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="style.css" />
  <!-- Amazon Chime SDK JS - Using esm.sh for browser module loading -->
  <script type="module">
    import * as ChimeSDK from 'https://esm.sh/amazon-chime-sdk-js@3.20.0';
    window.ChimeSDK = ChimeSDK;
  </script>
</head>
<body>
  <!-- ... rest of HTML ... -->
  <script src="app.js"></script>
</body>
</html>
```

### `app.js` (Key Functions - SDK v3 API)
```javascript
// Device population - lists devices and starts audio automatically
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

  // Select first devices but don't start video yet
  if (devices.length > 0) {
    cameraSelect.value = devices[0].deviceId;
  }
  if (mics.length > 0) {
    micSelect.value = mics[0].deviceId;
    // Start audio input automatically
    await audioVideo.startAudioInput(mics[0].deviceId);
  }
}

// Video toggle - uses startVideoInput + startLocalVideoTile (v3)
async function toggleVideo() {
  if (!audioVideo) return;
  
  if (!isVideoOn) {
    const deviceId = cameraSelect.value;
    if (deviceId) {
      await audioVideo.startVideoInput(deviceId);
      audioVideo.startLocalVideoTile();
      isVideoOn = true;
      toggleVideoButton.textContent = "Stop Video";
    }
  } else {
    audioVideo.stopLocalVideoTile();
    await audioVideo.stopVideoInput();
    isVideoOn = false;
    toggleVideoButton.textContent = "Start Video";
  }
}

// Video tile observer - uses addObserver (v3)
function bindVideoTiles() {
  const observer = {
    videoTileDidUpdate: (tileState) => {
      if (!tileState.boundAttendeeId) return;
      
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
```

**Key v3 API Changes:**
- `startVideoInput()` / `stopVideoInput()` for camera control
- `startAudioInput()` for microphone selection
- `addObserver()` instead of `observeVideoTile()`
- Video tile binding uses same `bindVideoElement()`
- Audio mute/unmute methods remain the same

**Note:** The frontend uses [esm.sh](https://esm.sh) CDN which automatically converts NPM packages to browser-compatible ES modules. This allows using the latest Chime SDK (v3.x) without a build step.

---

## 2. Configure AWS Credentials

Run:

```
aws configure
```

Enter:

- AWS Access Key  
- AWS Secret Key  
- Default region: `ap-southeast-2`  
- Output format: `json`

Verify:

```
aws sts get-caller-identity
```

---

## 3. Install AWS CLI & SAM CLI

### Install AWS CLI:

```
sudo apt-get update
sudo apt-get install -y unzip curl jq
curl "https://awscli.amazonaws.com/aws-cli/v2/current/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Install SAM CLI:

```
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

Check:

```
sam --version
```

---

## 4. Build the Backend

From the project root:

```bash
sam build
```

This will:
- Install Node.js dependencies from `backend/package.json`
- Bundle the Lambda function with AWS SDK v3
- Prepare the deployment package

Expected output:
```
Building codeuri: /workspaces/aws-chime-client/backend runtime: nodejs18.x ...
Running NodejsNpmBuilder:NpmInstall
Build Succeeded
```

---

## 5. Deploy the Backend (ap-southeast-2)

### Option 1: Guided Deployment (First Time)

```bash
sam deploy --guided
```

Provide:

- Stack Name: `aws-chime-api`
- Region: `ap-southeast-2`
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- CreateMeetingFunction has no authentication. Is this okay?: `y`
- Save arguments to configuration file: `Y`
- SAM configuration file: `samconfig.toml`
- SAM configuration environment: `default`

### Option 2: Direct Deployment (After First Time)

If `samconfig.toml` exists:

```bash
sam deploy
```

Or specify parameters manually:

```bash
sam deploy --stack-name aws-chime-api --region ap-southeast-2 --capabilities CAPABILITY_IAM --resolve-s3
```

### Deployment Output

SAM will output:

```
ApiURL = https://xxxxx.execute-api.ap-southeast-2.amazonaws.com/prod/join
```

Copy this URL - you'll need it for the frontend configuration.

### Verify Deployment

Test the API:

```bash
curl -X POST https://xxxxx.execute-api.ap-southeast-2.amazonaws.com/prod/join \
  -H "Content-Type: application/json" \
  -d '{"meetingId":"test123","name":"TestUser","region":"ap-southeast-2"}' | jq
```

Expected response:
```json
{
  "meeting": {
    "MeetingId": "...",
    "ExternalMeetingId": "test123",
    "MediaRegion": "ap-southeast-2",
    ...
  },
  "attendee": {
    "ExternalUserId": "TestUser",
    "AttendeeId": "...",
    ...
  }
}
```

---

## 6. Configure the Frontend (`app.js`)

Open `app.js` and update the API_URL:

```javascript
const API_URL = "https://xxxxx.execute-api.ap-southeast-2.amazonaws.com/prod/join";
```

Replace `xxxxx` with your actual API Gateway ID from the deployment output.

Commit and push:

```bash
git add app.js backend/ template.yaml
git commit -m "Updated Lambda to AWS SDK v3 and configured API URL"
git push
```

---

## 7. Deploy Frontend Using GitHub Pages

1. Go to your GitHub repository  
2. Open **Settings → Pages**  
3. Select:  
   - Source: *Deploy from branch*  
   - Branch: *main*  
   - Folder: */* (root)  
4. Save  

Your frontend becomes publicly available at:

```
https://<username>.github.io/aws-chime-client/
```

---

## 8. Test the Application

Open the GitHub Pages URL.

Enter:

- Any meeting ID  
- Display name  
- Click **Join Meeting**

Expected flow:

- Frontend sends POST → API Gateway  
- API Gateway triggers Lambda  
- Lambda creates a Chime Meeting + Attendee  
- Credentials return to browser  
- Browser joins the Chime meeting  
- Local & remote video appear  

---

## 9. Background Filters Implementation

The application implements real-time background blur and replacement using Chime SDK v3 processors.

### How It Works

**SDK Loading (index.html):**
```javascript
import * as ChimeSDK from "https://esm.sh/amazon-chime-sdk-js@3.20.0";
window.ChimeSDK = ChimeSDK;
window.BackgroundBlurVideoFrameProcessor = ChimeSDK.BackgroundBlurVideoFrameProcessor;
window.BackgroundReplacementVideoFrameProcessor = ChimeSDK.BackgroundReplacementVideoFrameProcessor;
```

**Background Blur (app.js):**
```javascript
// Create blur processor
const blurProcessor = await BackgroundBlurVideoFrameProcessor.create();

// Stop current video input
await audioVideo.stopVideoInput();

// Create transform device with blur using DefaultVideoTransformDevice
const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(
  meetingSession.deviceController,
  deviceId,
  [blurProcessor]
);

// Start video with blur applied
await audioVideo.startVideoInput(transformDevice);
audioVideo.startLocalVideoTile();
```

**Background Replacement (app.js):**
```javascript
// Background image upload handler - just stores file reference
document.getElementById("bgImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    console.log("Background image file selected:", file.name);
    setStatus("✓ Background image selected. Choose 'Image' mode to apply.");
  }
});

// When "Image" mode is selected - convert file to ImageBitmap
const fileInput = document.getElementById("bgImage");
const file = fileInput.files[0];

if (!file) {
  setStatus("Please upload a background image first.");
  return;
}

// Convert uploaded file → ImageBitmap (required by Chime SDK v3)
let imageBitmap;
try {
  imageBitmap = await createImageBitmap(file);
  console.log("ImageBitmap created:", imageBitmap.width, "x", imageBitmap.height);
} catch (err) {
  console.error("Failed to create ImageBitmap:", err);
  setStatus("Error: Unable to load background image");
  return;
}

// Specify WASM and worker paths for ESM loading
const workerURL = "https://esm.sh/amazon-chime-sdk-js@3.20.0/build/backgroundfilter/worker.js";
const wasmURL = "https://esm.sh/amazon-chime-sdk-js@3.20.0/build/backgroundfilter/_cwt-wasm.wasm";

// Create replacement processor with ImageBitmap
const replaceProcessor = await ChimeSDK.BackgroundReplacementVideoFrameProcessor.create({
  paths: {
    worker: workerURL,
    wasm: wasmURL,
  },
  replacementImage: imageBitmap,
});

// Stop current video input
await audioVideo.stopVideoInput();

// Create transform device with processor
const transformDevice = new ChimeSDK.DefaultVideoTransformDevice(
  meetingSession.deviceController,
  deviceId,
  [replaceProcessor]
);

// Start video with background image
await audioVideo.startVideoInput(transformDevice);
audioVideo.startLocalVideoTile();
```

**Processor Cleanup:**
```javascript
// Always destroy processors when done
if (currentProcessor) {
  await currentProcessor.destroy();
  currentProcessor = null;
}
```

### WASM/Model Loading

Background filters require:
- **WASM worker**: `https://static.sdkassets.chime.aws/bgblur/workers/worker.js`
- **WASM binary**: `https://static.sdkassets.chime.aws/bgblur/wasm/_cwt-wasm.wasm`
- **Segmentation model**: `https://static.sdkassets.chime.aws/bgblur/models/selfie_segmentation_landscape.tflite`

These are automatically downloaded from AWS CDN at runtime by the SDK. No local hosting required.

### User Workflow

1. Join meeting and start video
2. **Upload background image**: Click "Background Image" file input and select an image
   - Console will log: "Background image file selected: [filename] ([size] KB)"
   - Status will show: "✓ Background image selected. Choose 'Image' mode to apply."
3. Select "Blur" from Background Mode dropdown → blur applies immediately
4. Select "Image" from dropdown → converts file to ImageBitmap and applies custom background
5. Select "None" to remove effects
6. Switch cameras while background effect is preserved

**Key Requirements:**
- Background replacement requires **ImageBitmap** (created via `createImageBitmap(file)`)
- Both blur and replacement use **DefaultVideoTransformDevice** for processor wrapping
- WASM/worker paths must be specified when using ESM module loading
- Image file is read directly from file input, no need to store data URL

---

## 10. Cleanup SAM Deployment Artifacts (Optional)

To clean up SAM build artifacts and helper resources **without affecting your running application**, run:

```bash
./cleanup.sh
```

Or manually:

```bash
#!/bin/bash

REGION="ap-southeast-2"
HELPER_STACK="aws-sam-cli-managed-default"

# Remove local SAM build folder
rm -rf .aws-sam

# Get SAM artifact bucket
BUCKET=$(aws cloudformation describe-stack-resources \
  --stack-name "$HELPER_STACK" \
  --region "$REGION" \
  --query "StackResources[?ResourceType=='AWS::S3::Bucket'].PhysicalResourceId" \
  --output text 2>/dev/null)

# Empty and delete bucket
if [[ -n "$BUCKET" ]]; then
  # Delete all object versions
  aws s3api list-object-versions \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --query 'Versions[].{Key:Key,VersionId:VersionId}' \
    --output json 2>/dev/null | \
  jq -r '.[] | "aws s3api delete-object --bucket '$BUCKET' --region '$REGION' --key \"" + .Key + "\" --version-id \"" + .VersionId + "\""' | \
  bash 2>/dev/null
  
  # Delete all delete markers
  aws s3api list-object-versions \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' \
    --output json 2>/dev/null | \
  jq -r '.[] | "aws s3api delete-object --bucket '$BUCKET' --region '$REGION' --key \"" + .Key + "\" --version-id \"" + .VersionId + "\""' | \
  bash 2>/dev/null
  
  # Delete bucket
  aws s3 rb "s3://$BUCKET" --force --region "$REGION" 2>/dev/null
fi

# Delete SAM helper stack
aws cloudformation delete-stack \
  --stack-name "$HELPER_STACK" \
  --region "$REGION" 2>/dev/null

aws cloudformation wait stack-delete-complete \
  --stack-name "$HELPER_STACK" \
  --region "$REGION" 2>/dev/null

echo "✅ Cleanup complete"
```

**Note:** This only removes deployment artifacts. Your application stack (`aws-chime-api`) and API Gateway endpoint remain fully operational.

---

## 11. Troubleshooting

### Error: "Cannot find module 'aws-sdk'"

**Cause:** Lambda is using Node.js 18+ which doesn't include AWS SDK v2.

**Solution:** Ensure you're using the correct code:
- `backend/createMeeting.js` uses `@aws-sdk/client-chime-sdk-meetings` (SDK v3)
- `backend/package.json` includes the dependency
- Run `sam build` before deploying

### Error: "Internal server error"

**Check Lambda logs:**
```bash
aws logs tail /aws/lambda/CreateMeetingFunction --region ap-southeast-2 --follow
```

### Error: "Failed to fetch"

**Possible causes:**
1. API Gateway CORS not configured properly (check `template.yaml`)
2. API URL in `app.js` is incorrect
3. Lambda function has errors (check CloudWatch Logs)

### Update Deployed Lambda

After making code changes:

```bash
sam build
sam deploy
```

### Error: "Background blur not available. Check SDK loading."

**Possible causes:**
1. Background filter classes not loaded in `index.html`
2. SDK failed to load from esm.sh CDN
3. Network blocking AWS CDN for WASM/models

**Solution:**
1. Check browser console for import errors
2. Verify `window.BackgroundBlurVideoFrameProcessor` exists
3. Check network tab for failed CDN requests to `static.sdkassets.chime.aws`

### Background Filter Performance Issues

**If blur/replacement is slow or laggy:**
1. Ensure browser supports WebAssembly and SIMD
2. Close other tabs/applications to free CPU
3. Reduce video resolution if possible
4. Background filters require significant CPU - low-end devices may struggle

---

## End of Instructions

This file can be used by *any user* to deploy and configure the project.
