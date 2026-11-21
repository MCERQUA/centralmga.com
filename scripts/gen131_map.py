#!/usr/bin/env python3
"""Build src/data/acord131-map.json for the /acord-131 overlay from the REAL template and the REAL mapper (map_acord131.py).
Usage (python 3.9, NO -I):  python3 scripts/gen131_map.py <out.json>
rects: PDF field name -> [{page, rect[x0,y0,x1,y1] pt}]; names: every cell the mapper places BY POSITION (names lie on this template), resolved through the mapper's own at()."""
import json, sys, os
sys.path.insert(0, os.path.expanduser('~/josh-workspace/skills/acord-forms/scripts'))
import map_acord131 as M
rects = {}
for pi, pg in enumerate(M.R.pages, 1):
    for a in pg.get("/Annots", []) or []:
        a = a.get_object()
        if a.get("/Subtype") != "/Widget": continue
        n = a.get("/T") or a["/Parent"].get_object().get("/T")
        rc = [round(float(x), 2) for x in a["/Rect"]]
        rc = [min(rc[0], rc[2]), min(rc[1], rc[3]), max(rc[0], rc[2]), max(rc[1], rc[3])]
        rects.setdefault(str(n), []).append({"page": pi, "rect": rc})
N = {
  "single": {k: v[1] for k, v in M.SINGLE.items() if v},
  "q2": {lab: M.at(2, x, y) for lab, (x, y) in M.Q2.items()},
  "k20": M.at(2, 563, 665),
  "tailYes": M.at(1, 425, 252), "tailNo": M.at(1, 562, 252),
}
json.dump({"rects": rects, "names": N}, open(sys.argv[1], "w"), separators=(",", ":"))
print(len(rects), "names;", len(N["single"]), "single,", len(N["q2"]), "q2 cells")
