# Details pass: progress (lead: session 3d-director-2e)

2026-10-13
- Plan: plan.md. The user: "use mathematical ways", and the screenshots are examples only, so check every figure
  and every character.
- Agents started, each with a brief file:
  - contacts: measurement only (owners geometry, joint tracks, placements dump, rules, contact_check) over all
    eight sections; brief_contacts.md;
  - eyes: eye_check over all 34 characters, then the texture fix for the FAILs; brief_eyes.md;
  - children: real child models posed by IK as the four carried-child props, plus carry_check;
    brief_children.md.
- Shared: character builds and KTX2 run under `flock /tmp/qingming_charbuild.lock`.
- Performance batch 2 (session 3d-director-04) agreed the order: our character rebuilds first, its crowd LOD and
  per-clip files on top. Deploys go through that session.
- Next, after the contacts measurement: a pilot fix on S4 (solver, object fit, IK clip variants, the missing stool),
  then one fixer per section.
- Added at the user's request: the life agent (brief_life.md). It covers chatter that starts by itself, more and
  deeper press-E talks, plot lines across scenes (inked into the 圖志 journal), and intent marks if time allows. All
  eight sections, pilot first. It owns web/src/ui/ and sections/*/talk.json; tiny engine hooks only, announced to
  3d-director-04.
