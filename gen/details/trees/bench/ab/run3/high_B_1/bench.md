# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&trees=3d

2026-10-13T10:54:32.243Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2647 ms · assets 25325 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 413 | 2.23 | 0.45 | 2.22 | 220 | 1961k | 1920×1080 | – | 370 |
| high, 1080p | 475 | crown | 367 | 2.51 | 0.51 | 2.44 | 220 | 1979k | 1920×1080 | – | 377 |
| warm | 443 | grain_wharf | 349 | 2.66 | 0.47 | 2.53 | 212 | 881k | 1920×1080 | – | 258 |
| high, 1080p | 443 | grain_wharf | 369 | 2.51 | 0.44 | 2.41 | 214 | 887k | 1920×1080 | – | 272 |
| warm | 308 | storyteller | 548 | 1.62 | 0.22 | 1.54 | 153 | 1071k | 1920×1080 | – | 276 |
| high, 1080p | 308 | storyteller | 394 | 2.28 | 0.31 | 1.86 | 155 | 1071k | 1920×1080 | – | 267 |

No console errors or warnings.
