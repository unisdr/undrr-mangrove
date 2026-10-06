import json,pathlib,xml.etree.ElementTree as E,hashlib,re
p=pathlib.Path('/tmp/mangrove-page-header-source-20261006');out={}
for f in (p/'http-bodies').glob('*.svg'):
 root=E.fromstring(f.read_bytes());styles={}
 for e in root.iter():
  if e.tag.split('}')[-1]=='style':
   for cls,decl in re.findall(r'\.([\w-]+)\{([^}]+)\}',e.text):styles[cls]=dict(x.split(':',1) for x in decl.split(';') if x)
 shapes=[]
 def walk(e,inherit):
  tag=e.tag.split('}')[-1];attrs=dict(inherit)
  attrs.update(styles.get(e.get('class'),{}));attrs.update({k:v for k,v in e.attrib.items() if k not in ['id','class','viewBox','x','y','{http://www.w3.org/XML/1998/namespace}space']})
  if tag=='style':return
  if 'style' in attrs:
   attrs.update(dict(x.split(':',1) for x in attrs.pop('style').split(';') if x))
  if tag=='path':
   if set(attrs)-{'fill','fill-rule','clip-rule','d'}:raise ValueError(attrs.keys())
   shapes.append('<path '+' '.join(k+'="'+v+'"' for k,v in attrs.items())+'/>');return
  if tag not in ['svg','g']:raise ValueError(tag)
  for c in e:walk(c,attrs)
 walk(root,{})
 vb=root.get('viewBox');pre='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+vb+'" width="'+vb.split()[2]+'" height="'+vb.split()[3]+'">';chunks=[];current=[]
 for s in shapes:
  if len(pre+''.join(current)+s+'</svg>')>32768:chunks.append(pre+''.join(current)+'</svg>');current=[]
  current.append(s)
 if current:chunks.append(pre+''.join(current)+'</svg>')
 assert all(len(x)<=32768 for x in chunks)
 out[f.name]={'sourceSha256':hashlib.sha256(f.read_bytes()).hexdigest(),'source':f.read_text(),'viewBox':list(map(float,vb.split())),'chunks':chunks,'wholePaths':len(shapes),'chunkBytes':[len(x) for x in chunks]}
(p/'normalised-logos.json').write_text(json.dumps(out,indent=2)+'\n')
d=json.load(open(p/'source-footprints.json'));cases={}
for k,c in d['cases'].items():
 for n in c['tree']:
  if n.get('image'):cases[k]={'owner':n['rect'],'image':n['image'],'objectFit':n['style']['object-fit'],'objectPosition':n['style']['object-position']}
inputs={'logos':out,'cases':cases};(p/'logo-equivalence-input.json').write_text(json.dumps(inputs))
