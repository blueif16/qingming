# Bench: http://127.0.0.1:5190/world.html?start=0&tier=low&adapt=0&gpumem=1

2026-10-13T09:45:52.622Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3142 ms · assets 25292 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 1024 | 0.85 | 0.13 | 0.45 | 88 | 243k | 390×844 | 69 | 313 |
| phone proxy, 4x CPU | 466 | crown | 55 | 17.19 | 8.15 | 9.35 | 122 | 697k | 390×844 | 92 | 508 |
| warm | 308 | storyteller | 881 | 0.98 | 0.14 | 0.56 | 101 | 403k | 390×844 | 78 | 505 |
| phone proxy, 4x CPU | 308 | storyteller | 140 | 6.29 | 0.96 | 3.53 | 102 | 409k | 390×844 | 78 | 492 |

No console errors or warnings.
