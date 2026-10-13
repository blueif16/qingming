# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0&trees=cards

2026-10-13T10:19:20.653Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2835 ms · assets 22847 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 367 | 2.44 | 0.42 | 1.33 | 119 | 394k | 1920×1080 | – | 375 |
| mid, 1080p | 472 | crown | 306 | 2.93 | 0.65 | 2.03 | 164 | 1214k | 1920×1080 | – | 515 |
| warm | 440 | grain_wharf | 305 | 3.02 | 0.60 | 1.89 | 163 | 538k | 1920×1080 | – | 413 |
| mid, 1080p | 440 | grain_wharf | 278 | 3.29 | 0.64 | 2.06 | 163 | 538k | 1920×1080 | – | 412 |
| warm | 308 | storyteller | 308 | 2.83 | 0.43 | 1.91 | 127 | 640k | 1920×1080 | – | 584 |
| mid, 1080p | 308 | storyteller | 287 | 3.02 | 0.44 | 1.89 | 127 | 645k | 1920×1080 | – | 600 |

No console errors or warnings.
