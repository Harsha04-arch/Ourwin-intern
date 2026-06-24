#!/usr/bin/env python3
"""
MCP Server — Instagram Reel Downloader
Uses yt-dlp to download a Reel and serve it as a local video file.
Exposes two MCP tools:
  - download_reel(url)  → downloads video to ./videos/, returns local path + metadata
  - get_reel_status()   → returns status of last download
"""

import asyncio
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

# MCP SDK (pip install mcp)
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

# ── Config ──────────────────────────────────────────────────────────────────
BASE_DIR   = Path(__file__).parent
VIDEO_DIR  = BASE_DIR / "videos"
VIDEO_DIR.mkdir(exist_ok=True)

# Shared state (single-process, single-thread safe for our use)
_last_result: dict = {}

# ── Helpers ─────────────────────────────────────────────────────────────────

def _sanitize_filename(url: str) -> str:
    """Derive a safe filename stub from the reel URL."""
    match = re.search(r"/reel/([A-Za-z0-9_-]+)", url)
    slug  = match.group(1) if match else "reel"
    return slug


def _run_ytdlp(url: str, output_path: Path) -> dict:
    """
    Run yt-dlp synchronously.
    Returns dict with keys: success, path, title, duration, error.
    """
    cmd = [
        sys.executable, "-m", "yt_dlp",
        "--no-playlist",
        "--format", "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--output",  str(output_path),
        "--no-warnings",
        "--print", "%(title)s|||%(duration)s",
        url,
    ]
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            return {
                "success": False,
                "error": result.stderr.strip() or "yt-dlp exited with non-zero status",
            }

        # Parse printed metadata (last line matching pattern)
        meta_line = ""
        for line in result.stdout.splitlines():
            if "|||" in line:
                meta_line = line
        title    = "A.R. Rahman's Message"
        duration = None
        if meta_line:
            parts    = meta_line.split("|||")
            title    = parts[0].strip() or title
            try:
                duration = float(parts[1].strip())
            except (IndexError, ValueError):
                pass

        # Find the actual file (yt-dlp may append extension)
        candidates = list(output_path.parent.glob(output_path.stem + "*.mp4"))
        actual_path = candidates[0] if candidates else output_path
        if not actual_path.exists():
            return {"success": False, "error": "Output file not found after download."}

        return {
            "success":  True,
            "path":     str(actual_path),
            "filename": actual_path.name,
            "title":    title,
            "duration": duration,
            "size_mb":  round(actual_path.stat().st_size / 1_048_576, 2),
        }

    except subprocess.TimeoutExpired:
        return {"success": False, "error": "yt-dlp timed out after 120 seconds."}
    except FileNotFoundError:
        return {"success": False, "error": "yt-dlp not found. Run: pip install yt-dlp"}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


# ── MCP Server ───────────────────────────────────────────────────────────────
server = Server("instagram-reel-downloader")


@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="download_reel",
            description=(
                "Download an Instagram Reel (or any yt-dlp-supported video URL) "
                "to the local ./videos/ directory for direct playback. "
                "Returns the local file path, title, duration, and file size."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type":        "string",
                        "description": "Full Instagram Reel URL to download.",
                    },
                    "filename": {
                        "type":        "string",
                        "description": "Optional output filename (without extension). Auto-derived if omitted.",
                    },
                },
                "required": ["url"],
            },
        ),
        types.Tool(
            name="get_reel_status",
            description="Return the result of the most recent download_reel call.",
            inputSchema={"type": "object", "properties": {}},
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    global _last_result

    if name == "download_reel":
        url      = arguments.get("url", "").strip()
        if not url:
            result = {"success": False, "error": "No URL provided."}
            _last_result = result
            return [types.TextContent(type="text", text=json.dumps(result))]

        slug     = arguments.get("filename") or _sanitize_filename(url)
        out_path = VIDEO_DIR / f"{slug}.mp4"

        # If already downloaded, return cached result
        if out_path.exists() and out_path.stat().st_size > 0:
            result = {
                "success":  True,
                "path":     str(out_path),
                "filename": out_path.name,
                "cached":   True,
                "size_mb":  round(out_path.stat().st_size / 1_048_576, 2),
            }
            _last_result = result
            return [types.TextContent(type="text", text=json.dumps(result))]

        # Run blocking yt-dlp in a thread so we don't block the event loop
        loop   = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _run_ytdlp, url, out_path)
        _last_result = result
        return [types.TextContent(type="text", text=json.dumps(result))]

    elif name == "get_reel_status":
        return [types.TextContent(type="text", text=json.dumps(_last_result or {"status": "no_download_yet"}))]

    else:
        return [types.TextContent(type="text", text=json.dumps({"error": f"Unknown tool: {name}"}))]


# ── Entry point ──────────────────────────────────────────────────────────────
async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
