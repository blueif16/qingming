---
pretty_name: 清明上河圖 web world — generated assets
license: other
tags:
  - 3d
  - three.js
  - glb
  - game-assets
  - chinese-painting
---

# 清明上河圖 web world: generated assets

The `gen/` folder of [blueif16/qingming](https://github.com/blueif16/qingming), the walkable 清明上河圖 live at
https://qingming-delta.vercel.app. It holds what the pipelines produced:

- restyled scroll sections and their units;
- character turnaround sheets;
- Meshy meshes, rigs and motions (GLB, FBX);
- animals, boats, carts and props;
- tree cards, sound takes, HUD and performance shots;
- the task records and cache keys that let the pipelines skip finished units.

The GitHub repo keeps this folder's notes, briefs, specs, small data and scripts. This dataset holds the rest. To put
it back into a checkout, run this from the repo root:

    hf download ranxxx/qingming-assets --repo-type dataset --local-dir gen

Where everything comes from:

- **The painting.** 張擇端《清明上河圖》 (Northern Song) is in the public domain. The scan is from Wikimedia Commons.
- **Images.** Made with shyfai (gpt-image and nano-banana models).
- **3D.** Meshes, rigs and motions from Meshy.
- **Sound effects.** From ElevenLabs on its free tier, which is non-commercial and requires credit to ElevenLabs.

Third-party reference material used only for study is not included.
