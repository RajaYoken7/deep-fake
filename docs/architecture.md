# Project structure

The current project is a frontend-only React/Vite prototype. Its application
files are under `frontend/`; backend directories are reserved for future
implementation. No API server, MongoDB models, or real image-detection
integration is present in this repository.

## Frontend

- `src/assets/`: bundled assets.
- `src/components/`: shared presentation components; existing components are
  in `src/components/`.
- `src/pages/`: existing page-level views.
- `src/features/detection/`: planned detection-specific components, hooks,
  services, and utilities.
- `src/features/user/` and `src/features/admin/`: planned user and
  administrator experiences.
- `src/services/`, `src/contexts/`, `src/hooks/`, `src/routes/`,
  `src/utils/`, and `src/constants/`: locations for shared application
  concerns as they are implemented.
- `src/tests/`: frontend tests when added.

## Backend (planned)

- `config/`, `constants/`, `models/`, `controllers/`, `routes/`, `services/`,
  `middleware/`, `validators/`, `utils/`, and `tests/` are reserved for the
  future Express/Mongoose backend.
- `uploads/` is runtime storage and must remain untracked. Temporary files
  belong in `uploads/tmp/` and should be deleted after processing or by a
  bounded cleanup job.
- Add Mongoose models only when implementing the corresponding backend
  feature; do not duplicate models or create a SQLite database.

## Detection provider boundary

When detection is implemented, keep Sightengine request and response handling
isolated in `backend/services/sightengineService.js`. The service should make
one external request with `models=deepfake,genai`; a detection controller
should call an application-level detection service rather than contain
provider-specific HTTP code. Keep provider credentials in backend environment
variables only. Do not add local ML models, datasets, or training code.

These directories establish organization only. No planned routes, schemas,
authentication, upload processing, or detection features are implemented by
this structure.
