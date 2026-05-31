# J'entends Rien

J'entends Rien is an MVP web app for creating realtime, music-reactive browser visuals from a YouTube or Spotify link. Users paste a music link, choose a visual style, and instantly get cinematic visuals generated from metadata-estimated BPM, energy, sections, and mood. Uploading audio is optional and is used only when the user wants tighter beat and frequency sync.

Important: the app does not download, extract, or analyze audio from YouTube or Spotify. Platform links are used for metadata, official embeds, playback position where available, and estimated visual direction. Real audio analysis is performed only on files uploaded manually by the user.

## What It Does

- Creates a project from a YouTube or Spotify link.
- Shows basic metadata preview when available.
- Generates instant no-upload visuals from estimated BPM, beats, energy, frequency bands, and sections.
- Embeds official YouTube or Spotify playback surfaces where possible.
- Accepts optional manual audio uploads for more accurate analysis.
- Analyzes uploaded audio for BPM, beat timestamps, energy, and bass/mid/treble intensity.
- Accepts optional lyrics or timestamped lyrics.
- Generates a deterministic visual direction JSON for the MVP.
- Renders realtime visuals in the browser with Three.js and Web Audio.
- Includes three visual presets: Particle Field, Neon Tunnel, and Waveform Landscape.
- Saves and reopens project state.
- Queues render records as a placeholder for a later MP4 export pipeline.

## Monorepo Structure

```text
apps/
  web/        Next.js frontend and realtime visualizer
  api/        FastAPI backend, database models, upload and analysis routes
  renderer/   Remotion scaffold for future MP4 rendering

packages/
  shared/     Shared TypeScript types and visual config schema
```

## Tech Stack

**Frontend**

- Next.js
- TypeScript
- Tailwind CSS
- React Three Fiber
- Three.js
- Zustand
- Web Audio API

**Backend**

- FastAPI
- SQLAlchemy
- PostgreSQL or SQLite
- Redis and Celery scaffolding
- Librosa, NumPy, SciPy, Pydub
- Local file storage for MVP uploads

**Renderer**

- Remotion scaffold
- Future FFmpeg/worker-based MP4 export path

## Local Setup

### Option A: Quick MVP Setup With SQLite

Use this if you do not want to install or run Postgres yet.

1. Create `.env` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
DATABASE_URL=
DB_FALLBACK_TO_SQLITE=true
SQLITE_FALLBACK_DATABASE_URL=sqlite:///./storage/j_entends_rien.db
REDIS_URL=redis://localhost:6379/0
STORAGE_ROOT=./storage

S3_ENDPOINT_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

OPENAI_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
AI_PROVIDER=local
```

Leave `DATABASE_URL` empty for SQLite. The backend will use local SQLite at `./storage/j_entends_rien.db`.

2. Install dependencies:

```bash
python -m venv .venv
.venv\Scripts\pip install -r apps/api/requirements.txt
npm install
```

3. Run the backend:

```bash
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --reload --env-file .env
```

4. Run the frontend:

```bash
npm run dev:web
```

5. Open:

```text
http://localhost:3000
```

### Option B: Docker Setup With Postgres and Redis

Use this if you want the local environment to match the intended production-style architecture more closely.

1. Install Docker Desktop.

2. Create `.env` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/j_entends_rien
DB_FALLBACK_TO_SQLITE=true
SQLITE_FALLBACK_DATABASE_URL=sqlite:///./storage/j_entends_rien.db
REDIS_URL=redis://localhost:6379/0
STORAGE_ROOT=./storage

S3_ENDPOINT_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

OPENAI_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
AI_PROVIDER=local
```

3. Start Postgres and Redis:

```bash
docker compose up -d postgres redis
```

4. Install dependencies:

```bash
python -m venv .venv
.venv\Scripts\pip install -r apps/api/requirements.txt
npm install
```

5. Run the backend:

```bash
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --reload --env-file .env
```

6. Run the frontend:

```bash
npm run dev:web
```

7. Open:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Yes | Public URL used by the frontend to call the FastAPI backend. |
| `DATABASE_URL` | Optional | Database connection string. If omitted, the backend uses SQLite for local MVP development. |
| `DB_FALLBACK_TO_SQLITE` | No | When `true`, local development falls back to SQLite if Postgres is configured but unavailable. |
| `SQLITE_FALLBACK_DATABASE_URL` | No | SQLite database URL used by the fallback path. |
| `REDIS_URL` | Optional for current MVP | Redis connection string for future queue workers. |
| `STORAGE_ROOT` | Yes | Local folder where uploaded audio files and generated artifacts are stored. |
| `S3_ENDPOINT_URL` | No | S3-compatible storage endpoint for future R2/S3 uploads. |
| `S3_ACCESS_KEY_ID` | No | S3/R2 access key for future cloud storage. |
| `S3_SECRET_ACCESS_KEY` | No | S3/R2 secret key for future cloud storage. |
| `S3_BUCKET` | No | Target S3/R2 bucket name. |
| `OPENAI_API_KEY` | No | Reserved for a future OpenAI-powered visual director. |
| `GEMINI_API_KEY` | Required only when `AI_PROVIDER=gemini` | Google AI Studio API key used by the backend visual director. Never expose it in frontend env vars. |
| `GEMINI_MODEL` | No | Gemini model name. Defaults to `gemini-3.5-flash`. |
| `AI_PROVIDER` | No | Use `local` for deterministic JSON or `gemini` to call Gemini for visual direction. |

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/projects` | Create a project from a YouTube, Spotify, or music URL. |
| `GET` | `/projects/{projectId}` | Fetch project state, analysis, visual config, and renders. |
| `PATCH` | `/projects/{projectId}` | Save project state and visual config. |
| `POST` | `/projects/{projectId}/instant-visual` | Generate estimated analysis and visual config without an audio upload. |
| `POST` | `/projects/{projectId}/audio` | Upload a user-provided audio file. |
| `POST` | `/projects/{projectId}/analyze` | Analyze uploaded audio. |
| `POST` | `/projects/{projectId}/visual-config` | Generate structured visual direction JSON. |
| `POST` | `/projects/{projectId}/render` | Queue a placeholder MP4 render record. |

## MVP User Flow

1. Open the web app.
2. Paste a YouTube or Spotify link.
3. Create a project and preview metadata.
4. Choose a visual style.
5. Generate instant visuals without uploading anything.
6. Optionally upload an audio file to improve beat/frequency sync.
7. Optionally add lyrics later for lyric-reactive cues.
8. Open the project preview page.
9. Play through the official platform embed or uploaded audio player.
10. Switch between visual presets.
11. Save the project.
12. Queue a future render/export job.

## AI Visual Direction

The backend can generate visual direction in two modes. By default, `AI_PROVIDER=local` generates deterministic structured JSON from:

- project title
- source platform metadata
- audio analysis
- optional lyrics
- selected style preference

For Gemini development/testing, set:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-3.5-flash
```

Gemini still returns only structured JSON. It does not generate video directly; the Three.js visual engine renders the returned direction. If Gemini is unavailable or the key is missing, the backend falls back to the local deterministic visual director.

## Current Limitations

- No authentication yet.
- No automatic YouTube audio download.
- Spotify account connection is not implemented yet; Spotify links currently use embed/metadata-style behavior.
- Link-only visuals use estimated analysis, not real raw waveform analysis.
- No full video editor.
- Render/export is currently a queued record, not a finished MP4.
- Redis and Celery are scaffolded for future background jobs.
- S3/R2 storage variables are reserved for later cloud storage integration.

## Useful Commands

```bash
npm run dev:web
npm run build -w apps/web
npm run typecheck -w apps/web
.venv\Scripts\python.exe -m compileall apps/api/app
```

## License and Platform Note

This MVP is intentionally designed around platform-safe playback and optional user-provided audio uploads. YouTube and Spotify links must not be used to download, rip, extract, or analyze protected audio.
