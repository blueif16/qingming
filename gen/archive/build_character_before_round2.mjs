// Merge a Meshy rigged character with the clips from its animation GLBs into one GLB.
// Clips are matched to the character's bones by node name (all Meshy rigs share bone names).
// Usage: node build_character.mjs <out.glb> <rigged.glb> <clipName>=<anim.glb> [<clipName>=<anim.glb> ...]
import { NodeIO } from '@gltf-transform/core';
import { prune } from '@gltf-transform/functions';

const [out, riggedFile, ...clipArgs] = process.argv.slice(2);
const io = new NodeIO();
const doc = await io.read(riggedFile);
const root = doc.getRoot();
const buffer = root.listBuffers()[0];
const byName = new Map(root.listNodes().map((n) => [n.getName(), n]));

// drop whatever clips came with the rigged file; we add named ones below
root.listAnimations().forEach((a) => a.dispose());

for (const arg of clipArgs) {
  const [clipName, file] = arg.split('=');
  const src = await io.read(file);
  const srcAnims = src.getRoot().listAnimations();
  if (!srcAnims.length) throw new Error(`${file}: no animations`);
  const anim = doc.createAnimation(clipName);
  let channels = 0, missing = new Set();
  for (const ch of srcAnims[0].listChannels()) {
    const target = byName.get(ch.getTargetNode()?.getName());
    if (!target) { missing.add(ch.getTargetNode()?.getName()); continue; }
    const s = ch.getSampler();
    const copy = (acc) => doc.createAccessor().setType(acc.getType()).setArray(acc.getArray().slice()).setBuffer(buffer);
    const sampler = doc.createAnimationSampler().setInput(copy(s.getInput())).setOutput(copy(s.getOutput()))
      .setInterpolation(s.getInterpolation());
    anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(target)
      .setTargetPath(ch.getTargetPath()).setSampler(sampler));
    channels++;
  }
  const dur = Math.max(...anim.listSamplers().map((s) => s.getInput().getMax([])[0]));
  console.log(`clip ${clipName}: ${channels} channels, ${dur.toFixed(2)} s${missing.size ? `, unmatched: ${[...missing]}` : ''}`);
}
await doc.transform(prune());
await io.write(out, doc);
console.log('wrote', out);
