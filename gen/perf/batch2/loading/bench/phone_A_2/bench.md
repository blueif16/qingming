# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T09:06:54.907Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2637 ms · assets 35377 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 260 | 3.59 | 0.66 | 2.71 | 147 | 771k | 390×844 | – | 274 |
| phone proxy, 4x CPU | 466 | crown | 16 | 61.94 | 14.24 | 30.55 | 313 | 1474k | 390×844 | – | 260 |
| warm | 432 | grain_wharf | 248 | 3.78 | 0.59 | 2.74 | 166 | 469k | 390×844 | – | 308 |
| phone proxy, 4x CPU | 432 | grain_wharf | 16 | 61.86 | 13.74 | 30.10 | 303 | 779k | 390×844 | – | 323 |
| warm | 308 | storyteller | 483 | 1.86 | 0.26 | 1.53 | 98 | 396k | 390×844 | – | 180 |
| phone proxy, 4x CPU | 308 | storyteller | 39 | 24.45 | 3.66 | 11.52 | 99 | 402k | 390×844 | – | 184 |

No console errors or warnings.
