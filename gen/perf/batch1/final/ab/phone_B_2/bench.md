# Bench: http://127.0.0.1:5199/world.html?tier=low&adapt=0

2026-10-13T06:49:48.938Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2313 ms · assets 35353 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 303 | 3.08 | 0.56 | 2.41 | 146 | 773k | 390×844 | – | 261 |
| phone proxy, 4x CPU | 466 | crown | 31 | 30.64 | 6.52 | 15.69 | 313 | 1484k | 390×844 | – | 256 |
| warm | 432 | grain_wharf | 296 | 3.16 | 0.49 | 2.55 | 166 | 469k | 390×844 | – | 306 |
| phone proxy, 4x CPU | 432 | grain_wharf | 33 | 29.33 | 5.52 | 14.60 | 303 | 781k | 390×844 | – | 305 |
| warm | 308 | storyteller | 443 | 2.06 | 0.26 | 1.30 | 98 | 396k | 390×844 | – | 177 |
| phone proxy, 4x CPU | 308 | storyteller | 65 | 14.33 | 2.03 | 6.73 | 99 | 402k | 390×844 | – | 184 |

No console errors or warnings.
