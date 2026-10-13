// crop a region of a full-res jiangnan ref: node tools_crop.mjs <ref.png> x y w h out.png [scaleWidth]
import { createRequire } from 'module';
const sharp = createRequire('/home/ran/3d_director/qingming/tools/package.json')('sharp');
const [src, x, y, w, h, out, sw] = process.argv.slice(2);
let p = sharp(src).extract({ left: +x, top: +y, width: +w, height: +h }).removeAlpha();
if (sw) p = p.resize({ width: +sw });
await p.png().toFile(out);
console.log('wrote', out);
