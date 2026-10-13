# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T10:33:20.973Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3678 ms · assets 22881 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 727 | 1.19 | 0.19 | 0.54 | 87 | 225k | 390×844 | – | 227 |
| phone proxy, 4x CPU | 466 | crown | 29 | 31.23 | 13.41 | 12.23 | 103 | 394k | 390×844 | – | 415 |
| warm | 432 | grain_wharf | 408 | 2.24 | 0.42 | 1.81 | 152 | 470k | 390×844 | – | 362 |
| phone proxy, 4x CPU | 432 | grain_wharf | 53 | 17.27 | 3.57 | 11.78 | 152 | 470k | 390×844 | – | 361 |
| warm | 308 | storyteller | 704 | 1.24 | 0.19 | 0.67 | 100 | 397k | 390×844 | – | 519 |
| phone proxy, 4x CPU | 308 | storyteller | 85 | 10.37 | 1.71 | 6.73 | 101 | 403k | 390×844 | – | 526 |

No console errors or warnings.
