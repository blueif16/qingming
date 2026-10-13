# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T10:36:50.894Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3736 ms · assets 22909 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 725 | 1.19 | 0.20 | 0.48 | 87 | 225k | 390×844 | – | 327 |
| phone proxy, 4x CPU | 466 | crown | 34 | 27.69 | 11.84 | 13.19 | 110 | 508k | 390×844 | – | 410 |
| warm | 432 | grain_wharf | 303 | 3.04 | 0.55 | 1.91 | 152 | 466k | 390×844 | – | 375 |
| phone proxy, 4x CPU | 432 | grain_wharf | 52 | 17.77 | 3.74 | 11.88 | 152 | 468k | 390×844 | – | 372 |
| warm | 308 | storyteller | 410 | 2.17 | 0.32 | 1.13 | 100 | 397k | 390×844 | – | 489 |
| phone proxy, 4x CPU | 308 | storyteller | 36 | 25.72 | 4.55 | 10.21 | 101 | 403k | 390×844 | – | 477 |

No console errors or warnings.
