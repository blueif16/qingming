# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&trees=3d

2026-10-13T11:09:04.633Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2771 ms · assets 26177 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 937 | 0.93 | 0.15 | 0.41 | 82 | 219k | 390×844 | – | 238 |
| phone proxy, 4x CPU | 466 | crown | 50 | 18.70 | 8.95 | 9.38 | 113 | 635k | 390×844 | – | 351 |
| warm | 432 | grain_wharf | 529 | 1.73 | 0.33 | 1.44 | 151 | 475k | 390×844 | – | 405 |
| phone proxy, 4x CPU | 432 | grain_wharf | 68 | 13.62 | 3.08 | 6.80 | 151 | 475k | 390×844 | – | 409 |
| warm | 308 | storyteller | 1016 | 0.86 | 0.13 | 0.54 | 99 | 404k | 390×844 | – | 273 |
| phone proxy, 4x CPU | 308 | storyteller | 134 | 6.54 | 1.06 | 3.86 | 100 | 408k | 390×844 | – | 276 |

No console errors or warnings.
