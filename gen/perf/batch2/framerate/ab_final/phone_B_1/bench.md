# Bench: http://127.0.0.1:5196/world.html?start=0&tier=low&adapt=0

2026-10-13T09:50:25.550Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2750 ms · assets 31080 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 574 | 1.53 | 0.29 | 0.56 | 86 | 228k | 390×844 | – | 282 |
| phone proxy, 4x CPU | 466 | crown | 50 | 18.79 | 8.95 | 9.73 | 113 | 635k | 390×844 | – | 481 |
| warm | 432 | grain_wharf | 337 | 2.74 | 0.53 | 2.36 | 151 | 471k | 390×844 | – | 367 |
| phone proxy, 4x CPU | 432 | grain_wharf | 22 | 43.40 | 12.51 | 16.99 | 175 | 570k | 390×844 | – | 344 |
| warm | 308 | storyteller | 462 | 1.91 | 0.30 | 0.97 | 99 | 398k | 390×844 | – | 478 |
| phone proxy, 4x CPU | 308 | storyteller | 40 | 23.14 | 4.34 | 8.61 | 100 | 404k | 390×844 | – | 504 |

No console errors or warnings.
