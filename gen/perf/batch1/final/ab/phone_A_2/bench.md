# Bench: http://127.0.0.1:5195/world.html?

2026-10-13T06:45:47.566Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3067 ms · assets 35216 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 131 | 7.35 | 0.84 | 6.42 | 390 | 2259k | 585×1266 | – | 274 |
| phone proxy, 4x CPU | 466 | crown | 14 | 70.94 | 12.49 | 47.11 | 387 | 2244k | 585×1266 | – | 275 |
| warm | 432 | grain_wharf | 126 | 7.74 | 0.81 | 6.06 | 402 | 1268k | 585×1266 | – | 314 |
| phone proxy, 4x CPU | 432 | grain_wharf | 13 | 78.08 | 12.11 | 50.14 | 402 | 1268k | 585×1266 | – | 342 |
| warm | 308 | storyteller | 299 | 3.12 | 0.26 | 2.98 | 308 | 1291k | 585×1266 | – | 158 |
| phone proxy, 4x CPU | 308 | storyteller | 30 | 32.26 | 3.52 | 19.73 | 311 | 1309k | 585×1266 | – | 151 |

No console errors or warnings.
