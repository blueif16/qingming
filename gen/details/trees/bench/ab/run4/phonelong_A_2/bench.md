# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T11:06:18.833Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2516 ms · assets 23387 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1038 | 0.83 | 0.14 | 0.42 | 85 | 224k | 390×844 | – | 272 |
| phone proxy, 4x CPU | 466 | crown | 41 | 23.05 | 10.43 | 11.48 | 111 | 622k | 390×844 | – | 403 |
| warm | 432 | grain_wharf | 464 | 1.97 | 0.39 | 1.58 | 150 | 468k | 390×844 | – | 332 |
| phone proxy, 4x CPU | 432 | grain_wharf | 55 | 17.05 | 4.03 | 11.05 | 150 | 468k | 390×844 | – | 331 |
| warm | 308 | storyteller | 957 | 0.91 | 0.14 | 0.56 | 98 | 397k | 390×844 | – | 290 |
| phone proxy, 4x CPU | 308 | storyteller | 125 | 6.98 | 1.13 | 3.86 | 99 | 401k | 390×844 | – | 309 |

No console errors or warnings.
