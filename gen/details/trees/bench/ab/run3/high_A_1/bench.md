# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0&trees=cards

2026-10-13T10:53:13.497Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 2432 ms · assets 23396 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 371 | crown | 626 | 1.42 | 0.22 | 1.17 | 127 | 455k | 1920×1080 | – | 312 |
| high, 1080p | 472 | crown | 340 | 2.71 | 0.52 | 2.33 | 219 | 1938k | 1920×1080 | – | 426 |
| warm | 443 | grain_wharf | 227 | 4.14 | 0.73 | 3.03 | 210 | 769k | 1920×1080 | – | 288 |
| high, 1080p | 443 | grain_wharf | 253 | 3.68 | 0.65 | 2.80 | 211 | 774k | 1920×1080 | – | 292 |
| warm | 308 | storyteller | 559 | 1.59 | 0.24 | 1.50 | 154 | 1050k | 1920×1080 | – | 303 |
| high, 1080p | 308 | storyteller | 619 | 1.43 | 0.20 | 1.46 | 154 | 1058k | 1920×1080 | – | 307 |

No console errors or warnings.
