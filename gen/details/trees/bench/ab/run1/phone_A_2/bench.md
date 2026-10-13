# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T10:13:16.752Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3276 ms · assets 22844 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 850 | 1.02 | 0.17 | 0.46 | 87 | 225k | 390×844 | – | 365 |
| phone proxy, 4x CPU | 466 | crown | 18 | 53.60 | 24.03 | 15.04 | 102 | 381k | 390×844 | – | 511 |
| warm | 432 | grain_wharf | 386 | 2.36 | 0.47 | 1.56 | 152 | 470k | 390×844 | – | 547 |
| phone proxy, 4x CPU | 432 | grain_wharf | 70 | 13.03 | 3.01 | 8.38 | 176 | 570k | 390×844 | – | 562 |
| warm | 308 | storyteller | 586 | 1.52 | 0.24 | 1.06 | 100 | 397k | 390×844 | – | 422 |
| phone proxy, 4x CPU | 308 | storyteller | 44 | 21.16 | 3.81 | 8.06 | 119 | 555k | 390×844 | – | 395 |

No console errors or warnings.
