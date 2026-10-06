import json, subprocess, pathlib, urllib.parse, hashlib
OUT=pathlib.Path('/tmp/mangrove-copy-cite-source-20261006');SESSION='mangrove-copy-cite-source'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',SESSION,'--json',*args],capture_output=True,text=True,check=True)
 j=json.loads(r.stdout)
 if not j['success']: raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
props=['display','position','boxSizing','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','color','backgroundColor','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','borderTopStyle','borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius','paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom','marginLeft','marginRight','gap','opacity','visibility','boxShadow','transform','top','left','bottom','right','width','height','maxWidth','minHeight','textAlign','whiteSpace','content','maskImage','maskSize','maskPosition','overflow','textDecoration','textUnderlineOffset']
read='''(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const root=document.querySelector(ROOT),props=PROPS;function rect(n){const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}function css(n,pseudo){const s=getComputedStyle(n,pseudo);return Object.fromEntries(props.map(p=>[p,s[p]]));}function node(n){const text=[...n.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).map(x=>{const range=document.createRange();range.selectNodeContents(x);const lines=[];for(let i=0;i<x.textContent.length;i++){const r=document.createRange();r.setStart(x,i);r.setEnd(x,i+1);const b=r.getBoundingClientRect();if(!b.width&&!b.height)continue;const last=lines.at(-1);if(last&&last.y===b.y){last.end=i+1;last.characters=x.textContent.slice(last.start,last.end);last.width=b.right-last.x;}else lines.push({start:i,end:i+1,characters:x.textContent.slice(i,i+1),x:b.x,y:b.y,width:b.width,height:b.height});}return {characters:x.textContent,lines,rect:rect(range),fragments:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))};});return {tag:n.tagName,class:n.className,text:n.textContent,hidden:n.hidden,ariaLabel:n.getAttribute('aria-label'),rect:rect(n),css:css(n),before:css(n,'::before'),after:css(n,'::after'),text,children:[...n.children].map(node)};}return {url:location.href,theme:document.body.className,viewport:{width:innerWidth,height:innerHeight},tree:node(root),styles:[...document.querySelectorAll('style')].map(x=>x.textContent),fontRequests:performance.getEntriesByType('resource').filter(x=>/woff/.test(x.name)).map(x=>x.name),controlAlias:getComputedStyle(document.body).getPropertyValue('--mg-control-border-default')};})()'''
allcases=json.loads((OUT/'source-footprints.json').read_text()) if (OUT/'source-footprints.json').exists() else []
copyconfigs=[('outline','default',''),('primary','primary',''),('secondary','default','variant:secondary'),('small','default','size:small'),('large','default','size:large'),('vanilla-custom','vanilla-html-live-integration','')]
for mode,theme in themes.items():
 for width in [390,1164]:
  cli('set','viewport',str(width),'1000')
  cases=[('copy-'+key,'components-buttons-copybutton--'+story,args,state)for key,story,args in copyconfigs for state in ['idle','copied','failed']]
  cases += [('cite-'+story,'components-cite-this--'+story,'',state)for story in ['bare-page-fallback','page-with-overrides','metadata','schema-metadata','publisher-citation','long-citation']for state in ['closed','open']]
  cases += [('cite-metadata','components-cite-this--metadata','',state)for state in ['copied','failed','fallback-closed','fallback-open']]
  for key,story,args,state in cases:
   previous=next((x for x in allcases if x['mode']==mode and x['viewport']['width']==width and x['case']==key and x['state']==state),None)
   if previous and (key.startswith('copy') or previous.get('lineRangesCaptured')):continue
   url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':story,'viewMode':'story','globals':'theme:'+theme,**({'args':args}if args else {})})
   cli('open',url);iscopy=key.startswith('copy');selector='.mg-copy-button'if iscopy else'.mg-cite-this'
   cli('wait','--fn',f'!!document.querySelector({json.dumps(selector)})'+('&&!!document.querySelector(".mg-cite-this__trigger")'if not iscopy else''))
   if state in ['copied','failed']:
    cli('eval',"Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{"+('throw Error("Deterministic source failure fixture")'if state=='failed'else'')+"}}});")
   if not iscopy and state in ['open','copied','failed']:
    cli('click','.mg-cite-this__trigger');cli('wait','--fn','document.querySelector(".mg-cite-this__dialog").open')
   if state in ['copied','failed']:
    cli('click','.mg-copy-button'if iscopy else'.mg-cite-this__dialog .mg-cite-this__copy')
    cli('wait','--fn','getComputedStyle(document.querySelector(".mg-copy-button__feedback")).opacity === "1"'if iscopy else'!!document.querySelector(".mg-cite-this__dialog .mg-cite-this__status").textContent')
   if state.startswith('fallback'):
    cli('eval','document.querySelector(".mg-cite-this__trigger").hidden=true;document.querySelector(".mg-cite-this__fallback").hidden=false;document.querySelector(".mg-cite-this__fallback").open='+('true'if state.endswith('open')else'false'))
   result=cli('eval',read.replace('ROOT',json.dumps(selector)).replace('PROPS',json.dumps(props)))
   styles=result.pop('styles');result['activeStyleHashes']=[hashlib.sha256(x.encode()).hexdigest()for x in styles];result.update(mode=mode,case=key,state=state)
   result['lineRangesCaptured']=True
   if previous:allcases[allcases.index(previous)]=result
   else:allcases.append(result)
   (OUT/'source-footprints.json').write_text(json.dumps(allcases,ensure_ascii=False,indent=2)+'\n')
   if mode=='undrr'and state in ['copied','failed','open','fallback-open']:
    cli('screenshot',str(OUT/f'{key}-{state}-{width}.png'))
  print(mode,width,len(allcases),flush=True)
cli('close')
