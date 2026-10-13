"""After a crash, a reboot or a killed agent: check that no file was left half-written.

Every JSON parses, every GLB's header length matches its size, no data file is empty.
    python3 tools/integrity_check.py [--since "YYYY-MM-DD HH:MM"] [dir ...]     (default: the whole qingming/ tree)
A file that fails comes from the step that writes it (the builder's raw GLB from build_scene.sh, a shipped GLB from
export_web_scene.mjs, a layout from map_layout.mjs): rerun that step, never hand-patch the file.
"""
import json, os, struct, sys, time

args = sys.argv[1:]
since = 0.0
if "--since" in args:
    i = args.index("--since")
    since = time.mktime(time.strptime(args[i + 1], "%Y-%m-%d %H:%M"))
    del args[i:i + 2]
roots = args or [os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")]
SKIP = {"node_modules", ".git", "__pycache__", "dist", ".vercel"}

bad, n = [], {"json": 0, "glb": 0}
for root in roots:
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP]
        for f in files:
            p = os.path.join(d, f)
            try:
                if os.path.getmtime(p) < since:
                    continue
                size = os.path.getsize(p)
            except OSError:
                continue
            if f.endswith(".json"):
                n["json"] += 1
                try:
                    json.load(open(p, encoding="utf-8"))
                except Exception as e:
                    bad.append((p, "json: " + str(e)[:80]))
            elif f.endswith(".glb"):
                n["glb"] += 1
                with open(p, "rb") as fh:
                    head = fh.read(12)
                if len(head) < 12 or head[:4] != b"glTF":
                    bad.append((p, "glb: bad header"))
                elif struct.unpack("<I", head[8:12])[0] != size:
                    bad.append((p, f"glb: header says {struct.unpack('<I', head[8:12])[0]} bytes, file has {size}"))
            elif size == 0 and f.endswith((".md", ".py", ".mjs", ".js", ".png", ".jpg", ".webp", ".ktx2", ".ogg", ".opus")):
                bad.append((p, "empty"))

print(f"checked {n['json']} JSON and {n['glb']} GLB files")
for p, why in bad:
    print("BAD", os.path.relpath(p), why)
print("PASS" if not bad else f"FAIL ({len(bad)})")
sys.exit(1 if bad else 0)
