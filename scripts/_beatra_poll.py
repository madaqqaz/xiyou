import sys, json, time, urllib.request, subprocess

TASK_ID = sys.argv[1]
OUT = sys.argv[2]
DEBUG = sys.argv[3] if len(sys.argv) > 3 else ""
CLIENT = r"C:/Users/Administrator/.workbuddy/skills/beatra-ai-music-creator/scripts/mcp_client.py"
PY = r"C:/Users/Administrator/.workbuddy/binaries/python/versions/3.13.12/python.exe"

def call(tool, payload):
    p = subprocess.run([PY, CLIENT, "call", tool], input=json.dumps(payload),
                       capture_output=True, text=True)
    try:
        return json.loads(p.stdout)
    except Exception as e:
        return {"_raw": p.stdout, "_err": p.stderr, "_exc": str(e)}

deadline = time.time() + 20 * 60
task = None
while time.time() < deadline:
    r = call("beatra.tasks.get", {"task_id": TASK_ID})
    task = (r.get("structuredContent") or {}).get("task", r.get("task"))
    if task is None:
        task = r
    status = task.get("status") if isinstance(task, dict) else None
    print("STATUS:", status, flush=True)
    if status in ("completed", "failed", "cancelled"):
        break
    time.sleep(10)

if DEBUG:
    try:
        with open(DEBUG, "w", encoding="utf-8") as f:
            f.write(json.dumps(task, ensure_ascii=False, indent=2))
    except Exception as e:
        print("DEBUG_WRITE_ERR", e, flush=True)

if not isinstance(task, dict):
    print("NO_TASK", flush=True); sys.exit(2)

out = task.get("output")
url = None
if isinstance(out, dict):
    clips = out.get("clips") or []
    for c in clips:
        a = (c.get("audio") or {})
        if a.get("url"):
            url = a["url"]; break
    if not url and isinstance(out.get("audio"), dict) and out["audio"].get("url"):
        url = out["audio"]["url"]
links = task.get("links") or {}
if not url and links.get("assets"):
    url = links["assets"]
if not url:
    print("NO_AUDIO_URL", flush=True); sys.exit(2)

print("URL:", url, flush=True)
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
data = urllib.request.urlopen(req, timeout=120).read()
with open(OUT, "wb") as f:
    f.write(data)
print("DOWNLOADED", len(data), "bytes ->", OUT, flush=True)
