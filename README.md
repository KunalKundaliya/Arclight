# Arclight

An intelligent interview scheduling and placement management platform using constraint optimization with Google OR-Tools CP-SAT.

Arclight is a React/Vite placement scheduling UI with a FastAPI, PostgreSQL, and OR-Tools API. The current implementation milestone adds shared authentication and backend role enforcement; candidate and recruiter workflows are still being built. The existing coordinator UI remains marked as a demo workspace.

## Local setup

1. Create a local environment file from `.env.example` and set a unique `AUTH_BOOTSTRAP_TOKEN`. Never stage a real `.env` file or add actual secrets to `.env.example`; if local ignore rules are unavailable, use shell environment variables or add `.env` to `.git/info/exclude`.
2. Create the PostgreSQL database named in `DATABASE_URL`.
3. Install backend dependencies and start the API:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r api\requirements.txt
   python -m uvicorn api.main:app --reload --port 8000 --env-file .env
   ```

4. In another terminal, install frontend dependencies and start Vite:

   ```powershell
   npm ci
   npm run dev
   ```

   Vite forwards `/api` requests to `http://localhost:8000` by default. Set `VITE_API_PROXY_TARGET` if the API runs elsewhere.

5. Create the first coordinator account by sending a `POST /api/auth/bootstrap` request with `X-Bootstrap-Token` and a JSON body containing `name`, `email`, and a 12-character-minimum `password`. This endpoint is available only while no coordinator exists. Keep the bootstrap token private and remove it from the deployment environment after initial setup.
6. Configure Resend before candidate registration, password recovery, or coordinator-issued invitations. Candidate registration requires email verification; recruiter and coordinator accounts can only be created by accepting an invitation. Coordinators can issue invitations from **Settings → Invite workspace members**.

The existing API creates missing tables at startup with SQLAlchemy `create_all`. This is sufficient for the current development setup, but it does not evolve existing schemas. Use versioned database migrations before deploying schema changes to an existing production database.

## Authentication configuration

Copy `.env.example` to a local `.env` file and configure:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by FastAPI |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed to send credentialed requests |
| `FRONTEND_URL` | Frontend origin used for email links and the Google callback redirect |
| `AUTH_COOKIE_SECURE` | Set to `true` behind HTTPS; keep `false` only for local HTTP development |
| `AUTH_BOOTSTRAP_TOKEN` | High-entropy, one-time initial coordinator setup credential |
| `RESEND_API_KEY` | Resend API key used to send verification, invitation, and reset links |
| `EMAIL_FROM` | Verified sender address configured in Resend |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 web client credentials |
| `GOOGLE_REDIRECT_URI` | Must exactly match the Google OAuth callback URI below |
| `VITE_GOOGLE_AUTH_ENABLED` | Set to `true` to show the Google sign-in action in the frontend |

### Google Cloud Console

1. Create or select a Google Cloud project and configure the OAuth consent screen.
2. Create an OAuth client with application type **Web application**.
3. Add the frontend origin (for example, `http://localhost:5173`) as an authorized JavaScript origin.
4. Add `http://localhost:8000/api/auth/google/callback` as an authorized redirect URI for local development. Use the deployed API callback URL in production.
5. Put the client ID, client secret, and exact redirect URI in the API environment. Enable the frontend Google action only after the API values are configured.

Google sign-in uses OpenID Connect authorization-code flow with state, nonce, and PKCE. Arclight verifies the returned identity token and verified email; it never requests or stores a Google password and does not request Gmail access. Calendar access is a separate integration and is not enabled by sign-in.

### Session and role boundaries

The API issues an opaque, random, seven-day session cookie marked `HttpOnly` and `SameSite=Lax`. Only a hash of that session token is stored in the database. Mutating authenticated requests require the CSRF token returned by `/api/auth/session` and sent as `X-CSRF-Token`. Set `AUTH_COOKIE_SECURE=true` in HTTPS environments.

Public registration can create candidate accounts only and requires verified email. Recruiter/coordinator accounts are invitation-only; only coordinators can issue invitations. The initial coordinator is created with the bootstrap endpoint. Scheduling changes and slot administration are coordinator-only; candidate booking endpoints require candidate role, and candidates can only book or cancel for their own email-matched profile.

## Auth API

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public candidate registration; sends email verification |
| `POST` | `/api/auth/verify-email` | One-time verification token |
| `POST` | `/api/auth/register/invitation` | One-time invited recruiter/coordinator token |
| `POST` | `/api/auth/login` | Public; optionally checks the selected workspace role |
| `GET` | `/api/auth/session` | Authenticated session and CSRF token |
| `POST` | `/api/auth/logout` | Authenticated session and CSRF token |
| `POST` | `/api/auth/forgot-password` | Public; sends a one-hour reset link |
| `POST` | `/api/auth/reset-password` | One-time reset token; revokes existing sessions |
| `POST` | `/api/auth/invitations` | Coordinator session and CSRF token |
| `POST` | `/api/auth/bootstrap` | One-time setup token, only before the first coordinator |
| `GET` | `/api/auth/google/start?role=candidate` | Starts Google OIDC; role can be candidate, recruiter, or coordinator |

FastAPI serves the OpenAPI contract at `/docs` during development. The API checks permissions on the server; frontend navigation is not an authorization boundary.

## Tests

Run backend tests with:

```powershell
python -m pytest -q -p no:cacheprovider
```

Run the frontend type-check and production build with:

```powershell
npm run build
```
