# Bench: http://127.0.0.1:5180/gate.html

2026-10-12T04:40:08.219Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 2 s per row · load 886 ms · assets 4962 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| gate with its 77 painted people | 77 | bridge | 303 | 3.13 | 0.72 | 2.52 | 383 | 1225k |
| gate with its 77 painted people | 77 | street | 215 | 4.45 | 1.10 | 3.28 | 377 | 1223k |
| gate with its 77 painted people | 77 | tower | 207 | 4.60 | 1.26 | 3.46 | 296 | 932k |
| 1 gate + 40 load-test walkers (117 people) | 117 | bridge | 144 | 6.70 | 1.88 | 5.03 | 501 | 1729k |
| 1 gate + 40 load-test walkers (117 people) | 117 | street | 142 | 6.81 | 1.91 | 5.02 | 495 | 1728k |
| 1 gate + 40 load-test walkers (117 people) | 117 | tower | 158 | 6.11 | 1.88 | 4.55 | 364 | 1222k |
| 4 gates, 308 people (each with its own routines) | 308 | bridge | 66 | 14.84 | 4.94 | 8.69 | 475 | 1495k |
| 4 gates, 308 people (each with its own routines) | 308 | street | 34 | 29.02 | 6.64 | 17.52 | 1224 | 4039k |
| 4 gates, 308 people (each with its own routines) | 308 | tower | 47 | 20.83 | 5.39 | 13.99 | 1144 | 3752k |
| 4 gates 308 people, CPU 4x slower | 308 | tower | 11 | 95.78 | 23.25 | 50.07 | 1144 | 3752k |
| 1 gate 77 people, CPU 4x slower | 77 | tower | 37 | 25.71 | 6.32 | 17.90 | 296 | 932k |

No console errors or warnings.
