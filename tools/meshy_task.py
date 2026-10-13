"""Run any Meshy 3D task (multi-image-to-3d, rigging, animations, remesh, ...), wait, download every result file.

Usage:
  python3 -I meshy_task.py <endpoint> <out_dir> '<json body>'   (or @body.json)
  e.g. python3 -I meshy_task.py multi-image-to-3d qingming/gen/v1/porter_3d '{"input_task_id": "...", "pose_mode": "a-pose"}'
Reads MESHY_API_KEY. Writes <out_dir>/task.json plus every URL found in model_urls / texture_urls / result.
"""
import json, os, sys, time, urllib.error, urllib.parse, urllib.request

API = "https://api.meshy.ai/openapi/v1"
KEY = os.environ["MESHY_API_KEY"]


def call(method, path, body=None):
    # 429 (too many requests at once) and 5xx are retried with a growing wait; anything else is raised
    for attempt in range(8):
        req = urllib.request.Request(API + path, method=method,
                                     data=json.dumps(body).encode() if body else None,
                                     headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 and e.code < 500 or attempt == 7:
                print("HTTP", e.code, e.read()[:300], flush=True)
                raise
            time.sleep(10 * (attempt + 1))


def urls(obj, prefix=""):
    """Yield (name, url) for every http URL nested in obj."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from urls(v, f"{prefix}{k}.")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from urls(v, f"{prefix}{i}.")
    elif isinstance(obj, str) and obj.startswith("http"):
        yield prefix.rstrip("."), obj


endpoint, out_dir, raw = sys.argv[1], sys.argv[2], sys.argv[3]
# '@file.json' reads the body from a file (needed for data-URI images, which overflow argv)
body = json.load(open(raw[1:])) if raw.startswith("@") else json.loads(raw)
os.makedirs(out_dir, exist_ok=True)
task_id = call("POST", f"/{endpoint}", body)["result"]
print("task", endpoint, task_id, flush=True)
last = None
while True:
    t = call("GET", f"/{endpoint}/{task_id}")
    if t.get("progress") != last:
        last = t.get("progress"); print(" ", t["status"], last, flush=True)
    if t["status"] in ("SUCCEEDED", "FAILED", "CANCELED"):
        break
    time.sleep(8)
json.dump({"endpoint": endpoint, "body": body, **t}, open(os.path.join(out_dir, "task.json"), "w"), indent=1)
if t["status"] != "SUCCEEDED":
    raise SystemExit(f"{t['status']}: {t.get('task_error')}")
for section in ("model_urls", "texture_urls", "result", "thumbnail_url"):
    for name, url in urls(t.get(section), section + "."):
        ext = os.path.splitext(urllib.parse.urlparse(url).path)[1] or ".bin"
        dest = os.path.join(out_dir, name.replace(".", "_") + ext)
        urllib.request.urlretrieve(url, dest)
        print("  saved", dest, os.path.getsize(dest), flush=True)
print("ok", endpoint, task_id, t.get("consumed_credits"), "credits", flush=True)
