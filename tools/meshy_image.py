"""Submit a Meshy text-to-image or image-to-image task, wait for it, download the images.

Usage:
  python3 -I meshy_image.py <out_prefix> <prompt_file> [--model M] [--aspect 16:9] [--multiview] [--apose]
                             [--ref image.png ...]
Reads MESHY_API_KEY from the environment. Writes <out_prefix>_<i>.png and <out_prefix>.json (task record).
"""
import base64, json, os, sys, time, urllib.request

API = "https://api.meshy.ai/openapi/v1"
KEY = os.environ["MESHY_API_KEY"]


def call(method, path, body=None):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body else None,
                                 headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main():
    args = sys.argv[1:]
    out, prompt_file = args[0], args[1]
    opts = {"model": "nano-banana-pro", "aspect": None, "multiview": False, "apose": False, "refs": []}
    i = 2
    while i < len(args):
        a = args[i]
        if a == "--model": opts["model"] = args[i + 1]; i += 2
        elif a == "--aspect": opts["aspect"] = args[i + 1]; i += 2
        elif a == "--multiview": opts["multiview"] = True; i += 1
        elif a == "--apose": opts["apose"] = True; i += 1
        elif a == "--ref":
            i += 1
            while i < len(args) and not args[i].startswith("--"):
                opts["refs"].append(args[i]); i += 1
        else: raise SystemExit(f"unknown arg {a}")

    body = {"ai_model": opts["model"], "prompt": open(prompt_file, encoding="utf-8").read().strip()}
    if opts["aspect"]: body["aspect_ratio"] = opts["aspect"]
    if opts["multiview"]: body["generate_multi_view"] = True
    if opts["apose"]: body["pose_mode"] = "a-pose"
    kind = "text-to-image"
    if opts["refs"]:
        kind = "image-to-image"
        body["reference_image_urls"] = []
        for p in opts["refs"]:
            mime = "image/png" if p.lower().endswith(".png") else "image/jpeg"
            body["reference_image_urls"].append(f"data:{mime};base64," + base64.b64encode(open(p, "rb").read()).decode())

    task_id = call("POST", f"/{kind}", body)["result"]
    print("task", kind, task_id, flush=True)
    while True:
        t = call("GET", f"/{kind}/{task_id}")
        if t["status"] in ("SUCCEEDED", "FAILED", "CANCELED"): break
        time.sleep(5)
    rec = {k: t.get(k) for k in ("id", "status", "ai_model", "prompt", "consumed_credits", "task_error", "image_urls")}
    rec["kind"] = kind
    rec["refs"] = opts["refs"]
    json.dump(rec, open(out + ".json", "w"), ensure_ascii=False, indent=1)
    if t["status"] != "SUCCEEDED":
        raise SystemExit(f"{t['status']}: {t.get('task_error')}")
    for n, url in enumerate(t["image_urls"]):
        urllib.request.urlretrieve(url, f"{out}_{n}.png")
    print("ok", t.get("consumed_credits"), "credits,", len(t["image_urls"]), "images ->", out, flush=True)


main()
