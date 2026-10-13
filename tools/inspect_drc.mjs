// Decode Messenger .drc files: print geometry type, attributes, metadata.
// Usage: node inspect_drc.mjs <file.drc> [...]
import fs from 'node:fs';
import draco3d from 'draco3d';

const M = await draco3d.createDecoderModule({});
const TYPES = { 0: 'POSITION', 1: 'NORMAL', 2: 'COLOR', 3: 'TEX_COORD', 4: 'GENERIC' };

function readMeta(dec, q, md) {
  const out = {};
  const n = q.NumEntries(md);
  for (let i = 0; i < n; i++) {
    const name = q.GetEntryName(md, i);
    let v = q.GetStringEntry(md, name);
    if (!v) v = q.GetIntEntry(md, name);
    out[name] = v;
  }
  return out;
}

for (const f of process.argv.slice(2)) {
  const buf = new Uint8Array(fs.readFileSync(f));
  const dec = new M.Decoder();
  const db = new M.DecoderBuffer();
  db.Init(buf, buf.length);
  const gtype = dec.GetEncodedGeometryType(db);
  const isMesh = gtype === M.TRIANGULAR_MESH;
  const geo = isMesh ? new M.Mesh() : new M.PointCloud();
  const st = isMesh ? dec.DecodeBufferToMesh(db, geo) : dec.DecodeBufferToPointCloud(db, geo);
  if (!st.ok()) { console.log(f, 'decode failed', st.error_msg()); continue; }
  const q = new M.MetadataQuerier();
  const info = { file: f.split('/').pop(), type: isMesh ? 'mesh' : 'pointcloud', points: geo.num_points(), faces: isMesh ? geo.num_faces() : 0, attrs: [] };
  try { info.meta = readMeta(dec, q, dec.GetMetadata(geo)); } catch { info.meta = {}; }
  for (let a = 0; a < geo.num_attributes(); a++) {
    const att = dec.GetAttribute(geo, a);
    let am = {};
    try { am = readMeta(dec, q, dec.GetAttributeMetadata(geo, a)); } catch {}
    info.attrs.push({ id: att.unique_id(), type: TYPES[att.attribute_type()], comps: att.num_components(), meta: am });
  }
  console.log(JSON.stringify(info));
  M.destroy(geo); M.destroy(db); M.destroy(dec);
}
