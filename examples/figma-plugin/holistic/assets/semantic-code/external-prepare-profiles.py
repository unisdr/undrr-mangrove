import pathlib,json,hashlib
src=pathlib.Path('/tmp/mangrove-semantic-inline-fragment-geometry-20261006');out=pathlib.Path(__file__).parent
modes=['undrr','delta','irp','mcr','preventionweb'];profiles=[];pins={}
for locale in ['english','arabic','japanese']:
 for width in [390,1164]:
  rows={}
  for mode in modes:
   p=src/f'{mode}-{locale}-code-{width}-diagnostic.json';b=p.read_bytes();pins[str(p)]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};j=json.loads(b);assert j['allRecordedBeforeAfterAndBaselineExact'];rows[mode]=j['geometry']['records'][0]
  chars=rows['undrr']['characters'];assert all(r['characters']==chars for r in rows.values());cuts={0,len(chars.encode('utf-16-le'))//2}
  for r in rows.values():
   for s in r['segments']:
    cuts.update([s['start'],s['end']]);last=None
    for c in s['characterRects']:
     assert len(c['rects'])<=1 or c['characters'].isspace()
     if len(c['rects'])>1:cuts.update([c['start'],c['end']])
     y=c['rects'][0]['y'] if c['rects'] else last
     if last is not None and y!=last:cuts.add(c['start'])
     last=y
  cuts=sorted(cuts);parts=[]
  for i,(a,b) in enumerate(zip(cuts,cuts[1:])):
   part={'start':a,'end':b,'characters':chars.encode('utf-16-le')[2*a:2*b].decode('utf-16-le'),'modes':{}}
   for mode,r in rows.items():
    ss=[s for s in r['segments'] if s['start']<=a and s['end']>=b];assert len(ss)==1;s=ss[0];rr=[v for c in s['characterRects'] if c['start']>=a and c['end']<=b for v in c['rects'][:1]]
    if not rr:
     assert part['characters'].isspace();owner=r['ownerBoundingRect'];rr=[{'x':owner['x'],'y':owner['y'],'right':owner['x'],'bottom':owner['y']}]
     part['sourceCollapsedWhitespace']=True
    x=min(v['x'] for v in rr);y=min(v['y'] for v in rr);right=max(v['right'] for v in rr);bottom=max(v['bottom'] for v in rr);assert len(set(v['y'] for v in rr))==1
    st=s['style'];part['modes'][mode]={'rect':{'x':x,'y':y,'width':right-x,'height':bottom-y},'parentTag':s['parentTag'],'style':{k:st[k] for k in ['font-family','font-size','font-weight','font-style','line-height','color','direction','text-transform','letter-spacing']}}
   parts.append(part)
  boxes=[]
  for i,box in enumerate(rows['undrr']['inlineBoxes']):
   x={'start':box['start'],'end':box['end'],'characters':box['characters'],'modes':{}}
   for mode,r in rows.items():
    q=r['inlineBoxes'][i];assert (q['start'],q['end'],q['characters'])==(x['start'],x['end'],x['characters']);assert len(q['ownerClientRects'])==1
    x['modes'][mode]={'rect':q['ownerClientRects'][0],'style':{k:q['style'][k] for k in ['background-color','border-top-left-radius','padding-left','padding-right','padding-top','padding-bottom','opacity','box-shadow']}}
   boxes.append(x)
  profiles.append({'id':f'{locale}-{width}','locale':locale,'viewport':width,'characters':chars,'cuts':cuts,'parts':parts,'boxes':boxes,'owners':{m:r['ownerBoundingRect'] for m,r in rows.items()}})
(out/'profiles.json').write_text(json.dumps({'sourceOnly':True,'profiles':profiles,'rawPins':pins},ensure_ascii=False,indent=2)+'\n');print('6 profiles',sum(len(p['parts']) for p in profiles),'contiguous fragments;',sum(not b['characters'] for p in profiles for b in p['boxes']),'empty profile boxes')
