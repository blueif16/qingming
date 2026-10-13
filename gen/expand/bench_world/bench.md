# Bench: http://127.0.0.1:5180/world.html?sections=inner_city,gate,outer_road

2026-10-12T09:25:42.852Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 2 s per row · load 3208 ms · assets 21092 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | storyteller | 220 | 4.43 | 1.21 | 3.29 | 331 | 1922k |
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | crossroads | 235 | 3.84 | 0.77 | 3.20 | 319 | 1790k |
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | street | 230 | 4.53 | 0.89 | 3.27 | 451 | 2740k |
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | bridge | 227 | 4.21 | 0.50 | 3.42 | 477 | 3747k |
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | carts | 262 | 3.61 | 0.25 | 3.30 | 317 | 1369k |
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | post | 284 | 3.32 | 0.21 | 3.08 | 289 | 1118k |
| joined world: S6 + S5 + S4, every painted figure and animal | 371 | tower | 283 | 3.35 | 0.24 | 3.03 | 395 | 2225k |
| joined world + 200 load-test walkers | 571 | storyteller | 215 | 4.45 | 1.12 | 3.48 | 331 | 1912k |
| joined world + 200 load-test walkers | 571 | street | 176 | 5.45 | 1.36 | 3.76 | 451 | 5059k |
| joined world + 200 load-test walkers | 571 | carts | 180 | 5.29 | 1.32 | 3.63 | 317 | 1369k |
| joined world, CPU 4x slower | 371 | storyteller | 29 | 32.59 | 3.74 | 20.06 | 331 | 1922k |
| joined world, CPU 4x slower | 371 | street | 31 | 30.74 | 3.39 | 22.46 | 454 | 2750k |
| joined world, CPU 4x slower | 371 | carts | 48 | 19.51 | 2.13 | 18.31 | 317 | 1369k |

No console errors or warnings.
