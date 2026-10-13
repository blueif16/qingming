# Bench: http://127.0.0.1:5195/world.html?tier=high&adapt=0

2026-10-13T13:42:04.175Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2947 ms · assets 35470 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 263 | 3.58 | 0.55 | 3.22 | 385 | 2504k | 1920×1080 | – | 244 |
| high, 1080p | 475 | crown | 266 | 3.53 | 0.54 | 3.18 | 385 | 2521k | 1920×1080 | – | 244 |
| warm | 443 | grain_wharf | 281 | 3.35 | 0.44 | 2.84 | 364 | 1172k | 1920×1080 | – | 305 |
| high, 1080p | 443 | grain_wharf | 219 | 4.32 | 0.56 | 3.25 | 362 | 1164k | 1920×1080 | – | 315 |
| warm | 308 | storyteller | 498 | 1.84 | 0.20 | 1.85 | 283 | 1323k | 1920×1080 | – | 188 |
| high, 1080p | 308 | storyteller | 494 | 1.85 | 0.20 | 1.86 | 285 | 1331k | 1920×1080 | – | 192 |

No console errors or warnings.
