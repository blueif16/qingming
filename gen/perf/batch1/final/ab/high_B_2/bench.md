# Bench: http://127.0.0.1:5199/world.html?tier=high&adapt=0

2026-10-13T06:38:02.712Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2330 ms · assets 35353 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 264 | 3.60 | 0.57 | 3.17 | 385 | 2513k | 1920×1080 | – | 271 |
| high, 1080p | 466 | crown | 233 | 4.09 | 0.64 | 3.55 | 385 | 2513k | 1920×1080 | – | 257 |
| warm | 432 | grain_wharf | 198 | 4.82 | 0.61 | 4.00 | 362 | 1159k | 1920×1080 | – | 315 |
| high, 1080p | 432 | grain_wharf | 235 | 4.04 | 0.50 | 3.22 | 362 | 1159k | 1920×1080 | – | 313 |
| warm | 308 | storyteller | 333 | 2.79 | 0.30 | 2.40 | 283 | 1314k | 1920×1080 | – | 187 |
| high, 1080p | 308 | storyteller | 341 | 2.73 | 0.28 | 2.23 | 285 | 1340k | 1920×1080 | – | 195 |

No console errors or warnings.
