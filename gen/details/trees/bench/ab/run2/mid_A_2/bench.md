# Bench: http://127.0.0.1:5190/world.html?start=0&tier=mid&adapt=0&trees=cards

2026-10-13T10:27:22.945Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2817 ms · assets 22822 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 511 | 1.73 | 0.28 | 0.88 | 112 | 359k | 1920×1080 | – | 273 |
| mid, 1080p | 467 | crown | 222 | 4.01 | 0.83 | 2.44 | 164 | 1214k | 1920×1080 | – | 370 |
| warm | 440 | grain_wharf | 257 | 3.34 | 0.61 | 2.20 | 164 | 542k | 1920×1080 | – | 412 |
| mid, 1080p | 440 | grain_wharf | 298 | 3.03 | 0.54 | 1.85 | 163 | 538k | 1920×1080 | – | 398 |
| warm | 308 | storyteller | 341 | 2.52 | 0.38 | 1.46 | 127 | 640k | 1920×1080 | – | 460 |
| mid, 1080p | 308 | storyteller | 444 | 1.91 | 0.27 | 1.15 | 127 | 649k | 1920×1080 | – | 466 |

No console errors or warnings.
