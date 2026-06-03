import hashlib
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class StemSeparationResult:
    method: str
    status: str
    stems: dict[str, str]
    error: str | None = None


STEM_NAMES = ("vocals", "drums", "bass", "other")


def separate_stems(path: str) -> StemSeparationResult:
    mode = os.getenv("STEM_SEPARATOR", "auto").lower()
    if mode in {"off", "none", "false"}:
        return StemSeparationResult(method="disabled", status="skipped", stems={})
    if mode in {"auto", "demucs"}:
        result = _separate_with_demucs(path)
        if result.status == "ready" or mode == "demucs":
            return result
    return StemSeparationResult(
        method="pseudo_hpss",
        status="fallback",
        stems={},
        error="Demucs is unavailable; using harmonic/percussive pseudo-stems.",
    )


def _separate_with_demucs(path: str) -> StemSeparationResult:
    source = Path(path)
    if not source.exists():
        return StemSeparationResult(method="demucs", status="failed", stems={}, error="Audio file not found.")

    cache_root = Path(os.getenv("STEMS_CACHE_ROOT", "./storage/stems")).resolve()
    model = os.getenv("DEMUCS_MODEL", "htdemucs").strip() or "htdemucs"
    device = os.getenv("DEMUCS_DEVICE", "").strip()
    timeout = int(os.getenv("DEMUCS_TIMEOUT_SECONDS", "900"))
    track_hash = _file_hash(source)
    output_dir = cache_root / track_hash
    expected = _find_stems(output_dir)
    if expected:
        return StemSeparationResult(method="demucs", status="ready", stems=expected)

    output_dir.mkdir(parents=True, exist_ok=True)
    command = [
        sys.executable,
        "-m",
        "demucs",
        "-n",
        model,
    ]
    if device:
        command.extend(["-d", device])
    command.extend(["--out", str(output_dir), str(source)])

    try:
        subprocess.run(command, check=True, capture_output=True, text=True, timeout=timeout)
    except FileNotFoundError as error:
        return StemSeparationResult(method="demucs", status="failed", stems={}, error=str(error))
    except subprocess.CalledProcessError as error:
        message = (error.stderr or error.stdout or str(error)).strip()[-1000:]
        return StemSeparationResult(method="demucs", status="failed", stems={}, error=message)
    except subprocess.TimeoutExpired:
        return StemSeparationResult(method="demucs", status="failed", stems={}, error="Demucs separation timed out.")

    stems = _find_stems(output_dir)
    if not stems:
        return StemSeparationResult(method="demucs", status="failed", stems={}, error="Demucs finished without expected stem files.")
    return StemSeparationResult(method="demucs", status="ready", stems=stems)


def _find_stems(output_dir: Path) -> dict[str, str]:
    stems = {}
    for stem in STEM_NAMES:
        matches = sorted(output_dir.rglob(f"{stem}.wav"))
        if matches:
            stems[stem] = str(matches[0])
    return stems if len(stems) >= 3 else {}


def _file_hash(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()[:24]
