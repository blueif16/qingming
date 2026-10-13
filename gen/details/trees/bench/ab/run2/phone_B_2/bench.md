# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0

2026-10-13T10:38:37.478Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 4961 ms · assets 25772 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 610 | 1.43 | 0.25 | 0.62 | 88 | 232k | 390×844 | – | 245 |
| phone proxy, 4x CPU | 466 | crown | 29 | 31.34 | 14.23 | 8.91 | 123 | 510k | 390×844 | – | 457 |
| warm | 432 | grain_wharf | 422 | 2.13 | 0.38 | 1.40 | 153 | 472k | 390×844 | – | 512 |
| phone proxy, 4x CPU | 432 | grain_wharf | 50 | 18.23 | 3.73 | 12.76 | 153 | 474k | 390×844 | – | 493 |
| warm | 308 | storyteller | 742 | 1.18 | 0.18 | 0.72 | 101 | 404k | 390×844 | – | 538 |
| phone proxy, 4x CPU | 308 | storyteller | 89 | 10.00 | 1.60 | 4.03 | 102 | 410k | 390×844 | – | 549 |

No console errors or warnings.
