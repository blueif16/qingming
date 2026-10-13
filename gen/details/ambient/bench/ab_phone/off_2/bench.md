# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1&ambient=0

2026-10-13T09:47:07.212Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3419 ms · assets 25528 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1037 | 0.83 | 0.13 | 0.41 | 84 | 234k | 390×844 | 91 | 301 |
| phone proxy, 4x CPU | 466 | crown | 20 | 45.65 | 19.15 | 20.00 | 106 | 485k | 390×844 | 100 | 461 |
| warm | 308 | storyteller | 581 | 1.50 | 0.22 | 0.79 | 99 | 402k | 390×844 | 100 | 520 |
| phone proxy, 4x CPU | 308 | storyteller | 38 | 24.23 | 4.11 | 13.11 | 100 | 408k | 390×844 | 100 | 524 |

No console errors or warnings.
