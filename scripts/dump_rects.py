#!/usr/bin/env python3
"""Dump every widget of the ACORD 125/126/140 template: fieldName -> {page(1-based), rect[x0,y0,x1,y1] in PDF pt, ft, states}."""
import json, sys
from pypdf import PdfReader
r = PdfReader(sys.argv[1]); out = {}
for pi, pg in enumerate(r.pages, 1):
    for a in pg.get("/Annots", []) or []:
        a = a.get_object()
        if a.get("/Subtype") != "/Widget": continue
        n = a.get("/T"); p = a.get("/Parent"); ft = a.get("/FT")
        while n is not None and p is not None and "/T" in p.get_object():
            n = f"{p.get_object()['/T']}.{n}"; ft = ft or p.get_object().get("/FT"); p = p.get_object().get("/Parent")
        if p is not None and n is None: n = p.get_object().get("/T"); ft = ft or p.get_object().get("/FT")
        if not n: continue
        st = []
        ap = a.get("/AP")
        if ap and "/N" in ap and hasattr(ap["/N"], "keys"): st = [k for k in ap["/N"].keys() if k != "/Off"]
        rect = [round(float(x), 2) for x in a["/Rect"]]
        rect = [min(rect[0], rect[2]), min(rect[1], rect[3]), max(rect[0], rect[2]), max(rect[1], rect[3])]
        out.setdefault(str(n), []).append({"page": pi, "rect": rect, "ft": str(ft), "states": st})
json.dump(out, open(sys.argv[2], "w"), separators=(",", ":"))
print(len(out), "fields,", sum(len(v) for v in out.values()), "widgets; pages", r.pages.__len__(), "size", r.pages[0].mediabox)
