# Bench: http://127.0.0.1:5195/world.html?tier=low&adapt=0

2026-10-13T09:43:59.355Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2282 ms · assets 35407 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 340 | 2.71 | 0.50 | 2.10 | 147 | 771k | 390×844 | – | 262 |
| phone proxy, 4x CPU | 466 | crown | 44 | 21.79 | 4.22 | 12.71 | 146 | 768k | 390×844 | – | 244 |
| warm | 432 | grain_wharf | 323 | 2.86 | 0.45 | 2.18 | 166 | 469k | 390×844 | – | 309 |
| phone proxy, 4x CPU | 432 | grain_wharf | 18 | 53.41 | 11.49 | 26.18 | 303 | 779k | 390×844 | – | 311 |
| warm | 308 | storyteller | 284 | 3.24 | 0.40 | 1.91 | 98 | 396k | 390×844 | – | 194 |
| phone proxy, 4x CPU | 308 | storyteller | 37 | 25.25 | 3.56 | 11.79 | 99 | 402k | 390×844 | – | 189 |

No console errors or warnings.
