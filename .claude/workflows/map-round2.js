export const meta = {
  name: 'map-round2',
  description: 'Map the five remaining scroll areas (S4b, S3, S2, S1, S7) at once: restyle, unit agents, merge, second pass, frames in order along the scroll, layout and needs lists',
  whenToUse: 'Mapping new scroll sections for the qingming world in parallel (the round-2 playbook); rules in qingming/gen/expand/round2/mapping_rules.md',
  phases: [
    { title: 'Setup', detail: 'area brief, restyle, tile brief, final unit list' },
    { title: 'Map', detail: 'tile, structures, river and bridge agents' },
    { title: 'Merge', detail: 'merge, cross-tile fixes, seam check, second-pass ranges' },
    { title: 'Second pass', detail: 'fresh agents propose fixes' },
    { title: 'Frame', detail: 'frames in order along the scroll, all, layout' },
    { title: 'Needs', detail: 'needs list, lessons, Run 1 report' },
  ],
}

const RULES = 'qingming/gen/expand/round2/mapping_rules.md'
const head = (a, role) =>
  `You are the ${role} agent for area ${a.S} (${a.name}, scan u ${a.x[0]}-${a.x[1]}, folder ${a.folder}) in round 2's mapping of the 清明上河图 web world (/home/ran/3d_director/qingming). ` +
  `Read ${RULES}: the section "Everyone" and the section for your role. Area brief: ${a.brief}.`

const SETUP = { type: 'object', properties: {
  restyle_ok: { type: 'boolean' }, warnings: { type: 'string' },
  units: { type: 'array', items: { type: 'object', properties: {
    id: { type: 'string' }, role: { type: 'string', enum: ['tile', 'structures', 'river', 'bridge'] },
    owns: { type: 'array', items: { type: 'number' } }, looks: { type: 'array', items: { type: 'number' } },
    focus: { type: 'string' } }, required: ['id', 'role', 'owns', 'focus'] } } },
  required: ['restyle_ok', 'warnings', 'units'] }
const UNIT = { type: 'object', properties: {
  part_file: { type: 'string' }, report_file: { type: 'string' }, check_pass: { type: 'boolean' },
  counts: { type: 'string' }, left_to: { type: 'string' }, seam_notes: { type: 'string' }, hard: { type: 'string' } },
  required: ['part_file', 'report_file', 'check_pass', 'counts'] }
const MERGE = { type: 'object', properties: {
  entities: { type: 'number' }, check_pass: { type: 'boolean' }, notes: { type: 'string' },
  second_pass: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, owns: { type: 'array', items: { type: 'number' } } }, required: ['id', 'owns'] } } },
  required: ['entities', 'check_pass', 'second_pass'] }
const SECOND = { type: 'object', properties: { proposals_file: { type: 'string' }, n_proposals: { type: 'number' }, summary: { type: 'string' } }, required: ['proposals_file', 'n_proposals'] }
const FRAME = { type: 'object', properties: {
  ok: { type: 'boolean' }, flag_for_lead: { type: 'string' }, knots: { type: 'string' }, water_H: { type: 'string' },
  west_seam: { type: 'string' }, painted_area_matches: { type: 'boolean' }, issues: { type: 'string' } },
  required: ['ok', 'knots', 'west_seam', 'issues'] }
const NEEDS = { type: 'object', properties: {
  needs_file: { type: 'string' }, report_file: { type: 'string' }, counts: { type: 'string' },
  new_characters: { type: 'number' }, summary: { type: 'string' } }, required: ['needs_file', 'report_file', 'counts', 'summary'] }

const GP = 'general-purpose'
const frameReady = {}, resolveFrame = {}
for (const a of args.areas) frameReady[a.S] = new Promise((r) => { resolveFrame[a.S] = r })

async function runArea(a) {
  let frame = null
  try {
    const setup = await agent(
      `${head(a, 'setup')}\nRestyle rect hint: ${a.rect}. Planned units (JSON): ${JSON.stringify(a.units)}\nReturn the final unit list (same shape: id, role, owns [u0,u1], looks [u0,u1], focus), with your warnings about where the restyle invents.`,
      { label: `setup ${a.S}`, phase: 'Setup', schema: SETUP, agentType: GP })
    const units = setup?.units?.length ? setup.units : a.units
    log(`${a.S}: ${units.length} units${setup?.restyle_ok === false ? ' (no restyle)' : ''}`)

    const parts = await parallel(units.map((u) => () => agent(
      `${head(a, u.role)}\nYour unit: ${u.id}, owns u ${u.owns.join('-')} by main point, looks at u ${(u.looks || [u.owns[0] - 150, u.owns[1] + 150]).join('-')}.\nFocus: ${u.focus}\nSetup's warnings about the restyle: ${setup?.warnings || 'none'}\nTile brief: gen/map/${a.S}/brief.md. Write gen/map/${a.S}/parts/${u.id}.json and gen/map/${a.S}/reports/${u.id}.md only.`,
      { label: `${a.S} ${u.id}`, phase: 'Map', schema: UNIT, agentType: GP })))
    const done = units.map((u, i) => ({ id: u.id, role: u.role, r: parts[i] }))
    const missing = done.filter((d) => !d.r).map((d) => d.id)
    if (missing.length) log(`${a.S}: units with no result: ${missing.join(', ')}`)

    const merge = await agent(
      `${head(a, 'merge')}\nThe unit agents' results (JSON): ${JSON.stringify(done)}\n${missing.length ? `These units returned nothing; check whether their part files exist and say what is missing: ${missing.join(', ')}.` : ''}`,
      { label: `merge ${a.S}`, phase: 'Merge', schema: MERGE, agentType: GP })
    const halves = merge?.second_pass?.length ? merge.second_pass : [{ id: 'all', owns: a.x }]

    const second = await parallel(halves.map((h) => () => agent(
      `${head(a, 'second pass')}\nYour range: ${h.id}, u ${h.owns.join('-')}. Merge notes: gen/map/${a.S}/merge_notes.md. Write gen/map/${a.S}/second_pass/${h.id}.json only.`,
      { label: `${a.S} 2nd ${h.id}`, phase: 'Second pass', schema: SECOND, agentType: GP })))

    let east = null
    if (a.east) {
      east = await frameReady[a.east]
      log(`${a.S}: east neighbour ${a.east}'s frame ${east?.ok ? 'is ready' : 'FAILED'}`)
    }
    frame = await agent(
      `${head(a, 'frame')}\nSecond-pass results (JSON): ${JSON.stringify(second)}\n` +
      (a.east ? `East neighbour: ${a.east} (folder ${a.eastFolder}); seam at u ${a.x[1]}. Its frame agent returned (JSON): ${JSON.stringify(east)}. If it failed, seed from its files only if map/frames/${a.east}.json and its world exist; otherwise finish everything up to the frame and return ok:false with the reason.` : `Your frame has a seed in map/frames/${a.S}.json.`),
      { label: `frame ${a.S}`, phase: 'Frame', schema: FRAME, agentType: GP })
  } catch (e) {
    log(`${a.S}: stopped: ${e}`)
  } finally {
    resolveFrame[a.S](frame || { ok: false, issues: 'the area stopped before its frame' })
  }
  const needs = await agent(
    `${head(a, 'needs')}\nThe frame agent returned (JSON): ${JSON.stringify(frame)}`,
    { label: `needs ${a.S}`, phase: 'Needs', schema: NEEDS, agentType: GP })
  return { S: a.S, frame, needs }
}

const results = await parallel(args.areas.map((a) => () => runArea(a)))
return results.filter(Boolean)
