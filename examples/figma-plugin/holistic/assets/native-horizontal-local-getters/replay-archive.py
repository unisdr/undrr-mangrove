#!/usr/bin/env python3
"""Verify preserved raw evidence without Figma calls or archive writes."""
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def read(name):
    return json.loads((ROOT / name).read_text())


def digest(data):
    return hashlib.sha256(data).hexdigest()


def diff(expected, actual, path="$", out=None):
    out = [] if out is None else out
    if expected == actual:
        return out
    if isinstance(expected, list) and isinstance(actual, list) and len(expected) == len(actual):
        for i, (left, right) in enumerate(zip(expected, actual)):
            diff(left, right, f"{path}[{i}]", out)
    elif isinstance(expected, dict) and isinstance(actual, dict):
        for key in dict.fromkeys([*expected, *actual]):
            missing = {"diagnosticFieldUndefined": True}
            if key not in expected or key not in actual:
                out.append({"path": path + "." + key, "expected": expected.get(key, missing), "actual": actual.get(key, missing)})
            else:
                diff(expected[key], actual[key], path + "." + key, out)
    else:
        out.append({"path": path, "expected": expected, "actual": actual})
    return out


manifest = read("provenance.json")
for pin in manifest["files"]:
    name = Path(pin["path"])
    assert not name.is_absolute() and ".." not in name.parts
    data = (ROOT / name).read_bytes()
    assert len(data) == pin["bytes"] and digest(data) == pin["sha256"], name

source_bytes = (ROOT / manifest["sourceDocument"]).read_bytes()
assert digest(source_bytes) == manifest["sourceDocumentSHA256"]
source = json.loads(source_bytes)
report = read("readonly/actual-native-readonly-report.json")
assert report["readonly"] and report["inventoryVerified"] and report["snapshotComplete"]
assert report["errors"] == report["fontLoads"] == report["createdNodeIds"] == report["mutatedNodeIds"] == []
assert report["nativeFileKey"] is None and report["pageId"] == "0:1"
actual = copy.deepcopy(report["actualLocalRawFoundation"])
assert actual.pop("fieldExceptions") == []
expected = report["cloudExpectedRawFoundation"]
assert len(actual["variables"]) == 70 and len(actual["textStyles"]) == 8 and len(actual["effectStyles"]) == 1
assert sum(len(v[6]) for v in actual["variables"]) == 350
differences = diff(expected, actual)
assert differences == report["exactFieldDifferences"] and len(differences) == 6
assert [x["path"] for x in differences] == [
    "$.variables[5][8]", "$.variables[33][8]", "$.variables[34][8]",
    "$.textStyles[4][4].variationSettings", "$.textStyles[5][4].variationSettings",
    "$.textStyles[7][4].variationSettings",
]
source_variables = {v["id"]: v for v in source["variables"]}
for i in [5, 33, 34]:
    row = actual["variables"][i]
    assert row[8] == source_variables[row[5]]["description"]
for i in [4, 5, 7]:
    assert expected["textStyles"][i][4]["variationSettings"] == {"wght": 700}
    assert "variationSettings" not in actual["textStyles"][i][4]

config = read("first-production-attempt/target-config.json")
assert config["configured"] and config["foundationSnapshot"] == expected
configuration = read("first-production-attempt/configuration-receipt.json")
for pin in configuration["files"]:
    data = (ROOT / "first-production-attempt" / pin["path"]).read_bytes()
    assert len(data) == pin["bytes"] and digest(data) == pin["sha256"]
code = (ROOT / "first-production-attempt/code.js").read_text()
assert "Raw native foundation fields changed" in code
refusal = read("first-production-attempt/actual-first-refusal-report.json")
assert refusal["productionResult"] is None
assert refusal["boundary"]["errors"][0] == "Error: Raw native foundation fields changed"
for field in ["attemptedAssetIds", "createdAssetRootIds", "imageAttempts", "imageHashes", "fonts"]:
    assert refusal["boundary"][field] == []
assert refusal["boundary"]["inventoryBefore"] is None and refusal["boundary"]["inventoryAfter"] is None
association = read("readonly/root-desktop-association-20261006.json")
assert association["before"]["actualURL"] == association["after"]["actualURL"]
assert manifest["fileKey"] in association["before"]["actualURL"]
assert association["nativeFileKey"] is None and association["before"]["syncWarningPresent"]
print(json.dumps({"pinsVerified": len(manifest["files"]), "rawDifferencesReproduced": len(differences), "sourceDescriptionsExactLocally": 3, "nativeComponentAcceptance": False}))
