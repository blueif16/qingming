# Bench: http://127.0.0.1:5195/world.html?

2026-10-13T06:39:44.395Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 2971 ms · assets 35216 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 184 | 5.22 | 0.63 | 4.76 | 390 | 2259k | 585×1266 | – | 279 |
| phone proxy, 4x CPU | 466 | crown | 25 | 38.55 | 5.95 | 28.59 | 387 | 2244k | 585×1266 | – | 294 |
| warm | 432 | grain_wharf | 190 | 5.05 | 0.54 | 4.31 | 402 | 1268k | 585×1266 | – | 285 |
| phone proxy, 4x CPU | 432 | grain_wharf | 20 | 48.33 | 7.13 | 33.14 | 402 | 1268k | 585×1266 | – | 301 |
| warm | 308 | storyteller | 397 | 2.35 | 0.21 | 2.17 | 308 | 1291k | 585×1266 | – | 159 |
| phone proxy, 4x CPU | 308 | storyteller | 41 | 23.27 | 2.40 | 16.99 | 311 | 1309k | 585×1266 | – | 162 |

No console errors or warnings.
