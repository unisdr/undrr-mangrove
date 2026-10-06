import json,pathlib,hashlib,struct
b=pathlib.Path(__file__).parent;s=json.loads((b.parent/'foundation-import/source-document.json').read_text());parts=[];pins=[]
for i in range(1,7):
 f=b/f'actual-part{i}-native-tool.json';raw=f.read_bytes();assert b'// truncated' not in raw;d=json.loads(next(x['text'] for x in json.loads(raw)['content'] if x['type']=='text'));assert d['snapshotComplete'] and d['createdNodeIds']==d['mutatedNodeIds']==[];assert d['partition']['index']==i;parts.append(d);pins.append({'path':f.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
assert all(p['collection']==parts[0]['collection'] and p['owner']==parts[0]['owner'] and p['fullIdentityInventory']==parts[0]['fullIdentityInventory'] for p in parts)
rows=[dict(zip(p['variableColumns'],r)) for p in parts for r in p['variables']];assert len(rows)==70;by={r['sourceId']:r for r in rows};assert len(by)==70;source={v['id']:v for v in s['variables']};source_names={v['name']:v for v in s['variables']};assert set(by)==set(source)
mode={x['id']:y['modeId'] for x,y in zip(s['modes'],parts[0]['collection']['modes'])};assert all(x['name']==y['name'] for x,y in zip(s['modes'],parts[0]['collection']['modes']))
f32=lambda n:struct.unpack('f',struct.pack('f',n))[0];numeric=[];metadata=[];counts={'exactLiterals':0,'float32Literals':0,'aliases':0}
def number(a,z,path):
 assert isinstance(a,(int,float)) and (a==z or a==f32(z)),(path,a,z)
 if a!=z:numeric.append({'path':path,'source':z,'native':a,'exactSourceFloat32':a==f32(z)})
def literal(a,z,path):
 if isinstance(z,dict):assert set(a)==set(z),(path,a,z);[literal(a[k],v,path+'/'+k) for k,v in z.items()]
 elif isinstance(z,(int,float)):number(a,z,path)
 else:assert a==z,(path,a,z)
for id,v in source.items():
 n=by[id];assert n['type']==v['type'] and n['name']==v['name'];assert n['collectionId']==parts[0]['collection']['id'];assert set(n['values'])==set(mode.values())
 for m,mid in mode.items():
  z=v['values'][m];a=n['values'][mid]
  if isinstance(z,dict) and 'alias' in z:
   target=source.get(z['alias']) or source_names[z['alias']];assert a=={'type':'VARIABLE_ALIAS','id':by[target['id']]['id']};counts['aliases']+=1
  else:
   before=len(numeric);literal(a,z,id+'/'+m);counts['float32Literals' if len(numeric)>before else 'exactLiterals']+=1
 for k in ['description','scopes','hiddenFromPublishing','codeSyntax']:
  z=v.get(k,{'description':'','scopes':['ALL_SCOPES'],'hiddenFromPublishing':False,'codeSyntax':{}}[k]);a=n[k]
  if a!=z:
   metadata.append({'id':id,'field':k,'source':z,'native':a,'scopeSetEqual':sorted(a)==sorted(z) if k=='scopes' else None})
   if k=='scopes':assert set(a)==set(z)
texts=[dict(zip(p['textStyleColumns'],r)) for p in parts for r in p['textStyles']];effects=[dict(zip(p['effectStyleColumns'],r)) for p in parts for r in p['effectStyles']];assert len(texts)==8 and len(effects)==1
axes=[];offset_metadata=[]
for v in s['styles']['text']:
 n=next(n for n in texts if n['sourceId']==v['id']);z=v['values']['undrr'];assert n['name']==v['name'];assert n['fontName']['family']==z['fontName']['family'] and n['fontName']['style']==z['fontName']['style'];axes.append({'sourceId':v['id'],'nativeFontName':n['fontName'],'sourceFontName':z['fontName']})
 for k in ['fontSize','lineHeight','textDecoration','textWrapStyle']:
  if k in z:literal(n[k],z[k],v['id']+'/'+k)
 for k,role in v.get('bindings',{}).items():
  target=source.get(role) or source_names[role];assert n['boundVariables'][k]=={'type':'VARIABLE_ALIAS','id':by[target['id']]['id']}
 if n['description']!=v.get('description',''):metadata.append({'id':v['id'],'field':'description','source':v.get('description',''),'native':n['description']})
 if 'textDecorationOffset' in z:offset_metadata.append({'sourceId':v['id'],'sourceOffset':z['textDecorationOffset'],'scope':'Source metadata only: native TextStyle has no offset API; owning TextNode/range application remains separate'})
v=s['styles']['effect'][0];n=effects[0];assert n['sourceId']==v['id'] and n['name']==v['name'];assert len(n['effects'])==len(v['values']['undrr'])
for i,entry in enumerate(v['values']['undrr']):
 for k,z in entry['effect'].items():literal(n['effects'][i][k],z,v['id']+'/'+str(i)+'/'+k)
 for k,role in entry['bindings'].items():
  target=source.get(role) or source_names[role];assert n['effects'][i]['boundVariables'][k]=={'type':'VARIABLE_ALIAS','id':by[target['id']]['id']}
r={'acceptedValueAndDeclaredStyleFieldReadback':True,'sourceSHA256':hashlib.sha256((b.parent/'foundation-import/source-document.json').read_bytes()).hexdigest(),'files':pins,'variables':70,'modeValues':350,'counts':counts,'textStyles':8,'effectStyles':1,'sourceNumericFloat32Differences':numeric,'rawMetadataDifferences':metadata,'observedConcreteNativeFontAxes':axes,'sourceDecorationOffsetMetadataNotNativeStyleField':offset_metadata,'allSixCollectionOwnerIdentityInventoriesExact':True,'literalMetadataExact':not metadata,'sourceApplied78TextAccepted':False,'scope':'Sequential actual native foundation value/alias and declared style-field readback only. Raw Float32/storage/order/entity differences preserved, no source mutation or general tolerance. Extra native defaults/axes are observations, not font-byte/glyph proof. Applied source TEXT/rich/offset/crop/geometry/lifecycle/publication remain open.'};(b/'independent-actual-source-verdict-tag-20261006.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({'counts':counts,'numericDifferences':len(numeric),'metadataDifferences':len(metadata),'text':8,'effect':1}))
