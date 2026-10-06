from pathlib import Path
import json,hashlib,struct
p=Path(__file__).parent
raw=(p/'actual-native-readonly-report.json').read_bytes();d=json.loads(raw)
sourcePath=Path('/tmp/mangrove-horizontal-local-plugin-20261006/source-document.json');sourceRaw=sourcePath.read_bytes();src=json.loads(sourceRaw)
config=json.loads((p/'target-config-pinned.json').read_text())
a=d['actualLocalRawFoundation'];e=d['cloudExpectedRawFoundation'];assert e==config['foundationSnapshot'];assert d['errors']==[] and a['fieldExceptions']==[] and d['inventoryVerified'] and d['snapshotComplete'];assert d['createdNodeIds']==d['mutatedNodeIds']==d['fontLoads']==[];assert d['nativeFileKey'] is None and d['pageId']=='0:1';assert d['actualOwner']==config['owner']
diffs=[]
def diff(x,y,path='$'):
 if x==y:return
 if isinstance(x,list) and isinstance(y,list) and len(x)==len(y):
  for i,(v,w) in enumerate(zip(x,y)):diff(v,w,path+'['+str(i)+']')
 elif isinstance(x,dict) and isinstance(y,dict):
  for k in dict.fromkeys([*x,*y]):
   if k not in x:diffs.append({'path':path+'.'+k,'expected':{'diagnosticFieldUndefined':True},'actual':y[k]})
   elif k not in y:diffs.append({'path':path+'.'+k,'expected':x[k],'actual':{'diagnosticFieldUndefined':True}})
   else:diff(x[k],y[k],path+'.'+k)
 else:diffs.append({'path':path,'expected':x,'actual':y})
diff(e,{k:v for k,v in a.items() if k!='fieldExceptions'});assert diffs==d['exactFieldDifferences'];assert len(diffs)==6
variables=[dict(zip(a['variableColumns'],r)) for r in a['variables']];bySource={v['sourceId']:v for v in variables};assert len(bySource)==70;sourceById={v['id']:v for v in src['variables']};sourceByName={v['name']:v for v in src['variables']};modeMap={s['id']:next(m['modeId'] for m in a['collection']['modes'] if m['name']==s['name']) for s in src['modes']};aliases=exact=f32profiles=0;numF32=[]
def f32(x):return struct.unpack('f',struct.pack('f',x))[0]
def eqSource(expected,actual,path):
 if isinstance(expected,(float,int)) and not isinstance(expected,bool):
  assert actual==expected or actual==f32(expected),(path,expected,actual)
  if actual!=expected:numF32.append({'path':path,'source':expected,'actual':actual})
 elif isinstance(expected,dict):
  for k,v in expected.items():assert k in actual,(path,k);eqSource(v,actual[k],path+'.'+k)
 elif isinstance(expected,list):
  assert len(expected)==len(actual),path
  for i,(v,w) in enumerate(zip(expected,actual)):eqSource(v,w,path+'['+str(i)+']')
 else:assert expected==actual,(path,expected,actual)
for sv in src['variables']:
 av=bySource[sv['id']];assert av['description']==sv.get('description','');assert av['name']==sv['name'] and av['type']==sv['type'];assert set(av['values'])==set(modeMap.values())
 for m,nm in modeMap.items():
  val=sv['values'][m];out=av['values'][nm]
  if isinstance(val,dict) and 'alias' in val:
   target=sourceById.get(val['alias']) or sourceByName[val['alias']];assert out=={'type':'VARIABLE_ALIAS','id':bySource[target['id']]['id']};aliases+=1
  else:
   before=len(numF32);eqSource(val,out,sv['id']+'/'+m)
   if len(numF32)>before:f32profiles+=1
   else:exact+=1
styleCounts={};notNativeStyleFields=[]
for kind in ['text','effect']:
 rows=[dict(zip(a[kind+'StyleColumns'],r)) for r in a[kind+'Styles']];by={r['sourceId']:r for r in rows};assert len(by)==len(src['styles'][kind]);styleCounts[kind]=len(by)
 for s in src['styles'][kind]:
  act=by[s['id']];assert act['name']==s['name'];assert act['description']==s.get('description','')
  if kind=='effect':
   items=s['values']['undrr'];assert len(act['effects'])==len(items);aggregate=[]
   for item,native in zip(items,act['effects']):
    eqSource(item['effect'],native,s['id']+'/effect')
    bindings={k:{'type':'VARIABLE_ALIAS','id':bySource[(sourceById.get(role) or sourceByName[role])['id']]['id']} for k,role in item.get('bindings',{}).items()};assert native['boundVariables']==bindings;aggregate.extend(bindings.values())
   assert act['boundVariables']=={'effects':aggregate};continue
  expectedBindings={k:({'type':'VARIABLE_ALIAS','id':bySource[(sourceById.get(role) or sourceByName[role])['id']]['id']}) for k,role in s.get('bindings',{}).items()};assert set(act['boundVariables'])==set(expectedBindings)
  for k,b in expectedBindings.items():
   actual=act['boundVariables'][k]
   if isinstance(actual,list):assert actual==[b]
   else:assert actual==b
  for field,value in s['values']['undrr'].items():
   if field not in act:
    assert field=='textDecorationOffset',(s['id'],field);notNativeStyleFields.append({'sourceStyleId':s['id'],'field':field,'source':value,'scope':'Own TEXT/range metadata; no native TextStyle offset getter claimed.'})
   else:eqSource(value,act[field],s['id']+'/undrr.'+field)
assert aliases==65 and exact==205 and f32profiles==80
receipt={'actualReadonlyDiagnosticAccepted':True,'rawBytes':len(raw),'rawSHA256':hashlib.sha256(raw).hexdigest(),'sourceDocumentSHA256':hashlib.sha256(sourceRaw).hexdigest(),'cloudExpectedEqualsPinnedSnapshot':True,'allRawLeafDifferencesRecomputedExactly':diffs,'allOtherCapturedCloudLocalFieldsExact':True,'sourceRoleCount':70,'sourceAllModeValueCount':350,'exactLiteralProfiles':exact,'exactFloat32Profiles':f32profiles,'exactAliasTargetUUIDProfiles':aliases,'declaredSourceStyleFieldsCompared':styleCounts,'sourceDescriptionsAll70ExactLocally':True,'sourceOwnTEXTMetadataNotAcceptedByStyleRead':notNativeStyleFields,'numericFloat32Observations':numF32,'writes':[],'fontsLoaded':[],'nativeFileKey':None,'scope':'Readonly local getter fields and source declared foundations only. Three local descriptions equal original source while cloud snapshot escaped entities; three local fontName getters omit cloud-observed wght700 variationSettings, while exact original source family/style remain unchanged. No automatic baseline adoption, axes/font-byte equivalence, applied78TEXT, component scene, geometry, render, lifecycle or publication acceptance. Desktop external CUA association remains separately supplied by root.'}
(p/'independent-actual-verdict-tag-20261006.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({k:v for k,v in receipt.items() if k not in ['numericFloat32Observations','allRawLeafDifferencesRecomputedExactly']}))
