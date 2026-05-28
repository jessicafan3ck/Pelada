#!/usr/bin/env python3
"""
Pelada Agent — local Python execution bridge for the Pelada web app.

The Pelada web app (pelada-plum.vercel.app) sends generated Python code
to this agent, which executes it in your local environment and streams
stdout/stderr back to the browser in real time via SSE.

Your data never leaves your machine. Only the generated code comes down;
only console output goes back up.

Setup (one-time):
    pip install flask flask-cors

Run:
    python pelada-agent.py

Then open Pelada in your browser and click "Connect to Agent" in Model Studio.

Requirements: Python 3.8+, flask, flask-cors
"""

import os
import queue
import subprocess
import sys
import tempfile
import threading
import uuid

from flask import Flask, Response, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Required so the browser page can reach localhost

AGENT_VERSION = "1.0.0"
PORT = 7337

# In-memory task store — keyed by task_id
_tasks: dict[str, dict] = {}


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return jsonify({"status": "ok", "version": AGENT_VERSION,
                    "python": sys.version.split()[0]})


# ── Submit a code execution task ──────────────────────────────────────────────

@app.post("/run")
def run():
    data = request.get_json(force=True)
    code = data.get("code", "").strip()
    if not code:
        return jsonify({"error": "no code provided"}), 400

    task_id = uuid.uuid4().hex[:10]
    q: queue.Queue = queue.Queue()
    _tasks[task_id] = {"queue": q, "status": "running"}

    def _execute():
        # Write to a temp file so long scripts and multi-line code work
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py",
                                         delete=False) as f:
            f.write(code)
            tmp = f.name
        try:
            proc = subprocess.Popen(
                [sys.executable, tmp],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                cwd=os.path.expanduser("~"),
            )
            for line in proc.stdout:
                q.put(("out", line.rstrip("\n")))
            proc.wait()
            if proc.returncode == 0:
                q.put(("done", f"Process exited with code 0"))
            else:
                q.put(("error", f"Process exited with code {proc.returncode}"))
        except Exception as e:
            q.put(("error", str(e)))
        finally:
            os.unlink(tmp)
            _tasks[task_id]["status"] = "done"

    threading.Thread(target=_execute, daemon=True).start()
    return jsonify({"task_id": task_id})


# ── SSE stream for a task ─────────────────────────────────────────────────────

@app.get("/stream/<task_id>")
def stream(task_id: str):
    if task_id not in _tasks:
        return jsonify({"error": "task not found"}), 404

    def _generate():
        q = _tasks[task_id]["queue"]
        while True:
            try:
                event_type, data = q.get(timeout=60)
                # SSE format: "event: <type>\ndata: <payload>\n\n"
                yield f"event: {event_type}\ndata: {data}\n\n"
                if event_type in ("done", "error"):
                    break
            except queue.Empty:
                # Keep-alive ping so the browser doesn't close the connection
                yield "event: ping\ndata: \n\n"

    return Response(
        _generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print(f"\n  Pelada Agent v{AGENT_VERSION}")
    print(f"  Python {sys.version.split()[0]} · http://localhost:{PORT}")
    print(f"\n  Open Pelada → Model Studio → 'Connect to Agent'")
    print(f"  Ctrl+C to stop\n")
    app.run(host="127.0.0.1", port=PORT, debug=False, threaded=True)
