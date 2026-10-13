# Bench: http://127.0.0.1:5196/world.html?tier=low&adapt=0

2026-10-13T08:27:54.256Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 390×844 · 3 s per row · load 3424 ms · assets 35378 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 466 | crown | 176 | 5.32 | 1.01 | 3.48 | 128 | 771k | 390×844 | – | 262 |
| phone proxy, 4x CPU | 466 | crown | 17 | 60.70 | 18.76 | 25.46 | 127 | 768k | 390×844 | – | 258 |
| warm | 432 | grain_wharf | 172 | 5.45 | 0.90 | 3.86 | 150 | 469k | 390×844 | – | 301 |
| phone proxy, 4x CPU | 432 | grain_wharf | 24 | 40.42 | 10.11 | 17.95 | 150 | 468k | 390×844 | – | 300 |
| warm | 308 | storyteller | 368 | 2.46 | 0.33 | 1.73 | 98 | 396k | 390×844 | – | 202 |
| phone proxy, 4x CPU | 308 | storyteller | 68 | 13.59 | 1.94 | 6.69 | 242 | 822k | 390×844 | – | 191 |

No console errors or warnings.
