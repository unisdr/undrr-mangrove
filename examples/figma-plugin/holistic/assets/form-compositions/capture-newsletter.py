import json, subprocess, pathlib, urllib.parse, hashlib
OUT=pathlib.Path('/tmp/mangrove-form-compositions-source-20261006');SESSION='mangrove-form-compositions-source'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',SESSION,'--json',*args],capture_output=True,text=True,check=True)
 j=json.loads(r.stdout)
 if not j['success']: raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
props=['display','position','boxSizing','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','color','backgroundColor','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','borderTopStyle','borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius','paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom','marginLeft','marginRight','gap','opacity','visibility','boxShadow','transform','top','left','bottom','right','width','height','maxWidth','minHeight','textAlign','whiteSpace','content','maskImage','maskSize','maskPosition','overflow','textDecoration','textUnderlineOffset','backgroundPositionX','backgroundPositionY','backgroundImage']
read='''(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const root=document.querySelector(ROOT),props=PROPS;function rect(n){const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}function css(n,pseudo){const s=getComputedStyle(n,pseudo);return Object.fromEntries(props.map(p=>[p,s[p]]));}function node(n){const text=[...n.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).map(x=>{const range=document.createRange();range.selectNodeContents(x);const lines=[];for(let i=0;i<x.textContent.length;i++){const r=document.createRange();r.setStart(x,i);r.setEnd(x,i+1);const b=r.getBoundingClientRect();if(!b.width&&!b.height)continue;const last=lines.at(-1);if(last&&last.y===b.y){last.end=i+1;last.characters=x.textContent.slice(last.start,last.end);last.width=b.right-last.x;}else lines.push({start:i,end:i+1,characters:x.textContent.slice(i,i+1),x:b.x,y:b.y,width:b.width,height:b.height});}return {characters:x.textContent,lines,rect:rect(range),fragments:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))};});return {tag:n.tagName,class:n.className,text:n.textContent,hidden:n.hidden,value:n.value,checked:n.checked,disabled:n.matches(':disabled'),required:n.required,placeholder:n.getAttribute('placeholder'),placeholderCss:n.tagName==='INPUT'?css(n,'::placeholder'):null,ariaLabel:n.getAttribute('aria-label'),rect:rect(n),css:css(n),before:css(n,'::before'),after:css(n,'::after'),text,children:[...n.children].map(node)};}return {url:location.href,theme:document.body.className,viewport:{width:innerWidth,height:innerHeight},tree:node(root),styles:[...document.querySelectorAll('style')].map(x=>x.textContent),fontRequests:performance.getEntriesByType('resource').filter(x=>/woff/.test(x.name)).map(x=>x.name),controlAlias:getComputedStyle(document.body).getPropertyValue('--mg-control-border-default')};})()'''
allcases=json.loads((OUT/'source-footprints.json').read_text())
for mode,theme in themes.items():
 for width in [390,1164]:
  cli('set','viewport',str(width),'1000')
  for state in ['idle','invalid','sending','service-error']:
   story='example-newsletter-promotion--after-article'
   url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':story,'viewMode':'story','globals':'theme:'+theme+';locale:english',**({'args':'response:error'}if state=='service-error'else{})})
   cli('open',url);cli('wait','--fn','!!document.querySelector(".mg-form-action")')
   if state=='invalid':
    cli('click','.mg-form-action__action');cli('wait','--fn','!!document.querySelector(".mg-form-field .mg-form-error")')
   if state in ['sending','service-error']:
    if state=='sending':cli('eval','window.__sourceTimerFixture={delay:600,replacement:60000};const original=window.setTimeout;window.setTimeout=(fn,delay,...args)=>original(fn,delay===600?60000:delay,...args)')
    cli('fill','input[name=email]','reader@example.org');cli('click','.mg-form-action__action')
    cli('wait','--fn','document.querySelector(".mg-form-action__action").textContent===' +json.dumps('Sending…'if state=='sending'else'Subscribe'))
    if state=='service-error':cli('wait','--fn','!!document.querySelector("form > p[role=alert]")')
   cli('mouse','move','0','0');cli('eval','document.activeElement.blur(); Promise.all(document.getAnimations().filter(a=>a instanceof CSSTransition).map(a=>a.finished.catch(()=>{})))')
   result=cli('eval',read.replace('ROOT',json.dumps('form')).replace('PROPS',json.dumps(props)))
   styles=result.pop('styles');result['activeStyleHashes']=[hashlib.sha256(x.encode()).hexdigest()for x in styles];result.update(mode=mode,case='action-newsletter',state=state,fixture={'sendingDelayMs':60000}if state=='sending'else{})
   allcases=[c for c in allcases if not(c['mode']==mode and c['case']=='action-newsletter'and c['state']==state and c['viewport']['width']==width)];allcases.append(result);(OUT/'source-footprints.json').write_text(json.dumps(allcases,ensure_ascii=False,indent=2)+'\n')
   if mode=='undrr':cli('screenshot',str(OUT/f'newsletter-{state}-{width}.png'))
  print(mode,width,len(allcases),flush=True)
cli('close')
