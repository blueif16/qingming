# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T08:59:33.037Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3522 ms · assets 35370 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 287 | 3.25 | 0.63 | 2.96 | 146 | 766k | 390×844 | – | 272 |
| phone proxy, 4x CPU | 466 | crown | 20 | 48.00 | 10.88 | 24.95 | 313 | 1474k | 390×844 | – | 273 |
| warm | 432 | grain_wharf | 345 | 2.70 | 0.42 | 2.10 | 166 | 469k | 390×844 | – | 329 |
| phone proxy, 4x CPU | 432 | grain_wharf | 24 | 39.20 | 7.71 | 19.77 | 303 | 779k | 390×844 | – | 318 |
| warm | 308 | storyteller | 524 | 1.72 | 0.22 | 1.15 | 98 | 396k | 390×844 | – | 216 |
| phone proxy, 4x CPU | 308 | storyteller | 64 | 14.26 | 1.98 | 7.88 | 99 | 402k | 390×844 | – | 197 |

No console errors or warnings.
