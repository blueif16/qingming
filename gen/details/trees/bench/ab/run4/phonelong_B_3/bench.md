# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=3d

2026-10-13T11:14:29.845Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2692 ms · assets 25924 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1212 | 0.72 | 0.12 | 0.39 | 86 | 231k | 390×844 | – | 240 |
| phone proxy, 4x CPU | 466 | crown | 59 | 15.98 | 7.92 | 8.83 | 127 | 768k | 390×844 | – | 315 |
| warm | 432 | grain_wharf | 629 | 1.46 | 0.26 | 1.24 | 151 | 476k | 390×844 | – | 306 |
| phone proxy, 4x CPU | 432 | grain_wharf | 76 | 12.17 | 2.59 | 7.46 | 151 | 475k | 390×844 | – | 329 |
| warm | 308 | storyteller | 1016 | 0.87 | 0.14 | 0.55 | 99 | 404k | 390×844 | – | 266 |
| phone proxy, 4x CPU | 308 | storyteller | 126 | 7.01 | 1.21 | 3.76 | 100 | 408k | 390×844 | – | 256 |

No console errors or warnings.
