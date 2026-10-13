# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=3d

2026-10-13T11:03:33.090Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3330 ms · assets 26111 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 671 | 1.30 | 0.22 | 0.55 | 86 | 235k | 390×844 | – | 331 |
| phone proxy, 4x CPU | 466 | crown | 31 | 29.92 | 13.04 | 13.49 | 106 | 485k | 390×844 | – | 402 |
| warm | 432 | grain_wharf | 247 | 3.75 | 0.71 | 2.46 | 151 | 475k | 390×844 | – | 346 |
| phone proxy, 4x CPU | 432 | grain_wharf | 19 | 50.97 | 15.69 | 20.18 | 175 | 578k | 390×844 | – | 342 |
| warm | 308 | storyteller | 1045 | 0.84 | 0.12 | 0.54 | 99 | 404k | 390×844 | – | 309 |
| phone proxy, 4x CPU | 308 | storyteller | 133 | 6.59 | 1.04 | 3.86 | 100 | 408k | 390×844 | – | 321 |

No console errors or warnings.
