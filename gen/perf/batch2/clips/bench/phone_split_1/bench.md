# Bench: http://127.0.0.1:5196/world.html?tier=low&adapt=0

2026-10-13T14:22:21.341Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3037 ms · assets 17233 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 386 | 2.40 | 0.56 | 1.56 | 127 | 767k | 390×844 | – | 239 |
| phone proxy, 4x CPU | 466 | crown | 46 | 20.10 | 4.97 | 8.75 | 127 | 769k | 390×844 | – | 259 |
| warm | 432 | grain_wharf | 324 | 2.86 | 0.62 | 1.95 | 148 | 469k | 390×844 | – | 200 |
| phone proxy, 4x CPU | 432 | grain_wharf | 26 | 36.72 | 10.58 | 15.21 | 170 | 572k | 390×844 | – | 188 |
| warm | 308 | storyteller | 681 | 1.30 | 0.24 | 0.79 | 98 | 397k | 390×844 | – | 144 |
| phone proxy, 4x CPU | 308 | storyteller | 84 | 10.86 | 2.05 | 4.16 | 99 | 403k | 390×844 | – | 150 |

No console errors or warnings.
