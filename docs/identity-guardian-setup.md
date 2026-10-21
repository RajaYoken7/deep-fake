# Identity Guardian — Setup & Architecture Guide

DeepTrust Academy's **Identity Guardian** provides non-destructive, privacy-first facial comparison and AI-generated still portrait detection.

---

## 1. Architecture & Data Flow

```
                      ┌────────────────────────────────────────┐
                      │    React + Vite Client (Frontend)      │
                      │  frontend/src/features/identity/       │
                      └──────────────────┬─────────────────────┘
                                         │ multipart/form-data
                                         ▼
                      ┌────────────────────────────────────────┐
                      │      Node.js / Express API Server      │
                      │               (Port 5000)              │
                      │  • Multer: Safe 10MB bounds in tmp/    │
                      │  • In-Memory Sliding Rate Limiter      │
                      │  • Strict finally cleanup unlink       │
                      └──────────────┬─────────────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│  Python CV & DL  │       │ Sightengine GenAI│        │  MongoDB Atlas   │
│      Engine      │       │ Cloud API (Opt)  │        │   (Metadata)     │
│  • YCrCb Skin    │       │ • Cloud synthetic│        │ • Report ID      │
│  • MobileNetV3   │       │   confidence     │        │ • Decision/Score │
│  • 2D FFT Power  │       │ • models=genai   │        │ • Quality Checks │
│  • Cosine Match  │       └──────────────────┘        │ • ZERO BIOMETRICS│
└──────────────────┘                                   └──────────────────┘
```

### Data Flow Overview:
1. **Upload & Pre-Validation:**
   - The user selects two images (Section A: ID photo + selfie; Section B: suspected AI photo + reference portrait).
   - The client validates file extension, mime type, and 10MB limit before upload.
2. **Transient Processing:**
   - Files arrive at `/api/identity-guardian/id-photo/verify` or `/api/identity-guardian/ai-photo/verify`.
   - Express multer buffers them in `backend/uploads/tmp/`.
3. **Dual Verification Pipeline:**
   - **Facial Comparison:**
     - Evaluates image quality (Laplacian variance for sharpness, luminance for exposure).
     - Detects facial contours using skin chrominance clustering and structural aspect verification.
     - Extracts deep convolutional feature embeddings using PyTorch MobileNetV3 + spatial gradient/color descriptors.
     - Computes cosine similarity against a documented `75.0%` match threshold.
   - **AI-Generated Image Detection (Section B):**
     - Performs 2D Fast Fourier Transform (FFT) high-frequency power distribution analysis (detecting upsampling and deconvolution grid artifacts from GAN/Diffusion models).
     - Computes gradient coherence and chrominance consistency.
     - Optionally queries Sightengine GenAI Cloud API if credentials are provided in `.env`.
4. **Guaranteed Cleanup & Storage:**
   - Temporary image files on disk are **immediately unlinked** in the controller's `finally` block on both success and error.
   - Non-biometric report metadata is persisted to MongoDB Atlas (`IdentityReport` collection). Raw images, portraits, and face vectors are **strictly prohibited** from database storage.

---

## 2. Model & API Selection Rationale

| Capability | Engine / Model | Rationale & Selection Criteria |
| :--- | :--- | :--- |
| **Facial Feature Extraction** | PyTorch MobileNetV3 + Spatial Histograms | Lightweight, open-source (Apache 2.0), runs on Windows CPU/GPU without heavy native dependencies. Produces unit-normalized cosine embeddings. |
| **Face Detection & Quality** | YCrCb Chrominance Segmentation + Laplacian Variance | Pure OpenCV 5 compliant without requiring external binary wheels. Evaluates camera blur and exposure dynamically. |
| **AI Image Detection** | 2D Fourier Power Spectrum Analyzer | Pretrained mathematical frequency-domain artifact model based on generative upsampling artifacts (CVPR / ICCV frequency analysis research). Free, private, local. |
| **Cloud GenAI (Optional)** | Sightengine GenAI Detection (`models=genai`) | Production cloud detector for synthetic imagery. Integrated in `sightengineService.js` if API credentials are configured. |
| **CompreFace (Optional)** | Exadel CompreFace REST API | Self-hosted open-source alternative for high-throughput enterprise deployments (requires Docker). Supported via `COMPREFACE_URL` / `COMPREFACE_API_KEY`. |

---

## 3. Privacy, Licensing & Cost Considerations

- **Raw Biometric Data:** Under no circumstances are raw portrait photos or biometric embeddings stored in MongoDB. Only anonymized decisions, metrics, and quality ratings are logged.
- **Liveness Limitations:** A pair of 2D still images cannot verify 3D physical presence or live interaction. The system explicitly alerts users that this is not a liveness check.
- **Licensing:**
  - PyTorch & Torchvision: BSD 3-Clause.
  - OpenCV: Apache 2.0.
  - DeepTrust Academy codebase: MIT / Proprietary.
- **Cost:**
  - Local Python CV Engine: **$0.00** (Runs locally on host hardware).
  - Sightengine API (Optional): Free tier offers 2,000 operations/month; paid tier starts at $19/month.
  - CompreFace (Optional): Free and open-source (Apache 2.0).

---

## 4. Environment Variables (`backend/.env`)

Configure the following variables in `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Required: MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/deeptrust_academy?retryWrites=true&w=majority

# Optional: Sightengine Cloud AI Detection API
SIGHTENGINE_API_USER=replace_with_sightengine_api_user
SIGHTENGINE_API_SECRET=replace_with_sightengine_api_secret

# Optional: CompreFace Face Verification Service
COMPREFACE_URL=http://localhost:8000
COMPREFACE_API_KEY=replace_with_compreface_api_key
```

---

## 5. Installation & Startup Commands

### Step 1: Start Backend API Server
In PowerShell:
```powershell
Set-Location "d:\deepfake 3\deepfake\backend"
npm.cmd install
npm.cmd start
```
The server will start on port `5000`:
- Health check: `http://localhost:5000/api/identity-guardian/health`

### Step 2: Start Frontend Development Server
In a separate PowerShell terminal:
```powershell
Set-Location "d:\deepfake 3\deepfake\frontend"
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:5173` in your browser and click on **Identity Guardian**.

---

## 6. How to Test Both Sections

### Testing Section A (ID Photo Verification):
1. In the browser, navigate to **Identity Guardian** and select **Section A: ID Photo Verification**.
2. **ID Card Photo:** Upload a photo of an ID document portrait.
3. **Verification Selfie:** Upload a selfie of the same person (or a different person).
4. Click **Verify ID & Selfie Portrait**.
5. **Expected Output:**
   - If the same person: Returns `SAME PERSON` with similarity score (e.g., `85%+`) and quality breakdown.
   - If different persons: Returns `DIFFERENT PERSON` with low similarity score (< `60%`).
   - If no face detected or multiple faces: Returns `INCONCLUSIVE` with specific warning.

### Testing Section B (AI-Generated Photo Verification):
1. Select **Section B: AI-Generated Photo Verification**.
2. **Suspected AI Portrait:** Upload an AI-generated portrait (e.g. Midjourney, DALL-E, Stable Diffusion, or synthetic face).
3. **Reference Photo:** Upload a genuine camera selfie.
4. Click **Analyze AI Portrait & Compare Face**.
5. **Expected Output:**
   - **Face Comparison:** Reports `SAME PERSON`, `DIFFERENT PERSON`, or `INCONCLUSIVE`.
   - **Image Authenticity:** Reports `LIKELY AI-GENERATED/MANIPULATED` (with estimated synthetic probability and Fourier metrics) or `LIKELY REAL-LIKE`.

---

## 7. Example API Requests and Responses

### Health Check
`GET /api/identity-guardian/health`

**Response (`200 OK`):**
```json
{
  "status": "healthy",
  "feature": "Identity Guardian Verification Suite",
  "timestamp": "2026-10-22T00:40:00.000Z",
  "database": {
    "status": "connected",
    "cluster": "DeepTrustCluster",
    "targetDb": "deeptrust_academy"
  },
  "engines": {
    "localCvEngine": "DeepTrust-Spatial-MobileNetV3-Cosine",
    "aiDetectionEngine": "Spectral-FFT-Structural-Artifact-Analyzer",
    "sightengineConfigured": false,
    "comprefaceConfigured": false
  },
  "privacy": {
    "biometricsStored": false,
    "retentionPolicy": "Metadata only, temporary memory/disk purged immediately"
  }
}
```

### Section A: ID Photo Verification
`POST /api/identity-guardian/id-photo/verify`  
Multipart form fields: `id_photo`, `selfie`

**Response (`200 OK`):**
```json
{
  "success": true,
  "reportId": "IDG-ID-8F3B1A02",
  "verificationType": "id_photo_verification",
  "status": "completed",
  "timestamp": "2026-10-22T00:41:00.000Z",
  "faceComparison": {
    "decision": "SAME PERSON",
    "similarityScore": 87.4,
    "threshold": 75.0,
    "confidence": "High",
    "explanation": "Facial feature alignment meets similarity criteria (87.4% vs threshold 75.0%). Key anatomical and structural facial features match."
  },
  "imageQuality": {
    "image1": {
      "dimensions": "480x640",
      "sharpnessScore": 84.2,
      "sharpnessRating": "Clear Sharpness",
      "exposure": "Normal Exposure",
      "facesDetected": 1
    },
    "image2": {
      "dimensions": "720x1280",
      "sharpnessScore": 120.5,
      "sharpnessRating": "Clear Sharpness",
      "exposure": "Normal Exposure",
      "facesDetected": 1
    }
  },
  "modelInfo": {
    "faceComparisonEngine": "DeepTrust-Spatial-MobileNetV3-Cosine",
    "faceModelVersion": "1.2.0",
    "engineType": "Local Deep Learning & Computer Vision Service",
    "livenessChecked": false
  },
  "warnings": [],
  "limitations": [
    "Still-image comparison does not verify physical liveness or active user presence.",
    "This tool provides verification assistance and must not be used as the sole factor in legal or financial identity decisions."
  ]
}
```

---

## 8. Troubleshooting Instructions

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `File size exceeds 10MB limit` | Image file is too large. | Resize or compress image under 10MB before upload. |
| `Upload error: Invalid file type` | Unsupported format (e.g. BMP, HEIC, GIF). | Convert image to standard JPEG, PNG, or WebP. |
| `No clear face detected in image` | Poor lighting, extreme profile angle, or heavy occlusion (sunglasses, masks). | Retake photo with frontal pose under even, diffuse lighting. |
| `Multiple faces detected in image` | Group photo or background faces. | Crop image so only the single target subject is visible. |
| `Cross-Origin Request Blocked` | Frontend running on non-default port. | Update `CLIENT_URL` in `backend/.env` to match the frontend host. |
| `Database connection failed at startup` | MongoDB Atlas network IP access rule expired. | Add your current IP address in Atlas Network Access. The server will run in fallback in-memory mode. |

---

## 9. Known Limitations & Remaining Work

1. **Liveness Verification:** Still-image comparison cannot prove active human presence. Future versions can incorporate interactive motion prompts or short video micro-blink validation.
2. **Severe Age Discrepancy:** Comparing child ID photos with adult selfies can reduce cosine similarity scores; threshold tolerances should be adjusted for juvenile documents.
3. **High Occlusion / Makeup:** Extreme theatrical makeup or heavy facial coverings may obscure key anatomical facial contours.
