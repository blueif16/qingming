# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0&trees=cards

2026-10-13T10:30:08.073Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 3340 ms · assets 22948 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 453 | 1.96 | 0.32 | 1.05 | 119 | 398k | 1920×1080 | – | 299 |
| mid, 1080p | 472 | crown | 256 | 3.40 | 0.70 | 2.29 | 164 | 1214k | 1920×1080 | – | 372 |
| warm | 440 | grain_wharf | 275 | 3.25 | 0.60 | 2.05 | 164 | 543k | 1920×1080 | – | 413 |
| mid, 1080p | 440 | grain_wharf | 312 | 2.94 | 0.53 | 1.79 | 163 | 538k | 1920×1080 | – | 409 |
| warm | 308 | storyteller | 490 | 1.81 | 0.28 | 1.14 | 127 | 645k | 1920×1080 | – | 531 |
| mid, 1080p | 308 | storyteller | 365 | 2.25 | 0.34 | 1.36 | 127 | 640k | 1920×1080 | – | 533 |

No console errors or warnings.
