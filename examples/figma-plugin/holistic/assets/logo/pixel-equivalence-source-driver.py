import pathlib,json,subprocess,base64,hashlib,urllib.parse
from PIL import Image,ImageChops
p=pathlib.Path(__file__).parent;rows=[json.loads(x) for x in (p/'source-footprints.ndjson').read_text().splitlines()]+[json.loads(x) for x in (p/'supplemental-901/source-footprints.ndjson').read_text().splitlines()]
proof={r['url']:r for r in json.loads((p/'normalization-proof.json').read_text())};session='mangrove-logo-body-equivalence-notice';out=p/'pixel-equivalence-original-body-baseline';out.mkdir(exist_ok=True)
def cli(*args,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*args],input=stdin,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stdout+r.stderr)
 return r.stdout
seen=set();selected=[]
for r in rows:
 key=json.dumps([r['img']['rect'],r['img']['style'],r['img']['currentSrc'],[a['style']['background-color'] for a in r['ancestors']]],sort_keys=True)
 if key not in seen:seen.add(key);selected.append(r)
records=json.loads((p/'pixel-equivalence-original-body-baseline-records.json').read_text());assert len(records)==50
for record in records:
 for field,sha in [('before','beforeSHA256'),('after','afterSHA256')]:assert hashlib.sha256(pathlib.Path(record[field]).read_bytes()).hexdigest()==record[sha]
for index,r in enumerate(selected):
 if index<len(records):continue
 assert len(records)==index
 cli('open',r['url']);cli('set','viewport',str(r['viewport']['width']),'1000');cli('wait','.mg-logo')
 matte='#003366' if '-white' in r['img']['currentSrc'] else '#ffffff'
 actual=json.loads(cli('eval','--stdin',stdin='''(async()=>{const n=document.querySelector('.mg-logo');await n.decode();document.querySelector('#storybook-root').style.backgroundColor='''+json.dumps(matte)+''';const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {x:r.x,y:r.y,width:r.width,height:r.height,fit:s.objectFit,position:s.objectPosition};})()'''))
 assert {k:actual[k] for k in ['x','y','width','height']}==r['img']['rect'],('Unchanged initial source box',r['story'],r['locale'],actual,r['img']['rect'])
 stem=str(index).zfill(3);urlPaint=out/(stem+'-resource-url-original.png');before=out/(stem+'-source-body-original.png');after=out/(stem+'-normalized.png');cli('screenshot',str(urlPaint))
 chunk=proof.get(r['img']['currentSrc']);
 if chunk:
  asset=next(a for a in json.loads((p/'browser-http-assets.json').read_text()) if a['url']==r['img']['currentSrc']);body='data:image/svg+xml;base64,'+base64.b64encode(pathlib.Path(asset['path']).read_bytes()).decode();bodyBox=json.loads(cli('eval','--stdin',stdin="(async()=>{const n=document.querySelector('.mg-logo');n.src="+json.dumps(body)+";await n.decode();return n.getBoundingClientRect().toJSON();})()"));assert {k:bodyBox[k] for k in ['x','y','width','height']}==r['img']['rect'],('Original source body box changed',bodyBox,r['img']['rect'])
 cli('screenshot',str(before))
 urls=['data:image/svg+xml;base64,'+base64.b64encode(pathlib.Path(c['path']).read_bytes()).decode() for c in chunk['chunks']] if chunk else [r['img']['currentSrc']]
 if chunk:
  import xml.etree.ElementTree as E
  vb=chunk['viewBox'];dims=vb.split();outer=E.Element('svg',{'xmlns':'http://www.w3.org/2000/svg','viewBox':vb})
  for c in chunk['chunks']:
   chunkRoot=E.fromstring(pathlib.Path(c['path']).read_bytes());group=E.Element('g');group.extend(list(chunkRoot));outer.append(group)
  src='data:image/svg+xml;base64,'+base64.b64encode(E.tostring(outer,encoding='utf8')).decode()
 else:src=r['img']['currentSrc']
 assignment='original.src='+json.dumps(src)+';' if chunk else ''
 js="(async()=>{const original=document.querySelector('.mg-logo');"+assignment+'await original.decode();const a=original.getBoundingClientRect();return {x:a.x,y:a.y,width:a.width,height:a.height,nestedSourceLayers:'+str(len(urls))+'};})()'
 projected=json.loads(cli('eval','--stdin',stdin=js));assert {k:projected[k] for k in ['x','y','width','height']}==r['img']['rect'],('Projected box changed',projected,r['img']['rect'])
 cli('screenshot',str(after));a=Image.open(before).convert('RGBA');b=Image.open(after).convert('RGBA');assert a.size==b.size
 diff=ImageChops.difference(a,b);different=sum(x!=(0,0,0,0) for x in diff.getdata());maxdiff=max(max(x) for x in diff.getdata());rec={'index':index,'sourceCase':{'mode':r['mode'],'story':r['story'],'locale':r['locale'],'viewport':r['viewport']},'assetURL':r['img']['currentSrc'],'sourceRect':r['img']['rect'],'originalBox':actual,'projectedBox':projected,'matteDiagnosticOnly':matte,'projection':'Whole ordered source path chunks grouped in one source SVG viewport with no nested viewport transforms. Original IMG CSS/owning parent untouched; separate native asset overlay remains open.','chunks':len(urls),'sourceTransformationApplied':bool(chunk),'pngUnchangedControl':not bool(chunk),'differentPixels':different,'maxChannelDifference':maxdiff,'resourceURLPaint':str(urlPaint),'originalBodyBaseline':bool(chunk),'originalBodyBox':bodyBox if chunk else actual,'before':str(before),'after':str(after),'beforeSHA256':hashlib.sha256(before.read_bytes()).hexdigest(),'afterSHA256':hashlib.sha256(after.read_bytes()).hexdigest()};records.append(rec);(p/'pixel-equivalence-original-body-baseline-records.json').write_text(json.dumps(records,indent=2)+'\n')
 print('Compared',index+1,'of',len(selected),'different',different,flush=True)
 if different:raise RuntimeError('Exact pixel equivalence failed, evidence preserved')
cli('close');(p/'pixel-equivalence-original-body-baseline-receipt.json').write_text(json.dumps({'sourceOnly':True,'sourceCases':1050,'modeInvariantStoryLocaleViewportGroups':210,'distinctOwningPaintImageProjections':len(selected),'comparisonPairs':len(records),'normalizedSVGComparisonPairs':sum(x['sourceTransformationApplied'] for x in records),'unchangedPNGControlPairs':sum(x['pngUnchangedControl'] for x in records),'allExact':all(r['differentPixels']==0 for r in records),'matteDiagnosticOnly':True,'resourceURLVsBodyRasterGateOpen':True,'nativeAccepted':False},indent=2)+'\n')
