# Bench: http://127.0.0.1:5195/world.html?tier=high&adapt=0

2026-10-13T13:37:48.473Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2783 ms · assets 35461 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 268 | 3.51 | 0.57 | 3.15 | 385 | 2504k | 1920×1080 | – | 270 |
| high, 1080p | 475 | crown | 245 | 3.84 | 0.61 | 3.28 | 385 | 2522k | 1920×1080 | – | 258 |
| warm | 443 | grain_wharf | 171 | 5.60 | 0.75 | 4.19 | 362 | 1162k | 1920×1080 | – | 322 |
| high, 1080p | 443 | grain_wharf | 198 | 4.84 | 0.64 | 3.90 | 362 | 1164k | 1920×1080 | – | 309 |
| warm | 308 | storyteller | 333 | 2.78 | 0.31 | 2.52 | 283 | 1314k | 1920×1080 | – | 191 |
| high, 1080p | 308 | storyteller | 315 | 2.97 | 0.32 | 2.85 | 285 | 1332k | 1920×1080 | – | 186 |

No console errors or warnings.
