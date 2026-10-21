# DeepTrust Academy

DeepTrust Academy is a React/Vite prototype for digital trust and image
authenticity workflows. The current repository contains the frontend only;
backend directories document planned locations and do not contain an Express
server or detection integration yet.

## Frontend development

```powershell
Set-Location frontend
npm install
npm run dev
```

Use `npm run build` in `frontend/` to create a production build.

## Configuration and secrets

Copy `frontend/.env.example` to `frontend/.env` when configuring the future API
URL. Backend environment values belong in `backend/.env`, based on
`backend/.env.example`, once a backend is implemented. Never commit real
`.env` files or expose provider credentials in frontend variables.

User uploads and temporary files under `backend/uploads/` are excluded from
version control.

See [`docs/architecture.md`](docs/architecture.md) for module responsibilities
and the planned detection service boundary.
