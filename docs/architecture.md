# Project structure

The frontend is a React/Vite application under `frontend/`. The Express API
and Sightengine integration are under `backend/`.

## Frontend

- `src/pages/`: page-level UI. The existing detection screen calls the feature
  API service.
- `src/features/detection/services/detectionApi.js`: sends the selected image
  to the backend; it does not call Sightengine.
- `src/features/detection/detection.css`: detection result and error styling.
- `src/components/`: shared UI, including the image upload/preview component.
- Other `src/features/`, `src/services/`, `src/contexts/`, `src/hooks/`,
  `src/routes/`, `src/utils/`, and `src/constants/` directories are locations
  for related application concerns.

## Backend

- `server.js` loads backend environment variables and starts the API.
- `app.js` configures CORS and mounts API routes.
- `routes/detectionRoutes.js` exposes `POST /api/detection/analyze` and
  applies rate limiting.
- `middleware/uploadMiddleware.js` checks the form field, MIME type, file
  signature, and 10 MB size limit. Files are staged in `uploads/tmp/`.
- `controllers/detectionController.js` orchestrates analysis and removes the
  temporary upload after success or failure.
- `services/detectionService.js` validates the provider score and classifies
  results using `AI_GENERATED_THRESHOLD`.
- `services/sightengineService.js` contains the only Sightengine HTTP
  integration.
- `constants/`, `utils/`, and `tests/` contain shared values, errors, and
  backend tests.

No authentication middleware existed in this frontend-only project, so this
endpoint uses request validation, CORS, and per-IP rate limiting rather than
inventing a login system. Add authentication if the application introduces a
backend identity system.

## Sightengine response and classification

The official `genai` response uses `status` and `type.ai_generated`. Only that
documented numeric score in the inclusive range 0–1 is used; the API score is
not treated as a guaranteed probability. With a default threshold of `0.8`,
scores `>= 0.8` are `AI_GENERATED`, scores `<= 0.2` are
`NOT_AI_GENERATED`, and values between the boundaries are `INCONCLUSIVE`.
Missing, nonnumeric, or out-of-range scores also produce `INCONCLUSIVE`.

`NOT_AI_GENERATED` means the model did not detect strong AI-generation
indicators. It does not prove an image is authentic. Provider errors, timeouts,
quota exhaustion, and rate limits return explicit errors and never fabricate a
detection result.

Sightengine credentials are read only from `backend/.env` as
`SIGHTENGINE_API_USER` and `SIGHTENGINE_API_SECRET`. Never use `VITE_*`
variables for provider secrets. The root `.gitignore` excludes real
environment files and uploaded content; commit only `.env.example` with
placeholders. Temporary uploads are removed after each request.
