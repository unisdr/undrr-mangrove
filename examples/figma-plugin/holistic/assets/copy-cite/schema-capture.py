import json, subprocess, pathlib, urllib.parse, hashlib
OUT=pathlib.Path('/tmp/mangrove-copy-cite-source-20261006');SESSION='mangrove-copy-cite-schema-source'
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
  cli('open','http://localhost:6119/matching-schema.html?mode='+mode)
  cli('wait','--fn','document.querySelector(".mg-cite-this")?.dataset.mgCiteThisSource==="schema"')
  cli('click','.mg-cite-this__trigger')
  cli('wait','--fn','document.querySelector("dialog").open')
  result=cli('eval',read.replace('ROOT',json.dumps('.mg-cite-this')).replace('PROPS',json.dumps(props)))
  result.pop('styles');result.update(mode=mode,case='cite-matching-schema-host',state='open',lineRangesCaptured=True,sourceFixture='Actual vanilla source with literal SchemaMetadata story values and matching host canonical')
  allcases.append(result)
  (OUT/'source-footprints.json').write_text(json.dumps(allcases,ensure_ascii=False,indent=2)+'\n')
  if mode=='undrr':cli('screenshot',str(OUT/f'matching-schema-host-open-{width}.png'))
  print(mode,width,flush=True)
cli('close')
