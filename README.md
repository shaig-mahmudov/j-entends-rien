# J'entends Rien

J'entends Rien is an MVP web app for creating realtime, audio-reactive music visuals from user-uploaded audio. Users can paste a YouTube link for metadata preview, upload their own audio file, generate an analysis of the track, and preview cinematic visuals that react to rhythm, energy, frequency bands, lyrics, and a structured visual direction JSON.

Important: the app does not download or extract audio from YouTube. YouTube URLs are used only for metadata such as title and thumbnail. Audio analysis is performed only on files uploaded manually by the user.

## What It Does

- Creates a project from a YouTube URL.
- Shows basic YouTube metadata preview when available.
- Accepts manual audio uploads.
- Analyzes audio for BPM, beat timestamps, energy, and bass/mid/treble intensity.
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
REDIS_URL=redis://localhost:6379/0
STORAGE_ROOT=./storage

S3_ENDPOINT_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

OPENAI_API_KEY=
GEMINI_API_KEY=
AI_PROVIDER=local
```

Do not set `DATABASE_URL`. The backend will use local SQLite at `./storage/j_entends_rien.db`.

2. Install dependencies:

```bash
python -m venv .venv
.venv\Scripts\pip install -r apps/api/requirements.txt
npm install
```

3. Run the backend:

```bash
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --reload
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
REDIS_URL=redis://localhost:6379/0
STORAGE_ROOT=./storage

S3_ENDPOINT_URL=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_BUCKET=

OPENAI_API_KEY=
GEMINI_API_KEY=
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
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir apps/api --reload
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
| `REDIS_URL` | Optional for current MVP | Redis connection string for future queue workers. |
| `STORAGE_ROOT` | Yes | Local folder where uploaded audio files and generated artifacts are stored. |
| `S3_ENDPOINT_URL` | No | S3-compatible storage endpoint for future R2/S3 uploads. |
| `S3_ACCESS_KEY_ID` | No | S3/R2 access key for future cloud storage. |
| `S3_SECRET_ACCESS_KEY` | No | S3/R2 secret key for future cloud storage. |
| `S3_BUCKET` | No | Target S3/R2 bucket name. |
| `OPENAI_API_KEY` | No | Reserved for a future OpenAI-powered visual director. |
| `GEMINI_API_KEY` | No | Reserved for a future Gemini-powered visual director. |
| `AI_PROVIDER` | No | Planned provider selector. Current MVP uses `local` deterministic JSON generation. |

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/projects` | Create a project from a YouTube metadata URL. |
| `GET` | `/projects/{projectId}` | Fetch project state, analysis, visual config, and renders. |
| `PATCH` | `/projects/{projectId}` | Save project state and visual config. |
| `POST` | `/projects/{projectId}/audio` | Upload a user-provided audio file. |
| `POST` | `/projects/{projectId}/analyze` | Analyze uploaded audio. |
| `POST` | `/projects/{projectId}/visual-config` | Generate structured visual direction JSON. |
| `POST` | `/projects/{projectId}/render` | Queue a placeholder MP4 render record. |

## MVP User Flow

1. Open the web app.
2. Paste a YouTube URL.
3. Create a project and preview metadata.
4. Upload an audio file manually.
5. Add optional lyrics or timestamped lyrics.
6. Choose a visual style.
7. Start analysis.
8. Open the project preview page.
9. Play the audio and view synchronized realtime visuals.
10. Switch between visual presets.
11. Save the project.
12. Queue a future render/export job.

## AI Visual Direction

The MVP does not call an external AI provider by default. Instead, the backend generates deterministic structured JSON from:

- project title
- audio analysis
- optional lyrics
- selected style preference

The output is designed to match the future AI contract, so OpenAI or Gemini can be added later without changing the frontend visual engine.

## Current Limitations

- No authentication yet.
- No automatic YouTube audio download.
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

This MVP is intentionally designed around user-provided audio uploads. YouTube links are metadata-only and must not be used to download, rip, or extract audio.
