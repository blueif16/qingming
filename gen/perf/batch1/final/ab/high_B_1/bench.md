# Bench: http://127.0.0.1:5199/world.html?tier=high&adapt=0

2026-10-13T06:35:19.932Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2657 ms · assets 35353 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 188 | 5.07 | 0.75 | 4.89 | 385 | 2513k | 1920×1080 | – | 286 |
| high, 1080p | 466 | crown | 201 | 4.73 | 0.69 | 4.72 | 385 | 2513k | 1920×1080 | – | 303 |
| warm | 432 | grain_wharf | 214 | 4.45 | 0.58 | 3.95 | 362 | 1159k | 1920×1080 | – | 230 |
| high, 1080p | 432 | grain_wharf | 182 | 5.24 | 0.67 | 4.89 | 362 | 1159k | 1920×1080 | – | 224 |
| warm | 308 | storyteller | 368 | 2.52 | 0.25 | 2.11 | 283 | 1314k | 1920×1080 | – | 188 |
| high, 1080p | 308 | storyteller | 397 | 2.33 | 0.22 | 2.01 | 285 | 1332k | 1920×1080 | – | 172 |

No console errors or warnings.
