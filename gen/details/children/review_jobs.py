# Writes the char_props.py review_many job list for the carried children, before or after:
#   python3 gen/details/children/review_jobs.py before|after > jobs.json
# before: the shipped GLBs saved before the rebuild (before/chars), after: web/public/assets/chars.
import json, subprocess, sys
Q = '/home/ran/3d_director/qingming'
which = sys.argv[1]
unc = lambda p: subprocess.check_output(['wslpath', '-w', p]).decode().strip()
CASES = [  # prop, carrier GLB, clip (before, after), times
    ('child_on_back', 'idler', ('carry_child', 'carry_child'), [0.5, 2.0, 3.5, 5.0]),
    ('child_on_shoulders', 'townsman', ('carry_child', 'carry_child~child'), [1.0, 3.0, 5.0, 7.0]),
    ('child_in_arms', 'woman', ('hold_child', 'hold_child~child'), [0.0, 2.5, 5.0, 7.0]),
    ('child_on_lap', 'woman_pale', ('sit_hold_child', 'sit_hold_child'), [0.5, 2.0, 4.0, 6.5]),
]
BEFORE = {'idler': 'idler_0201'}
jobs = []
for prop, ch, clips, times in CASES:
    clip = clips[0] if which == 'before' else clips[1]
    glb = f'{Q}/gen/details/children/before/chars/{BEFORE.get(ch, ch)}.glb' if which == 'before' else f'{Q}/web/public/assets/chars/{ch}.glb'
    # the whole figure from the left, front three-quarter and back three-quarter; then a close look at the child
    jobs.append({'glb': unc(glb), 'out': unc(f'{Q}/gen/details/children/review_{which}_{prop}.png'), 'clip': clip, 'prop': prop,
                 'times': times, 'views': [[90, 6], [35, 12], [150, 10]]})
    jobs.append({'glb': unc(glb), 'out': unc(f'{Q}/gen/details/children/review_{which}_{prop}_close.png'), 'clip': clip, 'prop': prop,
                 'times': times[:2], 'views': [[60, 8], [-30, 8], [160, 12]], 'dist': 2.0, 'z': 1.15})
print(json.dumps(jobs, indent=1))
