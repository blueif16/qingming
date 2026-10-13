# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1

2026-10-13T09:48:37.066Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 5255 ms · assets 25461 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 360 | 2.45 | 0.43 | 0.91 | 84 | 222k | 390×844 | 76 | 309 |
| phone proxy, 4x CPU | 466 | crown | 16 | 58.16 | 25.73 | 15.30 | 99 | 354k | 390×844 | 80 | 444 |
| warm | 308 | storyteller | 613 | 1.42 | 0.20 | 0.75 | 101 | 404k | 390×844 | 84 | 483 |
| phone proxy, 4x CPU | 308 | storyteller | 44 | 21.18 | 3.26 | 8.64 | 102 | 410k | 390×844 | 84 | 501 |

No console errors or warnings.
