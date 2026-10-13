# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0

2026-10-13T10:15:07.984Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3874 ms · assets 25470 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 524 | 1.70 | 0.29 | 0.62 | 88 | 232k | 390×844 | – | 301 |
| phone proxy, 4x CPU | 466 | crown | 18 | 52.22 | 22.74 | 15.11 | 123 | 510k | 390×844 | – | 445 |
| warm | 432 | grain_wharf | 296 | 3.09 | 0.56 | 1.77 | 153 | 472k | 390×844 | – | 365 |
| phone proxy, 4x CPU | 432 | grain_wharf | 26 | 36.00 | 8.62 | 21.46 | 177 | 572k | 390×844 | – | 383 |
| warm | 308 | storyteller | 478 | 1.83 | 0.28 | 0.94 | 101 | 404k | 390×844 | – | 520 |
| phone proxy, 4x CPU | 308 | storyteller | 51 | 17.32 | 2.76 | 10.64 | 102 | 410k | 390×844 | – | 516 |

No console errors or warnings.
