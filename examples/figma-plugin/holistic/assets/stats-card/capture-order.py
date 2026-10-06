import json, subprocess, pathlib, urllib.parse, hashlib
OUT=pathlib.Path('/tmp/mangrove-stats-card-source-20261006');SESSION='mangrove-stats-card-source-order'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',SESSION,'--json',*args],capture_output=True,text=True,check=True)
 j=json.loads(r.stdout)
 if not j['success']: raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
props=['display','position','boxSizing','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','color','backgroundColor','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','borderTopStyle','borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius','paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom','marginLeft','marginRight','gap','opacity','visibility','boxShadow','transform','top','left','bottom','right','width','height','maxWidth','minHeight','textAlign','whiteSpace','content','maskImage','maskSize','maskPosition','overflow','textDecoration','textUnderlineOffset','backgroundPositionX','backgroundPositionY','backgroundImage','flexDirection','flexWrap','justifyContent','alignItems','gridTemplateColumns','columnGap','rowGap','textWrapStyle','direction','fontVariantNumeric','textTransform','letterSpacing','borderBottomStyle','backgroundOrigin']
read='''(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const root=document.querySelector(ROOT),props=PROPS;function rect(n){const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}function css(n,pseudo){const s=getComputedStyle(n,pseudo);return Object.fromEntries(props.map(p=>[p,s[p]]));}function node(n){const text=[...n.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).map(x=>{const range=document.createRange();range.selectNodeContents(x);const lines=[];for(let i=0;i<x.textContent.length;i++){const r=document.createRange();r.setStart(x,i);r.setEnd(x,i+1);const b=r.getBoundingClientRect();if(!b.width&&!b.height)continue;const last=lines.at(-1);if(last&&last.y===b.y){last.end=i+1;last.characters=x.textContent.slice(last.start,last.end);last.width=b.right-last.x;}else lines.push({start:i,end:i+1,characters:x.textContent.slice(i,i+1),x:b.x,y:b.y,width:b.width,height:b.height});}return {characters:x.textContent,lines,rect:rect(range),fragments:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))};});return {fullText:n.textContent,childOrder:[...n.childNodes].map(x=>x.nodeType===3?{text:x.textContent}:{tag:x.nodeName,index:[...n.children].indexOf(x)}),tag:n.tagName,class:n.className,href:n.getAttribute('href'),text:n.textContent,hidden:n.hidden,value:n.value,checked:n.checked,disabled:n.matches(':disabled'),required:n.required,placeholder:n.getAttribute('placeholder'),placeholderCss:n.tagName==='INPUT'?css(n,'::placeholder'):null,ariaLabel:n.getAttribute('aria-label'),rect:rect(n),css:css(n),before:css(n,'::before'),after:css(n,'::after'),text,children:[...n.children].map(node)};}return {url:location.href,theme:document.body.className,documentHeight:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight},tree:node(root),ancestors:(()=>{const out=[];for(let n=root.parentElement;n&&out.length<5;n=n.parentElement)out.push({tag:n.tagName,class:n.className,rect:rect(n),css:css(n)});return out;})(),styles:[...document.querySelectorAll('style')].map(x=>x.textContent),fontRequests:performance.getEntriesByType('resource').filter(x=>/woff/.test(x.name)).map(x=>x.name),controlAlias:getComputedStyle(document.body).getPropertyValue('--mg-control-border')};})()'''
allcases=[]
for mode,theme in themes.items():
 for width in [390,1164]:
  cli('set','viewport',str(width),'1000')
  cases=[(s,'components-cards-stats-card--'+s,'.mg-stats-card')for s in ['default','with-icons','compact','highlighted','negative','linked','mixed-content']]
  for key,story,selector in cases:
   url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':story,'viewMode':'story','globals':'theme:'+theme+';locale:english'})
   cli('open',url);cli('wait','--fn',f'!!document.querySelector({json.dumps(selector)})')
   result=cli('eval',read.replace('ROOT',json.dumps(selector)).replace('PROPS',json.dumps(props)))
   styles=result.pop('styles');result['activeStyleHashes']=[hashlib.sha256(x.encode()).hexdigest()for x in styles];result.update(mode=mode,case=key,state='initial')
   allcases.append(result)
   (OUT/'source-footprints-with-order.json').write_text(json.dumps(allcases,ensure_ascii=False,indent=2)+'\n')
   # Existing screenshots preserved
  print(mode,width,len(allcases),flush=True)
cli('close')
