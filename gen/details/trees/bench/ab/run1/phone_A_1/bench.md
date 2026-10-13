# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=cards

2026-10-13T10:09:35.310Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 5042 ms · assets 22800 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 594 | 1.47 | 0.26 | 0.55 | 91 | 239k | 390×844 | – | 312 |
| phone proxy, 4x CPU | 466 | crown | 17 | 55.28 | 23.93 | 16.89 | 123 | 510k | 390×844 | – | 388 |
| warm | 432 | grain_wharf | 432 | 2.10 | 0.38 | 1.58 | 152 | 466k | 390×844 | – | 380 |
| phone proxy, 4x CPU | 432 | grain_wharf | 55 | 16.64 | 3.41 | 10.20 | 152 | 468k | 390×844 | – | 381 |
| warm | 308 | storyteller | 588 | 1.50 | 0.22 | 1.09 | 100 | 397k | 390×844 | – | 454 |
| phone proxy, 4x CPU | 308 | storyteller | 41 | 22.73 | 3.82 | 9.06 | 101 | 403k | 390×844 | – | 452 |

No console errors or warnings.
