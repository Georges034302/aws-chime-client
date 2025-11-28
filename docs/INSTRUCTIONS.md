# AWS Chime Client v4.0 — Deployment & Configuration Instructions

**v4.0 Production Release** with enterprise AWS Cognito authentication and stable background processing.  
This guide explains how to deploy the complete secure infrastructure (Lambda + API Gateway + Cognito) using AWS SAM in **ap-southeast-2**, and configure the frontend for authenticated access to Chime meetings.

---

## 1. Project Structure

Ensure the project has the following layout:

```
aws-chime-client/
├── LICENSE
├── README.md
├── app.js                     ← Frontend JavaScript (SDK v3 + Background Filters)
├── index.html                 ← Frontend HTML (loads SDK v3 + background filters)
├── style.css                  ← Frontend CSS
├── background-filters/
│   ├── worker.js              ← Web Worker for processing
│   ├── segmentation.wasm      ← Segmentation model
│   └── segmentation-simd.wasm ← SIMD-optimized model
├── backend/
│   ├── createMeeting.js       ← Lambda handler (AWS SDK v3)
│   └── package.json           ← Backend dependencies
├── template.yaml              ← SAM CloudFormation template
├── samconfig.toml             ← SAM deployment config (auto-generated)
├── docs/
│   ├── INSTRUCTIONS.md        ← This file
│   ├── CHANGELOG.md           ← Version history
│   ├── ROADMAP.md             ← Feature roadmap
│   ├── CONTRIBUTING.md        ← Contribution guidelines
│   └── index.md
├── img/
│   ├── aws_architecture.png   ← Architecture diagram
│   └── logo_dark.png          ← Logo
├── cleanup.sh                 ← Cleanup script
├── libs/                      ← (reserved for future use)
├── node_modules/              ← Dependencies
├── package.json
├── package-lock.json
```

**Key Files:**
- **backend/createMeeting.js** - Lambda handler using AWS SDK v3 (`@aws-sdk/client-chime-sdk-meetings`)
- **backend/package.json** - Dependencies for Lambda
- **template.yaml** - SAM CloudFormation template for Lambda + API Gateway with CORS
- **index.html** - Loads Amazon Chime SDK v3.20.0 via esm.sh CDN
- **app.js** - Frontend implementation with background blur/replacement

**SDK v3 API Usage:**
- `startVideoInput()` / `stopVideoInput()` for camera control
- `startAudioInput()` for microphone selection
- `addObserver()` for video tile management
- `BackgroundBlurVideoFrameProcessor` and `BackgroundReplacementVideoFrameProcessor` for effects
- `DefaultVideoTransformDevice` for applying processors

**Note:** The frontend uses [esm.sh](https://esm.sh) CDN which automatically converts NPM packages to browser-compatible ES modules.

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
CognitoUserPoolId = ap-southeast-2_xxxxxxxxx
CognitoUserPoolClientId = xxxxxxxxxxxxxxxxxxxx
CognitoHostedUIDomain = https://chime-client-xxxxx.auth.ap-southeast-2.amazoncognito.com/login...
```

Copy these values - you'll need them for the frontend configuration and user creation.

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

## 6. Configure the Frontend Authentication

### Update API URL in `app.js`:

```javascript
const API_URL = "https://xxxxx.execute-api.ap-southeast-2.amazonaws.com/prod/join";
```

### Update Cognito Configuration in `index.html`:

```javascript
const COGNITO_DOMAIN = "chime-client-xxxxx-xxxxx";          
const CLIENT_ID = "xxxxxxxxxxxxxxxxxxxx";                 
```

Replace these values with your actual deployment outputs from step 5.

### Create Test Users in Cognito:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_xxxxxxxxx \
  --username your-username \
  --user-attributes Name=email,Value=your-email@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

aws cognito-idp admin-set-user-password \
  --user-pool-id ap-southeast-2_xxxxxxxxx \
  --username your-username \
  --password "YourSecurePassword123!" \
  --permanent
```

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

### Authentication Flow:

1. Click **Login** button
2. Redirected to Cognito hosted UI
3. Enter your username and password
4. Redirected back with JWT token
5. Meeting section becomes available

### Meeting Flow:

Enter:
- Any meeting ID  
- Display name  
- Click **Join Meeting**

Expected flow:

- Frontend sends POST → API Gateway (with JWT token)
- API Gateway validates Cognito token  
- API Gateway triggers Lambda  
- Lambda creates a Chime Meeting + Attendee  
- Credentials return to browser  
- Browser joins the Chime meeting  
- Local & remote video appear

### Logout:
- Click **Logout** button to clear authentication  

---

## 9. Background Filters Implementation

The application implements real-time background blur and replacement using Chime SDK v3 processors.

### How It Works

**SDK Loading:**
- Amazon Chime SDK v3.20.0 loaded via esm.sh CDN in `index.html`
- Background filter classes accessed via `ChimeSDK.BackgroundBlurVideoFrameProcessor` and `ChimeSDK.BackgroundReplacementVideoFrameProcessor`

**Background Blur:**
- Creates blur processor with WASM/worker paths and blur strength
- Applies using `DefaultVideoTransformDevice` wrapper
- WASM worker: `https://esm.sh/amazon-chime-sdk-js@3.20.0/build/background-filters/worker.js`
- WASM binary: `https://esm.sh/amazon-chime-sdk-js@3.20.0/build/background-filters/segmentation.wasm`

**Background Replacement:**
- Reads file from input element
- Converts to `ImageBitmap` via `createImageBitmap(file)` (required by SDK v3)
- Creates replacement processor with ImageBitmap and WASM paths
- Applies using `DefaultVideoTransformDevice`

**Processor Cleanup:**
- `stopVideoWithCleanup()` ensures proper cleanup of processors and transform devices
- Processors destroyed via `await currentProcessor.destroy()`

### WASM/Model Loading

Background filters require:
- **WASM worker**: `build/background-filters/worker.js`
- **WASM binary**: `build/background-filters/segmentation.wasm`
- **Segmentation model**: Automatically downloaded from AWS CDN at runtime

These are loaded from esm.sh CDN or AWS static assets. No local hosting required.

### User Workflow

1. Join meeting and start video
2. **Upload background image**: Click "Background Image" file input and select an image
3. Select "Blur" from Background Mode dropdown → blur applies immediately
4. Select "Image" from dropdown → converts file to ImageBitmap and applies custom background
5. Select "None" to remove effects
6. Switch cameras → background effect is preserved

**Key Requirements:**
- Background replacement requires **ImageBitmap** (created via `createImageBitmap(file)`)
- Both blur and replacement use **DefaultVideoTransformDevice** for processor wrapping
- WASM/worker paths MUST be specified when creating processors
- Proper cleanup via `destroy()` method prevents memory leaks

---

## 10. Cleanup SAM Deployment Artifacts (Optional)

To clean up SAM build artifacts and helper resources **without affecting your running application**, run:

```bash
./cleanup.sh
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

## Monthly AWS Cost Estimate (1 User)

| AWS Service        | Purpose                        | Estimated Usage (1 User) | Estimated Monthly Cost |
|-------------------|--------------------------------|---------------------------|--------------------------|
| Amazon Chime SDK  | Audio/Video meetings           | 1–5 meetings/month        | **$0.00** *(Free tier covers usage)* |
| Amazon Cognito    | User authentication (Hosted UI) | 1 MAU                     | **$0.00** *(50,000 MAU free)* |
| AWS Lambda        | Backend create/join function   | ~100 requests             | **$0.00** *(1M free)* |
| API Gateway       | Secure API endpoint            | ~100 calls                | **$0.00** *(1M free)* |
| CloudWatch Logs   | Lambda logging                 | Few KB                    | **$0.00** *(5GB free)* |
| S3 (optional)     | Static assets / CSS overrides  | <50 MB                    | **$0.01** |
| Route53 (optional)| Custom domain                  | 1 domain                  | **$0.50** |
| GitHub Pages      | Hosting frontend               | Unlimited                 | **Free** |

### **Total Monthly Estimate: $0.00 – $1.00**
*(Depending on whether you use a custom domain)*

---
## End of Instructions

This file can be used by *any user* to deploy and configure the project.
