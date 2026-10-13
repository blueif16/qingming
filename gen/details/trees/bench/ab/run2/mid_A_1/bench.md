# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0&trees=cards

2026-10-13T10:24:33.474Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 4887 ms · assets 22840 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 431 | 2.09 | 0.34 | 1.50 | 119 | 398k | 1920×1080 | – | 411 |
| mid, 1080p | 472 | crown | 280 | 3.23 | 0.69 | 3.26 | 164 | 1214k | 1920×1080 | – | 570 |
| warm | 440 | grain_wharf | 274 | 3.36 | 0.64 | 3.09 | 164 | 543k | 1920×1080 | – | 360 |
| mid, 1080p | 440 | grain_wharf | 246 | 3.81 | 0.71 | 3.16 | 163 | 538k | 1920×1080 | – | 353 |
| warm | 308 | storyteller | 286 | 3.08 | 0.46 | 2.45 | 127 | 640k | 1920×1080 | – | 455 |
| mid, 1080p | 308 | storyteller | 276 | 3.23 | 0.47 | 2.68 | 127 | 649k | 1920×1080 | – | 476 |

No console errors or warnings.
