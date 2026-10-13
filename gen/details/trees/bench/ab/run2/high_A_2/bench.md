# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&trees=cards

2026-10-13T10:46:30.964Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2820 ms · assets 23132 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 484 | 1.82 | 0.30 | 1.19 | 118 | 390k | 1920×1080 | – | 241 |
| high, 1080p | 467 | crown | 182 | 5.18 | 1.06 | 4.82 | 219 | 1937k | 1920×1080 | – | 391 |
| warm | 440 | grain_wharf | 186 | 5.09 | 0.91 | 4.56 | 210 | 765k | 1920×1080 | – | 293 |
| high, 1080p | 440 | grain_wharf | 210 | 4.48 | 0.79 | 4.33 | 211 | 774k | 1920×1080 | – | 286 |
| warm | 308 | storyteller | 288 | 3.19 | 0.40 | 3.44 | 152 | 1041k | 1920×1080 | – | 306 |
| high, 1080p | 308 | storyteller | 289 | 3.17 | 0.37 | 3.42 | 154 | 1058k | 1920×1080 | – | 304 |

No console errors or warnings.
