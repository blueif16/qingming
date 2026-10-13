# Bench: http://127.0.0.1:5180/gate.html

2026-10-10T17:21:35.910Z · ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 SUPER (0x00002783) Direct3D11 vs_5_0 ps_5_0, D3D11) · 1920×1080 · 3 s per row · load 440 ms · assets 2678 KB

| run | people | view | fps | CPU ms | of which animation | GPU ms | draw calls | tris (all passes) |
|---|---|---|---|---|---|---|---|---|
| rebuilt gate, 6 figures | 6 | bridge | 1317 | 0.65 | 0.04 | 0.72 | 161 | 324k |
| rebuilt gate, 6 figures | 6 | street | 1306 | 0.66 | 0.05 | 0.72 | 156 | 324k |
| rebuilt gate, 6 figures | 6 | tower | 1483 | 0.59 | 0.04 | 0.67 | 133 | 322k |
| 1 gate, 60 people | 60 | bridge | 524 | 1.79 | 0.39 | 1.72 | 323 | 1013k |
| 1 gate, 60 people | 60 | street | 554 | 1.69 | 0.36 | 1.64 | 318 | 1013k |
| 1 gate, 60 people | 60 | tower | 500 | 1.87 | 0.41 | 1.80 | 295 | 1011k |
| 4 gates, 240 people | 240 | bridge | 141 | 6.93 | 1.63 | 4.97 | 914 | 3410k |
| 4 gates, 240 people | 240 | street | 143 | 6.83 | 1.54 | 4.92 | 1173 | 3904k |
| 4 gates, 240 people | 240 | tower | 145 | 6.70 | 1.55 | 4.75 | 1150 | 3901k |
| 4 gates, no ink normal pass | 240 | tower | 189 | 5.13 | 1.55 | 3.52 | 787 | 2552k |
| 4 gates, CPU 4x slower | 240 | tower | 22 | 45.43 | 8.60 | 28.66 | 1150 | 3901k |
| 1 gate 60 people, CPU 4x slower | 60 | tower | 92 | 10.21 | 1.94 | 8.39 | 295 | 1011k |

No console errors or warnings.
