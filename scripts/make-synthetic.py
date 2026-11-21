#!/usr/bin/env python3
"""Synthetic payload with the EXACT field names the centralmga QuoteForm posts (full 57 yn + property section). usage: make-synthetic.py <full-sample.json> <out.json>
Synthetic data only; nothing is sent anywhere."""
import json, sys
d = json.load(open(sys.argv[1])); f = d["submission_fields"]
f.update({"buildingAreaSqFt": "4200", "yn_buildingLeasedToOthers": "No",
  "_info_property_requested": "Yes", "_info_construction": "Joisted Masonry", "_info_protectionClass": "4",
  "_info_buildingValue": "650000", "_info_contentsValue": "120000", "_info_yearBuilt": "1998",
  "_info_historicalProperty": "No", "_info_openSides": "0", "_info_storeys": "2", "_info_basements": "0",
  "_info_buildingCodeGrade": "4", "_info_roofMaterial": "Metal", "_info_solidFuelHeater": "Yes",
  "_info_solidFuelHeaterInstalled": "2019-10-01", "_info_solidFuelHeaterMaker": "Test Stoves",
  "_info_burglarAlarmDescription": "Monitored panel", "_info_burglarAlarmCertificateId": "TEST-0001",
  "_info_burglarAlarmCertificateExpires": "2027-10-01", "_info_burglarAlarmCentralStation": "Yes",
  "_info_burglarAlarmWithKeys": "No", "_info_burglarAlarmInstalledBy": "Test Alarm Co",
  "_info_burglarAlarmExtent": "Full", "_info_burglarAlarmGrade": "A"})
json.dump(d, open(sys.argv[2], "w"), indent=1)
