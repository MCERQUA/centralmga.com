#!/usr/bin/env python3
"""Build src/data/acord130-map.json for the /acord-130 overlay, from the REAL template and the REAL mapper tables.
Usage (python 3.9, NO -I):  python3 scripts/gen130_map.py <acord-130 template.pdf> <out.json>
rects: leaf tail (name after F[0].P<n>[0].) -> [{page, rect[x0,y0,x1,y1] pt}]   yn/expl: site key -> leaf tail (via map_acord130.find, same fuzzy match as the mapper)"""
import json, sys, re
from pypdf import PdfReader
sys.path.insert(0, __import__('os').path.expanduser('~/josh-workspace/skills/acord-forms/scripts'))
import map_acord130 as M
tpl, out = sys.argv[1], sys.argv[2]
r = PdfReader(tpl); rects = {}
for pi, pg in enumerate(r.pages, 1):
    for a in pg.get("/Annots", []) or []:
        a = a.get_object()
        if a.get("/Subtype") != "/Widget": continue
        n = a.get("/T")
        if n is None: continue
        rc = [round(float(x), 2) for x in a["/Rect"]]
        rc = [min(rc[0], rc[2]), min(rc[1], rc[3]), max(rc[0], rc[2]), max(rc[1], rc[3])]
        rects.setdefault(str(n), []).append({"page": pi, "rect": rc})
yn, ex = {}, {}
for k, qp in M.SITE_Q.items():
    full = next((q for q in list(M.yn) if q.startswith(qp)), None)
    if full: yn[k] = M.yn[full][0]
    fe = next((q for q in list(M.expl) if full and (q == full or q.startswith(qp))), None)
    if not fe: fe = next((q for q in M.expl if q.startswith(qp)), None)
    if fe: ex[k] = M.expl[fe].split('.')[-1]
json.dump({"rects": rects, "yn": yn, "expl": ex}, open(out, "w"), separators=(",", ":"))
print(len(rects), "leaves;", len(yn), "yn keys;", len(ex), "expl keys")
