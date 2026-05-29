# j-entends-rien

MVP monorepo for turning user-uploaded music into realtime browser visuals. YouTube links are used only for metadata preview. The app does not download YouTube audio.

## Apps

- `apps/web`: Next.js, TypeScript, Tailwind, Zustand, React Three Fiber visualizer.
- `apps/api`: FastAPI backend with SQLAlchemy models, upload handling, audio analysis, deterministic visual-direction JSON.
- `apps/renderer`: Remotion placeholder for a later queued MP4 export worker.
- `packages/shared`: Shared TypeScript contracts and visual config schema.

## Run locally

```bash
cp .env.example .env
docker compose up -d postgres redis
python -m venv .venv
.venv\Scripts\pip install -r apps/api/requirements.txt
npm install
npm run dev:api
npm run dev:web
```

Open `http://localhost:3000`.

## MVP Flow

1. Paste a YouTube URL to create a project and preview metadata.
2. Upload an audio file manually.
3. Start analysis to extract BPM, beats, energy, and frequency bands.
4. Generate deterministic AI visual direction JSON from title, lyrics, style, and analysis.
5. Preview the audio-reactive Particle Field, Neon Tunnel, and Waveform Landscape presets.
6. Save and reopen the project.
7. Queue an MP4 render record for the later Remotion/FFmpeg worker stage.

## API

- `POST /projects`
- `GET /projects/{projectId}`
- `PATCH /projects/{projectId}`
- `POST /projects/{projectId}/audio`
- `POST /projects/{projectId}/analyze`
- `POST /projects/{projectId}/visual-config`
- `POST /projects/{projectId}/render`

The default `DATABASE_URL` is SQLite for a quick local demo. Set the PostgreSQL URL from `.env.example` when running with Docker Compose.
