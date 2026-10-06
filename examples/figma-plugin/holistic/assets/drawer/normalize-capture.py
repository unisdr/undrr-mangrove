import pathlib,json,hashlib,shutil
root=pathlib.Path('/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove');out=root/'examples/figma-plugin/holistic/assets/drawer';raw=pathlib.Path('/tmp/mangrove-drawer-source-20261006');styles=[];index={};captures=[]
def intern(style):
 key=json.dumps(style,sort_keys=True)
 if key not in index:index[key]=len(styles);styles.append(style)
 return index[key]
for f in sorted(raw.glob('*.json')):
 j=json.loads(f.read_text());original=json.loads(f.read_text())
 for n in j['nodes']:
  for k in ['style','before','after']:n[k]=intern(n[k])
 if j['backdrop']:j['backdrop']['style']=intern(j['backdrop']['style'])
 j['bodyStyle']=intern(j['bodyStyle']);restored=json.loads(json.dumps(j))
 for n in restored['nodes']:
  for k in ['style','before','after']:n[k]=styles[n[k]]
 if restored['backdrop']:restored['backdrop']['style']=styles[restored['backdrop']['style']]
 restored['bodyStyle']=styles[restored['bodyStyle']];assert restored==original
 assert (json.dumps(restored,indent=2)+'\n').encode()==f.read_bytes()
 captures.append({'file':f.name,'rawSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'capture':j})
(out/'source-footprints.json').write_text(json.dumps({'scope':'Actual source200:100 drawable and100 initial/restored closed references. Exact computed-style dictionaries interned losslessly; raw source preserved external.','styles':styles,'captures':captures},indent=2)+'\n')
shutil.copy('/tmp/mangrove-drawer-capture-20261006.py',out/'capture-driver.py');shutil.copy(__file__,out/'normalize-capture.py');print(len(captures),len(styles))
