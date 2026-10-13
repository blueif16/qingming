# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T11:11:46.496Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2448 ms · assets 23376 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 907 | 0.94 | 0.17 | 0.41 | 85 | 224k | 390×844 | – | 265 |
| phone proxy, 4x CPU | 466 | crown | 42 | 22.34 | 10.36 | 10.69 | 111 | 627k | 390×844 | – | 385 |
| warm | 432 | grain_wharf | 445 | 2.06 | 0.41 | 1.70 | 150 | 469k | 390×844 | – | 326 |
| phone proxy, 4x CPU | 432 | grain_wharf | 70 | 13.32 | 3.00 | 8.25 | 150 | 468k | 390×844 | – | 307 |
| warm | 308 | storyteller | 937 | 0.94 | 0.15 | 0.59 | 98 | 397k | 390×844 | – | 251 |
| phone proxy, 4x CPU | 308 | storyteller | 127 | 6.95 | 1.22 | 3.79 | 99 | 401k | 390×844 | – | 276 |

No console errors or warnings.
