import json, subprocess, pathlib, urllib.parse, hashlib
OUT=pathlib.Path('/tmp/mangrove-scroll-show-more-source-20261006');SESSION='mangrove-scroll-show-more-source'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',SESSION,'--json',*args],capture_output=True,text=True,check=True)
 j=json.loads(r.stdout)
 if not j['success']: raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
props=['display','position','boxSizing','fontFamily','fontSize','fontWeight','fontStyle','lineHeight','color','backgroundColor','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','borderTopStyle','borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius','paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom','marginLeft','marginRight','gap','opacity','visibility','boxShadow','transform','top','left','bottom','right','width','height','maxWidth','minHeight','textAlign','whiteSpace','content','maskImage','maskSize','maskPosition','overflow','textDecoration','textUnderlineOffset','backgroundPositionX','backgroundPositionY','backgroundImage','flexDirection','flexWrap','justifyContent','alignItems','gridTemplateColumns','columnGap','rowGap','textWrapStyle','direction','fontVariantNumeric','textTransform','letterSpacing','borderBottomStyle','backgroundOrigin','maskMode','maskRepeat','scrollbarWidth','scrollbarColor','overflowX','overflowY','maxHeight','minWidth','scrollSnapType']
read='''(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const root=document.querySelector(ROOT),props=PROPS;function rect(n){const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}function css(n,pseudo){const s=getComputedStyle(n,pseudo);return Object.fromEntries(props.map(p=>[p,s[p]]));}function node(n){const text=[...n.childNodes].filter(x=>x.nodeType===3&&x.textContent.trim()).map(x=>{const range=document.createRange();range.selectNodeContents(x);const lines=[];for(let i=0;i<x.textContent.length;i++){const r=document.createRange();r.setStart(x,i);r.setEnd(x,i+1);const b=r.getBoundingClientRect();if(!b.width&&!b.height)continue;const last=lines.at(-1);if(last&&last.y===b.y){last.end=i+1;last.characters=x.textContent.slice(last.start,last.end);last.width=b.right-last.x;}else lines.push({start:i,end:i+1,characters:x.textContent.slice(i,i+1),x:b.x,y:b.y,width:b.width,height:b.height});}return {characters:x.textContent,lines,rect:rect(range),fragments:[...range.getClientRects()].map(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))};});return {scrollLeft:n.scrollLeft,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth,naturalWidth:n.naturalWidth,naturalHeight:n.naturalHeight,currentSrc:n.currentSrc,src:n.getAttribute('src'),ariaControls:n.getAttribute('aria-controls'),fullText:n.textContent,childOrder:[...n.childNodes].map(x=>x.nodeType===3?{text:x.textContent}:{tag:x.nodeName,index:[...n.children].indexOf(x)}),tag:n.tagName,class:n.className,href:n.getAttribute('href'),text:n.textContent,hidden:n.hidden,value:n.value,checked:n.checked,disabled:n.matches(':disabled'),required:n.required,placeholder:n.getAttribute('placeholder'),placeholderCss:n.tagName==='INPUT'?css(n,'::placeholder'):null,ariaLabel:n.getAttribute('aria-label'),rect:rect(n),css:css(n),before:css(n,'::before'),after:css(n,'::after'),text,children:[...n.children].map(node)};}return {url:location.href,theme:document.body.className,documentHeight:document.documentElement.scrollHeight,viewport:{width:innerWidth,height:innerHeight},tree:node(root),ancestors:(()=>{const out=[];for(let n=root.parentElement;n&&out.length<5;n=n.parentElement)out.push({tag:n.tagName,class:n.className,rect:rect(n),css:css(n)});return out;})(),styles:[...document.querySelectorAll('style')].map(x=>x.textContent),fontRequests:performance.getEntriesByType('resource').filter(x=>/woff/.test(x.name)).map(x=>x.name),controlAlias:getComputedStyle(document.body).getPropertyValue('--mg-control-border')};})()'''
allcases=[]
def save(mode,width,key,state):
 result=cli('eval',read.replace('ROOT',json.dumps('#storybook-root')).replace('PROPS',json.dumps(props)))
 styles=result.pop('styles');result['activeStyleHashes']=[hashlib.sha256(x.encode()).hexdigest()for x in styles];result.update(mode=mode,case=key,state=state)
 allcases.append(result);(OUT/'source-footprints.json').write_text(json.dumps(allcases,ensure_ascii=False,indent=2)+'\n')
 if mode=='undrr':cli('screenshot',str(OUT/f'{key}-{width}-{state}.png'))
for mode,theme in themes.items():
 for width in [390,1164]:
  cli('set','viewport',str(width),'1000')
  for key in ['default','custom-height','with-min-width','with-arrows','with-custom-step-size','two-hydrated-on-one-page']:
   url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':'components-scrollcontainer--'+key,'viewMode':'story','globals':'theme:'+theme+';locale:english'})
   cli('open',url);cli('wait','--fn',"!!document.querySelector('.mg-scroll__container')")
   cli('wait','--fn',"[...document.querySelectorAll('img')].every(n=>n.complete)")
   save(mode,width,'scroll-'+key,'start')
   if key in ['with-arrows','with-custom-step-size','two-hydrated-on-one-page']:
    for state,expr in [('middle','(n.scrollWidth-n.clientWidth)/2'),('end','n.scrollWidth-n.clientWidth')]:
     cli('eval',"document.querySelectorAll('.mg-scroll__container').forEach(n=>{n.scrollLeft="+expr+";n.dispatchEvent(new Event('scroll'))})")
     cli('eval',"(async()=>{for(let i=0;i<40;i++)await new Promise(r=>requestAnimationFrame(r));return [...document.querySelectorAll('.mg-scroll__container')].map(n=>n.scrollLeft)})()")
     save(mode,width,'scroll-'+key,state)
  for key in ['default-show-more','detached-button','two-on-one-page']:
   url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':'components-showmore--'+key,'viewMode':'story','globals':'theme:'+theme+';locale:english'})
   cli('open',url);cli('wait','--fn',"!!document.querySelector('[data-mg-show-more-initialized]')")
   save(mode,width,'show-'+key,'collapsed')
   cli('eval',"document.querySelector('[data-mg-show-more-initialized]').click()")
   save(mode,width,'show-'+key,'first-expanded')
   if key=='two-on-one-page':
    cli('eval',"document.querySelectorAll('[data-mg-show-more-initialized]')[1].click()")
    save(mode,width,'show-'+key,'first-two-expanded')
  print(mode,width,len(allcases),flush=True)
cli('close')
