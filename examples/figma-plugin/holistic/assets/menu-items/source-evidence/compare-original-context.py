from pathlib import Path
import json,hashlib
p=Path(__file__).parent;old=Path('/tmp/mangrove-retained-menu-items-source-20261006');manifest=json.loads((p/'capture-manifest.json').read_text());differences=[];by_field={}
for row in manifest['cases']:
 name=row['case'];before=json.loads((old/'captures'/(name+'.json')).read_text());after=json.loads((p/'captures'/(name+'.json')).read_text())
 for i,owner in enumerate(['default','selected']):
  a,b=before['anchors'][i],after['anchors'][i]
  for key in a:
   if a[key]!=b.get(key):
    differences.append({'case':name,'owner':owner,'field':key,'before':a[key],'after':b.get(key)})
    by_field[key]=by_field.get(key,0)+1
result={'scope':'Whole original controlled anchor fields versus matching preview-context controlled anchor fields; exact differences retained, no normalization or native acceptance','cases':len(manifest['cases']),'owners':len(manifest['cases'])*2,'differences':differences,'fieldCounts':by_field,'originalSourceUntouched':True,'nativeAccepted':False}
(p/'original-vs-preview-context-fields.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'cases':result['cases'],'owners':result['owners'],'fieldCounts':by_field}))
