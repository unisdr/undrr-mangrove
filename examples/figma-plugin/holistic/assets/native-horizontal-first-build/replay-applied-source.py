import json,pathlib,struct,hashlib,gzip,sys
P=pathlib.Path(__file__).parent
def restored(name):return gzip.decompress((P/(name+'.gz')).read_bytes())
def archived(name):return json.loads(restored(name))
rawBytes=restored('actual-native-full374-report.json');r=json.loads(rawBytes);doc=archived('source-document.json');anatomy=archived('source-anatomy-contract.json')['nodes'];nodes={n['id']:n for n in r['nodes']};discovery={x['key']:x['matchingOutsideInstanceNodeIds'] for x in r['sourceAnatomyDiscovery']};sourcevars={v['name']:v for v in doc['variables']};byid={v['id']:v for v in doc['variables']};styles={s['id']:s for s in doc['styles']['text']};fc=r['foundationBefore'];vcols=fc['variableColumns'];sc=fc['textStyleColumns'];ec=fc['effectStyleColumns'];nvars={row[vcols.index('sourceId')]:dict(zip(vcols,row)) for row in fc['variables']};nstyles={row[sc.index('sourceId')]:dict(zip(sc,row)) for row in fc['textStyles']};effects={row[ec.index('sourceId')]:dict(zip(ec,row)) for row in fc['effectStyles']};issues=[];checks=[];opens=[];parentKeys={};
for a in anatomy:
 for c in a['source'].get('children',[]):parentKeys[a['key']+'/'+c['id']]=a['key']
def f32(x):return struct.unpack('f',struct.pack('f',x))[0]
def exact(a,b):
 if isinstance(a,(int,float)) and not isinstance(a,bool) and isinstance(b,(int,float)) and not isinstance(b,bool):return b==a or b==f32(a)
 if isinstance(a,dict) and isinstance(b,dict):return a.keys()==b.keys() and all(exact(a[k],b[k]) for k in a)
 if isinstance(a,list) and isinstance(b,list):return len(a)==len(b) and all(exact(x,y) for x,y in zip(a,b))
 return a==b
def role(name):
 v=sourcevars[name];value=v['values'][r['brand']]
 if isinstance(value,dict) and value.get('alias'):return role(value['alias'])
 if isinstance(value,dict) and value.get('type')=='VARIABLE_ALIAS':return role(value['id'])
 return value
def nativeRole(name):return nvars[sourcevars[name]['id']]['id']
def check(key,id,field,want,got):
 okay=exact(want,got);checks.append({'key':key,'nativeNodeId':id,'field':field,'accepted':okay})
 if not okay:issues.append({'key':key,'nativeNodeId':id,'field':field,'sourceExpected':want,'nativeActual':got})
def aliasCheck(key,n,field,want,got):
 target=nativeRole(want);entries=got if isinstance(got,list) else [got];okay=bool(entries) and all(isinstance(x,dict) and x.get('type')=='VARIABLE_ALIAS' and x.get('id')==target for x in entries);checks.append({'key':key,'nativeNodeId':n['id'],'field':field,'accepted':okay})
 if not okay:issues.append({'key':key,'nativeNodeId':n['id'],'field':field,'sourceRole':want,'expectedNativeAliasId':target,'nativeActual':got})
def paintCheck(key,n,field,want,paint):
 val=role(want);check(key,n['id'],field+'.color',{k:val[k] for k in ['r','g','b']},paint.get('color'));check(key,n['id'],field+'.opacity',val.get('a',1),paint.get('opacity',1));aliasCheck(key,n,field+'.alias',want,paint.get('boundVariables',{}).get('color'))
def textStyleCheck(key,n,styleId,t,segment=None):
 s=styles[styleId];value=s['values'][r['brand']];bindings=s.get('bindings',{});check(key,n['id'],'fontName.family',role(bindings['fontFamily']) if 'fontFamily'in bindings else value['fontName']['family'],t['fontName'].get('family'));check(key,n['id'],'fontName.style',value['fontName']['style'],t['fontName'].get('style'));check(key,n['id'],'fontSize',role(bindings['fontSize']) if 'fontSize'in bindings else value['fontSize'],t['fontSize']);
 for f in ['lineHeight','letterSpacing','paragraphSpacing','paragraphIndent','textCase']:
  if f in value:check(key,n['id'],f,value[f],t.get(f))
 if segment is None:
  for f,want in bindings.items():aliasCheck(key,n,'TEXT.boundVariables.'+f,want,n['fields']['boundVariables'].get(f))
for item in anatomy:
 key,s=item['key'],item['source'];ids=discovery.get(key,[]);check(key,None,'exact managed master occurrence',1,len(ids))
 if len(ids)!=1:continue
 n=nodes[ids[0]];f=n['fields'];typ=s['type'];expect='COMPONENT' if '/variant/'in key and key.count('/')==3 else 'FRAME' if typ in ['FRAME','SVG'] else typ;check(key,n['id'],'type',expect,n['type'])
 if key in parentKeys:check(key,n['id'],'source parent managed key',parentKeys[key],nodes.get(n['parentId'],{}).get('sharedPluginData',{}).get('mgKitId'))
 l=s['layout']
 for dim in ['width','height','minWidth','maxWidth','minHeight','maxHeight']:
  value=l.get(dim)
  if value is None:continue
  if value in ['HUG','FILL'] if isinstance(value,str) else False:
   sizing='layoutSizingHorizontal' if dim=='width' else 'layoutSizingVertical';check(key,n['id'],sizing,value,f.get(sizing));
   if value=='FILL' and f.get(dim)==0:issues.append({'key':key,'nativeNodeId':n['id'],'field':dim,'sourceExpected':'FILL within nonzero actual owning container','nativeActual':0,'actualParentId':n['parentId'],'actualParentWidth':nodes[n['parentId']]['fields']['width']})
  else:check(key,n['id'],dim,role(value) if isinstance(value,str) else value,f.get(dim))
 for src,dest in [('mode','layoutMode'),('gap','itemSpacing'),('clipsContent','clipsContent'),('justify','primaryAxisAlignItems'),('align','counterAxisAlignItems')]:
  if src in l:check(key,n['id'],dest,role(l[src]) if src=='gap' and isinstance(l[src],str) else l[src],f.get(dest))
 for field,want in s.get('bindings',{}).items():
  if field=='opacity':check(key,n['id'],field,role(want)/100,f.get(field))
  else:check(key,n['id'],field,role(want),f.get(field))

  distributed={'cornerRadius':['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius'],'strokeWeight':['strokeTopWeight','strokeBottomWeight','strokeLeftWeight','strokeRightWeight']}.get(field,[field])
  for nativeField in distributed:aliasCheck(key,n,'boundVariables.'+nativeField,want,f.get('boundVariables',{}).get(nativeField))
 for src,dest in [('fill','fills'),('stroke','strokes')]:
  if src not in s or typ=='INSTANCE':continue
  want=s[src];paints=f.get(dest)
  if want is None:
   if 'image' not in s:check(key,n['id'],dest,[],paints)
  elif isinstance(want,str):
   if isinstance(paints,list) and len(paints)==1:paintCheck(key,n,dest,want,paints[0])
   else:issues.append({'key':key,'nativeNodeId':n['id'],'field':dest,'sourceRole':want,'nativeActual':paints})
 if 'position'in s:
  for axis,val in s['position'].items():check(key,n['id'],'position.'+axis,role(val) if isinstance(val,str) else val,f[axis])
 if 'image'in s:
  check(key,n['id'],'imageHash','9f20bf668fa11737ad9d5cc9ed847e6414c18060',f['fills'][0].get('imageHash'));opens.append({'key':key,'gate':'full source crop/aspect/render not accepted by hash alone'})
 if 'effectStyle'in s:
  es=effects[s['effectStyle']];check(key,n['id'],'effectStyleId',es['id'],f['effectStyleId']);expected=next(x for x in doc['styles']['effect'] if x['id']==s['effectStyle'])['values'][r['brand']]
  for i,entry in enumerate(expected):
   e=entry.get('effect',entry)
   if entry.get('bindings',{}).get('color'):
    colorRole=entry['bindings']['color'];color=role(colorRole);check(key,n['id'],'effects.'+str(i)+'.color',color,f['effects'][i].get('color'));aliasCheck(key,n,'effects.'+str(i)+'.color.alias',colorRole,f['effects'][i].get('boundVariables',{}).get('color'))
   for attr in ['type','visible','blendMode','radius','spread','offset','showShadowBehindNode']:
    if attr in e:check(key,n['id'],'effects.'+str(i)+'.'+attr,e[attr],f['effects'][i].get(attr))
 if 'strokesIncludedInLayout'in s:check(key,n['id'],'strokesIncludedInLayout',s['strokesIncludedInLayout'],f['strokesIncludedInLayout'])
 if 'focusRing'in s:
  ring=s['focusRing'];offset=role(ring['offset']);width=role(ring['width'])
  for kind,paintRole,radiusRole,strokeRole in [('outer',ring['color'],ring['outerRadius'],ring['width']),('separator',ring['separatorColor'],ring['radius'],ring['offset'])]:
   targets=[row for row in r['nodes'] if row['parentId']==n['id'] and row['sharedPluginData'].get('mgKitId')==key+'/focus/'+kind];check(key,n['id'],'focus.'+kind+'.unique',1,len(targets))
   if len(targets)==1:
    sub=targets[0];sf=sub['fields'];amount=offset if kind=='outer' else 0
    for attr,expected in [('x',-amount),('y',-amount),('width',f['width']+2*amount),('height',f['height']+2*amount),('cornerRadius',role(radiusRole)),('strokeWeight',role(strokeRole)),('strokeAlign','OUTSIDE'),('layoutPositioning','ABSOLUTE'),('fills',[])]:check(key,sub['id'],'focus.'+kind+'.'+attr,expected,sf[attr])
    paintCheck(key,sub,'focus.'+kind+'.strokes',paintRole,sf['strokes'][0])
    for rad in ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']:aliasCheck(key,sub,'focus.'+kind+'.'+rad,radiusRole,sf['boundVariables'].get(rad))
 if 'svg'in s:
  paint=s['svg'].get('monochrome',{}).get('fills');desc=[];todo=list(n['children'] or [])
  while todo:
   sub=nodes[todo.pop()];todo.extend(sub['children'] or [])
   if sub['type']=='VECTOR':desc.append(sub)
  for sub in desc:
   for p in sub['fields']['fills']:paintCheck(key,sub,'SVG.vector.fills',paint,p)
  opens.append({'key':key,'gate':'Original polygon/viewBox plus native full vector paths/transforms retained; contour/raster equivalence requires separate exact comparison'})
 if typ=='TEXT':
  t=n['text'];check(key,n['id'],'characters',s['characters'],t['characters']);
  if 'textWrap'in s:check(key,n['id'],'textWrapStyle',s['textWrap'],t['textWrapStyle'])
  if 'textDecorationOffset'in s:check(key,n['id'],'textDecorationOffset',s['textDecorationOffset'],t['textDecorationOffset'])
  if 'textStyle'in s:textStyleCheck(key,n,s['textStyle'],t)
  if 'textRuns'in s:
   cursor=0;segments=t['segments'];check(key,n['id'],'rich range count',len(s['textRuns']),len(segments));
   for expectedRun,seg in zip(s['textRuns'],segments):
    rk=key+'#'+expectedRun['id'];check(rk,n['id'],'range.start',expectedRun['start'],seg['start']);check(rk,n['id'],'range.end',expectedRun['end'],seg['end']);check(rk,n['id'],'range.characters',s['characters'][expectedRun['start']:expectedRun['end']],seg['characters']);check(rk,n['id'],'range.textStyleId',nstyles[expectedRun['textStyle']]['id'],seg['textStyleId']);check(rk,n['id'],'range.decoration',expectedRun.get('textDecoration','NONE'),seg['textDecoration']);check(rk,n['id'],'range.hyperlink',expectedRun.get('hyperlink'),seg['hyperlink']);textStyleCheck(rk,n,expectedRun['textStyle'],seg,True);check(rk,n['id'],'range.paint.count',1,len(seg['fills']));paintCheck(rk,n,'range.fills',expectedRun['fill'],seg['fills'][0]);
    if expectedRun.get('textDecoration')=='UNDERLINE':check(rk,n['id'],'range.offset',expectedRun.get('textDecorationOffset',{'unit':'AUTO'}),seg['textDecorationOffset']);check(rk,n['id'],'range.thickness',expectedRun.get('textDecorationThickness',{'unit':'AUTO'}),seg['textDecorationThickness'])
 if typ=='INSTANCE':
  link=r['mainLinks'][n['id']];famil=next(x for x in doc['components']['families'] if x['id']==s['family']);variants=[v for v in famil['variants'] if all(v['properties'].get(k)==v2 for k,v2 in s['variant'].items())];check(key,n['id'],'INSTANCE source selector unique',1,len(variants));check(key,n['id'],'INSTANCE genuine main key','family/'+s['family']+'/variant/'+variants[0]['id'],link['mainManagedKey'])
  for prop,val in s.get('overrides',{}).items():matches=[entry.get('value') for p,entry in n['componentProperties'].items() if p.split('#')[0]==prop];check(key,n['id'],'INSTANCE override '+prop,[val],matches)
result={'actualReportSHA256':hashlib.sha256(rawBytes).hexdigest(),'sourceSHA256':r['sourceSHA256'],'nativeSourceAccepted':False,'sourceAnatomyRecords':len(anatomy),'sourcePlainStyleDecorationSubgate':archived('actual-plain-source-subgate.json')['passed'],'checks':len(checks),'mismatches':issues,'passedChecks':sum(c['accepted'] for c in checks),'openGates':opens,'scope':'Every authored master anatomy field covered where supported by current snapshot projection. Complete master plain style/decoration and rich run/font/paint/link subgates, typed parent/selector/instance and allocation/binding evidence. Full pixel geometry/axes/font bytes, SVG vector transform/source focus pseudo paint and edit/repeat remain separate; all mismatches preserved.'};assert result==archived('actual-applied-source-audit.json'),'Portable source audit differs from original';print(json.dumps(result,indent=2))
