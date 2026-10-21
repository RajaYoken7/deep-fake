# DeepTrust Academy

DeepTrust Academy is a React/Vite frontend with an Express upload API for
Sightengine AI-generated image detection.

## Run locally

1. Copy `backend/.env.example` to `backend/.env`. Add valid Sightengine
   credentials there; never put them in frontend variables.
2. In a terminal, install and run the backend:

   ```powershell
   Set-Location backend
   npm install
   npm run dev
   ```

3. In another terminal, install and run the frontend:

   ```powershell
   Set-Location frontend
   npm install
   npm run dev
   ```

The detection API listens on port `5000` by default. Set `VITE_API_URL` in
`frontend/.env` when using a different backend URL.

## Detection

The frontend sends an image to `POST /api/detection/analyze` as multipart
field `media`. The backend validates and temporarily stores the image, sends
one multipart Sightengine request using `models=genai`, then removes the
temporary upload. `AI_GENERATED_THRESHOLD` defaults to `0.8`; scores at or
above it classify as AI-generated, scores at or below its complementary
threshold classify as not AI-generated, and intermediate or invalid scores
are inconclusive.

The score is shown separately and is not presented as a guaranteed probability.
“NOT_AI_GENERATED” means Sightengine did not detect strong indicators; it does
not prove authenticity.

Run backend tests with `npm test` in `backend/` and build the frontend with
`npm run build` in `frontend/`.
