from pathlib import Path
import json,hashlib,gzip,tarfile,base64,math,collections
P=Path(__file__).parent
sha=lambda b:hashlib.sha256(b).hexdigest();manifest=json.load(open(P/'capture-archive-manifest.json'));rows=collections.defaultdict(list)
for e in manifest['entries']:rows[e['archive']].append(e)
rawData={};pngs=0
for archive,entries in rows.items():
 data=(P/archive).read_bytes();pin=manifest['archives'][archive];assert len(data)==pin['bytes'] and sha(data)==pin['sha256'];expected={e['entry']:e for e in entries};seen=set()
 with tarfile.open(P/archive,'r:gz') as tar:
  for t in tar:
   assert t.isfile() and t.name in expected and t.name not in seen and not t.name.startswith('/') and '..' not in Path(t.name).parts;seen.add(t.name);body=tar.extractfile(t).read();e=expected[t.name];assert len(body)==e['bytes'] and sha(body)==e['sha256']
   if archive=='raw-source-captures.tar.gz':rawData[e['originalPath']]=body
   else:pngs+=1
 assert seen==set(expected)
assert len(rawData)==300
proof=json.loads(gzip.decompress((P/'source-owner-blueprint.json.gz').read_bytes()));source=json.loads(gzip.decompress((P/'profiles.json.gz').read_bytes()));profiles=[];pins={};urls=set()
fields=['display','direction','text-align','font-family','font-size','font-weight','line-height','color','background-color','background-image','box-shadow','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','overflow-x','overflow-y','opacity','mix-blend-mode','transform','object-fit','object-position','padding-top','padding-right','padding-bottom','padding-left','outline-style','outline-color','outline-width','outline-offset','content','position','z-index']
def shape(n):
 r={k:n['rect'][k] for k in ['x','y','width','height']};assert all(math.isfinite(v) for v in r.values());return {'tag':n['tag'],'attributes':n['attrs'],'characters':n['text'],'rect':r,'clientRects':n['clientRects'],'style':{k:n['style'].get(k) for k in fields},'before':{k:n['before'].get(k) for k in fields},'after':{k:n['after'].get(k) for k in fields},'children':[shape(c) for c in n['children']]}
for g in proof['profiles']:
 modes={}
 for mode,c in g['modes'].items():
  data=rawData[c['sourceFile']];assert sha(data)==c['sourceFileSHA256'];pins[c['sourceFile']]={'bytes':len(data),'sha256':sha(data)};raw=json.loads(data)
  if c['sourceSnapshot']=='idle':snapshot=raw['idle']
  else:
   matches=[s[c['sourceSnapshot']] for s in raw['states'] if s['ownerIndex']==c['sourceOwnerIndex'] and c['sourceSnapshot'] in s];assert len(matches)==1;snapshot=matches[0]
  owner=snapshot['owners'][c['sourceOwnerIndex']];assert owner['index']==c['sourceOwnerIndex'];assert snapshot['language']==c['language'];image=owner['image'];
  if image:urls.add(image['currentSrc'])
  modes[mode]={'tree':shape(owner['tree']),'language':c['language'],'image':image,'logicalTextOwners':c['logicalSourceTextOwners'],'linked':owner['linked'],'hover':owner['hover'],'focusVisible':owner['focusVisible']}
 profiles.append({k:v for k,v in g.items() if k!='modes'}|{'modes':modes})
media=json.load(open(P/'media-body-provenance.json'));byURL={a['url']:a for a in media['assets']};assets={}
for url in sorted(urls):
 e=byURL[url];data=(P/e['file']).read_bytes();m=e['metadata'];assert len(data)==m['bytes'] and sha(data)==m['sha256'];assets[url]={'assetId':m['assetId'],'base64':base64.b64encode(data).decode(),'sha256':m['sha256'],'bytes':m['bytes'],'mimeType':m['mimeType'],'sourceURL':m['sourceURL'],'sourceResponse':m['sourceResponse'],'licence':m['licence']}
rebuilt={'contractGroups':1,'sourcePresetCount':216,'sourceContexts':300,'sourceOwnerStates':1080,'sourceRasterAccepted':False,'nativeAccepted':False,'rawPins':pins,'assets':assets,'harPin':media['historicalDerivationHAR'],'profiles':profiles};encoded=(json.dumps(rebuilt,ensure_ascii=False,separators=(',',':'))+'\n').encode();assert encoded==gzip.decompress((P/'profiles.json.gz').read_bytes())
print(json.dumps({'rawByteRoundtrips':300,'originalPNGByteRoundtrips':pngs,'rederivedWholeProfilesByteExact':True,'profilesSHA256':sha(encoded),'noArchiveWrites':True,'nativeAccepted':False}))
