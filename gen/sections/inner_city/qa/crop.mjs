// QA helper: crop and enlarge part of a shot. node crop.mjs <in.png> <out.png> x y w h [scale]
import { createRequire } from 'node:module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [inp, out, x, y, w, h, s = 2] = process.argv.slice(2);
await sharp(inp).extract({ left: +x, top: +y, width: +w, height: +h }).resize(Math.round(w * s)).toFile(out);
