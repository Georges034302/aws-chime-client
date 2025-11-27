# AWS Chime Client — Deployment & Configuration Instructions

This guide explains how how to deploy the AWS backend (Lambda + API Gateway) using AWS SAM in **ap-southeast-2**, and how to configure the frontend (`app.js`) so the Chime app works end-to-end for any user.

---

## 1. Project Structure

Ensure the project has the following layout:

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

```
sam build
```

---

## 5. Deploy the Backend (ap-southeast-2)

```
sam deploy --guided
```

Provide:

- Stack Name: `aws-chime-backend`
- Region: `ap-southeast-2`
- Confirm IAM roles: Yes  
- Save arguments: Yes  

SAM will output:

```
ApiURL = https://xxxxx.execute-api.ap-southeast-2.amazonaws.com/prod/join
```

Copy this URL.

---

## 6. Configure the Frontend (`app.js`)

Open `app.js` and update:

```
const API_URL = "https://xxxxx.execute-api.ap-southeast-2.amazonaws.com/prod/join";
```

Commit and push:

```
git add app.js
git commit -m "Configured API URL"
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

## 9. Cleanup SAM Deployment Artifacts (Optional)

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

## End of Instructions

This file can be used by *any user* to deploy and configure the project.
