#!/usr/bin/env python3
"""Build src/data/acord-map.json: for every canonical field QuoteForm posts, which ACORD PDF widgets it fills and how.
Method: import the real mapper (map_quote_125.build, read-only, from the Mac mirror), vary ONE canonical field at a time on a
synthetic base payload, diff the mapper's payload.  Nothing is invented: the overlay shows only what the real mapper would write.
usage: probe_map.py <base.json> <rects.json> <schema.json(temp, template rewritten)> <out.json>
"""
import json, sys, os, re, io, contextlib, copy
sys.path.insert(0, os.path.expanduser("~/josh-workspace/skills/acord-forms/scripts"))
import map_quote_125 as M
base_src = json.load(open(sys.argv[1]))["submission_fields"]
rects = json.load(open(sys.argv[2])); schema = json.load(open(sys.argv[3]))
fields = json.load(open(sys.argv[5]))   # [{name, kind, values?}]

def run(d):
    with contextlib.redirect_stderr(io.StringIO()), contextlib.redirect_stdout(io.StringIO()):
        p, _u = M.build(M._legacy_fixups(M.normalize(dict(d), ""), ""), schema)
    return p
CTX = {}
def ctx_for(name):
    c = {}
    m = re.match(r"(?:ynExplain_|general_)([A-Za-z]+?)(?:__|$)", name)
    if name.startswith("ynExplain_"): c["yn_" + name[10:]] = "Yes"
    elif name.startswith("general_"):
        q = name[8:].split("__")[0]; c["yn_" + q] = "Yes"
        if q == "coverageTerminated" and name.endswith("Description"): c["general_coverageTerminated__conditionCorrected"] = "Yes"
    for pref, q in (("athletic", "athleticTeams"), ("pool", "swimmingPool"), ("rentEquipment", "rentOrLoanEquipment"),
                    ("leaseEmployees", "leaseEmployees"), ("safety", "safetyProgramsExist")):
        if name.startswith(pref) and not name.startswith("safetyViolations"): c["yn_" + q] = "Yes"
    if name == "safetyOtherText": c["safetyProgramElements"] = "Other"
    if name.startswith("loss") and name != "lossesLast3Years": c["lossesLast3Years"] = "Yes"
    if name in ("subsCarryInsurance", "workSubcontractedDescription"): c["usesSubcontractors"] = "Yes"
    if name in ("currentCarrier", "currentPolicyExpiration"): c["currentlyInsured"] = "Yes"
    if name.startswith("otherCoverageDetail_"): c["otherCoverages"] = name.split("_", 1)[1]
    return c
def diff(a, b):
    out = {"text": {}, "check": {}}
    for k in ("text", "check"):
        for f, v in b.get(k, {}).items():
            if a.get(k, {}).get(f) != v: out[k][f] = v
    return out
rules = {}
for f in fields:
    n = f["name"]; kind = f["kind"]
    b = dict(base_src); b.update(ctx_for(n)); b[n] = ""
    p0 = run(b)
    if kind == "text":
        V = f["sample"]; b2 = dict(b); b2[n] = V; p1 = run(b2); e = diff(p0, p1)
        tr = {}
        for pf, O in e["text"].items():
            iso = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", V)
            if O == V: t = {"t": "raw"}
            elif iso and O == f"{iso.group(2)}/{iso.group(3)}/{iso.group(1)}": t = {"t": "date"}
            elif V.isdigit() and O == f"${int(V):,}": t = {"t": "money"}
            elif V in O: i = O.index(V); t = {"t": "tpl", "pre": O[:i], "post": O[i + len(V):]}
            else: t = {"t": "raw", "opaque": O}
            tr[pf] = t
        if tr or e["check"]: rules[n] = {"kind": "text", "text": tr, "check": e["check"]}
    else:
        vals = {}
        for v in f["values"]:
            b2 = dict(b); b2[n] = v; e = diff(p0, run(b2))
            if e["text"] or e["check"]: vals[v] = e
        if vals: rules[n] = {"kind": "choice", "values": vals}
# composites: a text widget written from >=2 canonical fields becomes one template "{{a}}, {{b}}"; General_Remarks is derived prose, not previewed
SKIP = {"ACORD_General_Remarks"}
base_p = run(base_src)
infl = {}
for n, r in rules.items():
    if r["kind"] == "text": pfs = list(r["text"].keys())
    else: pfs = [x for e in r["values"].values() for x in e["text"].keys()]
    for pf in pfs: infl.setdefault(pf, set()).add(n)
composites = {}
for pf, names in infl.items():
    if pf in SKIP or len(names) < 2: continue
    tpl = base_p["text"].get(pf, "")
    for n in sorted(names, key=lambda x: -len(str(base_src.get(x, "")))):
        bv = str(base_src.get(n, ""))
        if bv and bv in tpl: tpl = tpl.replace(bv, "{{%s}}" % n, 1)
    composites[pf] = {"tpl": tpl, "from": sorted(names)}
# the probe cannot see multi-field templates built from fields it varies jointly or substrings of other values: pin the three by hand
composites["ACORD_Contact1_Name"] = {"tpl": "{{firstName}} {{lastName}}", "from": ["firstName", "lastName"]}
composites["ACORD_Policy_Insured1_Name"] = {"tpl": "{{businessName}}", "from": ["businessName"]}
composites["GeneralLiabilityLineOfBusiness_TypeOfWorkSubcontractedDescription_A"] = {"tpl": "{{workSubcontractedDescription}}", "from": ["workSubcontractedDescription"]}
for n, r in list(rules.items()):
    if r["kind"] == "text":
        r["text"] = {k: v for k, v in r["text"].items() if k not in composites and k not in SKIP}
        if not r["text"] and not r["check"]: del rules[n]
    else:
        for v, e in list(r["values"].items()):
            e["text"] = {k: x for k, x in e["text"].items() if k not in composites and k not in SKIP}
            if not e["text"] and not e["check"]: del r["values"][v]
        if not r["values"]: del rules[n]
# PENDING_PROPERTY: ACORD 140 fields the mapper does NOT write yet (host 2026-11-21: josh-sms adds the rules). Preview-only overlay,
# flagged "pending" so the pane can show them differently. canonical `_info_` name -> (PDF field, how the value prints)
PENDING_PROPERTY = {
  "_info_historicalProperty": ("BuildingFeatures_HistoricalPropertyIndicator_A", "yn"),
  "_info_openSides": ("Construction_OpenSidesCount_A", "raw"),
  "_info_storeys": ("Construction_StoreyCount_A", "raw"),
  "_info_basements": ("Construction_BasementCount_A", "raw"),
  "_info_buildingCodeGrade": ("Construction_BuildingCodeEffectivenessGradeCode_A", "raw"),
  "_info_roofMaterial": ("Construction_RoofMaterialCode_A", "raw"),
  "_info_solidFuelHeater": ("BuildingFeatures_SolidFuelHeaterIndicator_A", "yn"),
  "_info_solidFuelHeaterInstalled": ("BuildingFeatures_SolidFuelHeaterInstallationDate_A", "date"),
  "_info_solidFuelHeaterMaker": ("BuildingFeatures_SolidFuelHeaterManufacturerName_A", "raw"),
  "_info_burglarAlarmDescription": ("Alarm_Burglar_AlarmDescription_A", "raw"),
  "_info_burglarAlarmCertificateId": ("Alarm_Burglar_CertificateIdentifier_A", "raw"),
  "_info_burglarAlarmCertificateExpires": ("Alarm_Burglar_CertificateExpirationDate_A", "date"),
  "_info_burglarAlarmCentralStation": ("Alarm_Burglar_CentralStationIndicator_A", "yn"),
  "_info_burglarAlarmWithKeys": ("Alarm_Burglar_WithKeysIndicator_A", "yn"),
  "_info_burglarAlarmInstalledBy": ("Alarm_Burglar_InstalledAndServicedByName_A", "raw"),
  "_info_burglarAlarmExtent": ("Alarm_Burglar_ProtectionExtentCode_A", "raw"),
  "_info_burglarAlarmGrade": ("Alarm_Burglar_GradeCode_A", "raw"),
}
for n, (pf, how) in PENDING_PROPERTY.items():
    if how == "yn": rules[n] = {"kind": "choice", "pending": True, "values": {"Yes": {"text": {pf: "Y"}, "check": {}}, "No": {"text": {pf: "N"}, "check": {}}}}
    else: rules[n] = {"kind": "text", "pending": True, "text": {pf: {"t": "date" if how == "date" else "raw"}}, "check": {}}
# page/rect for every referenced widget
used = set()
for r in rules.values():
    srcs = [r["text"], r["check"]] if r["kind"] == "text" else [x for e in r["values"].values() for x in (e["text"], e["check"])]
    for s in srcs: used.update(s.keys())
used.update(composites.keys())
missing = sorted(u for u in used if u not in rects)
out = {"composites": composites, "rules": rules, "rects": {u: rects[u] for u in used if u in rects}, "missingRects": missing}
json.dump(out, open(sys.argv[4], "w"), separators=(",", ":"))
print("rules", len(rules), "pdf widgets", len(out["rects"]), "missing rects", missing)
