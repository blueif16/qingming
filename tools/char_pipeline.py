"""Character pipeline: 3 views -> Smart Topology mesh -> 3-view retexture -> rig -> preset clips.

Usage:
  python3 -I char_pipeline.py <out_dir> <front.png> <side.png> <back.png> [--height 1.7] [--polys 4000]
                              [--actions 0,313] [--rig-task ID]
Each step writes <out_dir>/<step>/task.json plus its files (via meshy_task.py).
--rig-task skips straight to the clips for an already-rigged character.
"""
import argparse, base64, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def data_uri(p):
    return "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode()


def run(endpoint, out_dir, body):
    os.makedirs(out_dir, exist_ok=True)
    body_file = os.path.join(out_dir, "body.json")
    done = os.path.join(out_dir, "task.json")
    # resume: a step that already succeeded with the same request is not paid for twice
    if os.path.exists(done) and os.path.exists(body_file):
        t = json.load(open(done))
        if t.get("status") == "SUCCEEDED" and json.load(open(body_file)) == body:
            print("reuse", endpoint, t["id"], flush=True)
            return t["id"]
    json.dump(body, open(body_file, "w"))
    subprocess.run([sys.executable, "-I", os.path.join(HERE, "meshy_task.py"), endpoint, out_dir, "@" + body_file], check=True)
    return json.load(open(os.path.join(out_dir, "task.json")))["id"]


ap = argparse.ArgumentParser()
ap.add_argument("out_dir")
ap.add_argument("views", nargs="*", help="front side back")
ap.add_argument("--height", type=float, default=1.7)
ap.add_argument("--polys", type=int, default=4000)
ap.add_argument("--actions", default="0")
ap.add_argument("--rig-task")
a = ap.parse_args()

rig_id = a.rig_task
if not rig_id:
    front, side, back = a.views
    mesh_id = run("image-to-3d", os.path.join(a.out_dir, "1_mesh"), {
        "image_url": data_uri(front), "model_type": "smart-topology", "ai_model": "meshy-t2",
        "target_polycount": a.polys, "should_texture": True, "texture_resolution": "2k",
        "pose_mode": "a-pose", "target_formats": ["glb"]})
    tex_id = run("retexture", os.path.join(a.out_dir, "2_retex"), {
        "input_task_id": mesh_id, "ai_model": "meshy-7", "multiview_image_urls": [data_uri(p) for p in (front, side, back)],
        "enable_original_uv": True, "texture_resolution": "2k", "target_formats": ["glb"]})
    rig_id = run("rigging", os.path.join(a.out_dir, "3_rig"), {"input_task_id": tex_id, "height_meters": a.height})
for act in [int(x) for x in a.actions.split(",") if x]:
    run("animations", os.path.join(a.out_dir, f"4_anim_{act}"), {"rig_task_id": rig_id, "action_id": act})
print("pipeline done, rig task", rig_id)
