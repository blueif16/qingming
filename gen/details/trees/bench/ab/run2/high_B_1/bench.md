# Bench: http://127.0.0.1:5190/world.html?start=0&tier=high&adapt=0

2026-10-13T10:45:05.488Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 3034 ms · assets 24939 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) | buffer | GPU MB | heap MB |
|---|---|---|---|---|---|---|---|---|---|---|---|
| warm | 475 | crown | 224 | 4.18 | 0.84 | 3.48 | 220 | 1960k | 1920×1080 | – | 269 |
| high, 1080p | 475 | crown | 271 | 3.46 | 0.69 | 3.56 | 220 | 1977k | 1920×1080 | – | 279 |
| warm | 442 | grain_wharf | 210 | 4.50 | 0.80 | 4.03 | 218 | 900k | 1920×1080 | – | 271 |
| high, 1080p | 442 | grain_wharf | 220 | 4.29 | 0.75 | 3.75 | 216 | 886k | 1920×1080 | – | 271 |
| warm | 308 | storyteller | 339 | 2.69 | 0.40 | 2.94 | 153 | 1062k | 1920×1080 | – | 265 |
| high, 1080p | 308 | storyteller | 342 | 2.66 | 0.38 | 2.76 | 155 | 1088k | 1920×1080 | – | 270 |

No console errors or warnings.
