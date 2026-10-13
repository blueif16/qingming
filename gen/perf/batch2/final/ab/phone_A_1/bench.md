# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T13:31:16.938Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3640 ms · assets 35393 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 312 | 2.97 | 0.56 | 1.90 | 147 | 771k | 390×844 | – | 298 |
| phone proxy, 4x CPU | 466 | crown | 46 | 20.29 | 4.10 | 12.84 | 146 | 768k | 390×844 | – | 299 |
| warm | 432 | grain_wharf | 385 | 2.40 | 0.39 | 1.98 | 166 | 469k | 390×844 | – | 214 |
| phone proxy, 4x CPU | 432 | grain_wharf | 43 | 22.09 | 4.23 | 15.02 | 166 | 468k | 390×844 | – | 217 |
| warm | 308 | storyteller | 686 | 1.29 | 0.16 | 0.82 | 98 | 396k | 390×844 | – | 171 |
| phone proxy, 4x CPU | 308 | storyteller | 76 | 11.86 | 1.63 | 7.88 | 99 | 402k | 390×844 | – | 185 |

No console errors or warnings.
