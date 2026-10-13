# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0

2026-10-13T10:11:27.839Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3875 ms · assets 24387 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 585 | 1.50 | 0.24 | 0.53 | 88 | 232k | 390×844 | – | 410 |
| phone proxy, 4x CPU | 466 | crown | 18 | 51.44 | 22.97 | 14.26 | 123 | 510k | 390×844 | – | 517 |
| warm | 432 | grain_wharf | 305 | 3.03 | 0.59 | 2.41 | 153 | 472k | 390×844 | – | 388 |
| phone proxy, 4x CPU | 432 | grain_wharf | 19 | 50.57 | 15.91 | 19.80 | 153 | 474k | 390×844 | – | 387 |
| warm | 308 | storyteller | 476 | 1.86 | 0.27 | 1.10 | 119 | 555k | 390×844 | – | 535 |
| phone proxy, 4x CPU | 308 | storyteller | 49 | 18.90 | 3.27 | 11.23 | 120 | 561k | 390×844 | – | 535 |

No console errors or warnings.
