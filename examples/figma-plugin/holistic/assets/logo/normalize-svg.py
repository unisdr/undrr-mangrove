import pathlib,json,xml.etree.ElementTree as E,re,hashlib
p=pathlib.Path(__file__).parent;j=json.loads((p/'browser-http-assets.json').read_text());out=p/'normalized-svg';out.mkdir(exist_ok=True);proof=[]
for asset in j:
 if not asset['url'].endswith('.svg'):continue
 root=E.fromstring(pathlib.Path(asset['path']).read_bytes());vb=root.attrib['viewBox'];rules={}
 for n in root.iter():
  if n.tag.endswith('}style'):
   for selector,body in re.findall(r'([^{}]+)\{([^{}]+)\}',n.text or ''):
    selector=selector.strip();assert re.fullmatch(r'\.[\w-]+',selector)
    rules[selector[1:]]=dict(x.strip().split(':',1) for x in body.strip().rstrip(';').split(';'))
 paths=[];orig=[]
 def visit(n,inherit):
  tag=n.tag.split('}')[-1]
  if tag in ['defs','style']:return
  assert tag in ['svg','g','path'],tag
  paint={**inherit}
  for cls in n.attrib.get('class','').split():paint.update(rules[cls])
  paint.update(dict(x.strip().split(':',1) for x in n.attrib.get('style','').rstrip(';').split(';') if x.strip()))
  for k in ['fill','fill-rule','clip-rule','opacity','fill-opacity']: 
   if k in n.attrib:paint[k]=n.attrib[k]
  paint={k:v for k,v in paint.items() if k!='enable-background'}
  assert set(paint)<=set(['fill','fill-rule','clip-rule','opacity','fill-opacity']),paint
  assert 'transform' not in n.attrib and 'clip-path' not in n.attrib and 'mask' not in n.attrib
  if tag=='path':
   assert set(n.attrib)<=set(['d','class','style','fill','fill-rule','clip-rule','opacity','fill-opacity']),n.attrib.keys()
   d=n.attrib['d'];el=E.Element('path',{'d':d,**paint});xml=E.tostring(el,encoding='unicode',short_empty_elements=True);paths.append(xml);orig.append({'d':d,'paint':paint})
  for c in n:visit(c,paint)
 visit(root,{'fill':'black','fill-rule':'nonzero'})
 header='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb+'">';footer='</svg>';chunks=[];part=[]
 for xml in paths:
  if len((header+''.join(part)+xml+footer).encode())>32768:
   assert part;chunks.append(header+''.join(part)+footer);part=[]
  part.append(xml)
 if part:chunks.append(header+''.join(part)+footer)
 assert all(len(c.encode())<=32768 for c in chunks)
 replay=[{'d':n.attrib['d'],'paint':{k:v for k,v in n.attrib.items() if k!='d'}} for c in chunks for n in E.fromstring(c)]
 assert orig==replay
 names=[]
 for i,c in enumerate(chunks):
  name=pathlib.Path(asset['url']).name+'.'+str(i)+'.svg';(out/name).write_text(c);names.append({'path':str(out/name),'bytes':len(c.encode()),'sha256':hashlib.sha256(c.encode()).hexdigest()})
 proof.append({'url':asset['url'],'originalSHA256':asset['sha256'],'viewBox':vb,'wholePaths':len(paths),'pathDataAndPaintOrderExact':True,'inheritedPaintFlattened':True,'chunks':names})
(p/'normalization-proof.json').write_text(json.dumps(proof,indent=2)+'\n');print('Wholepath normalized',len(proof),'sourceSVGs; chunks',sum(len(r['chunks']) for r in proof))
