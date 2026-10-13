# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T11:00:43.508Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2992 ms · assets 23376 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 907 | 0.94 | 0.17 | 0.44 | 85 | 224k | 390×844 | – | 228 |
| phone proxy, 4x CPU | 466 | crown | 31 | 30.29 | 13.48 | 12.95 | 136 | 713k | 390×844 | – | 407 |
| warm | 432 | grain_wharf | 404 | 2.26 | 0.42 | 1.35 | 150 | 468k | 390×844 | – | 309 |
| phone proxy, 4x CPU | 432 | grain_wharf | 40 | 23.21 | 5.47 | 15.46 | 174 | 572k | 390×844 | – | 300 |
| warm | 308 | storyteller | 933 | 0.93 | 0.14 | 0.59 | 98 | 397k | 390×844 | – | 297 |
| phone proxy, 4x CPU | 308 | storyteller | 81 | 10.94 | 1.79 | 6.69 | 99 | 401k | 390×844 | – | 318 |

No console errors or warnings.
