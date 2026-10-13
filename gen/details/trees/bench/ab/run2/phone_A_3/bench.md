# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T10:40:21.986Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2928 ms · assets 23046 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 785 | 1.10 | 0.18 | 0.45 | 87 | 225k | 390×844 | – | 295 |
| phone proxy, 4x CPU | 466 | crown | 35 | 27.07 | 12.43 | 8.58 | 140 | 766k | 390×844 | – | 445 |
| warm | 432 | grain_wharf | 366 | 2.46 | 0.44 | 1.34 | 152 | 466k | 390×844 | – | 375 |
| phone proxy, 4x CPU | 432 | grain_wharf | 58 | 15.95 | 3.40 | 10.97 | 176 | 565k | 390×844 | – | 379 |
| warm | 308 | storyteller | 592 | 1.46 | 0.22 | 0.74 | 100 | 397k | 390×844 | – | 450 |
| phone proxy, 4x CPU | 308 | storyteller | 40 | 22.47 | 3.96 | 12.09 | 101 | 403k | 390×844 | – | 462 |

No console errors or warnings.
