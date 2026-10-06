import json,subprocess,pathlib,urllib.parse,hashlib
out=pathlib.Path('/tmp/mangrove-scroll-photo-outline-source-20261006');out.mkdir(exist_ok=True);session='mangrove-scroll-photo-outline'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',session,'--json',*args],capture_output=True,text=True,check=True);j=json.loads(r.stdout)
 if not j['success']:raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
rows=[]
try:
 for mode,theme in themes.items():
  for width in [390,1164]:
   cli('set','viewport',str(width),'1000');url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':'components-scrollcontainer--with-min-width','viewMode':'story','globals':'theme:'+theme+';locale:english'});cli('open',url);cli('wait','--fn',"document.querySelector('.mg-scroll')&&[...document.images].every(n=>n.complete)")
   r=cli('eval',"(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const n=document.querySelector('.mg-scroll').parentElement,s=getComputedStyle(n),b=n.getBoundingClientRect();return {url:location.href,rect:{x:b.x,y:b.y,width:b.width,height:b.height},style:Object.fromEntries(['outlineWidth','outlineColor','outlineStyle','outlineOffset','overflowX','overflowY','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth'].map(p=>[p,s[p]])),styleHashes:[...document.querySelectorAll('style')].map(n=>n.textContent),controlAlias:getComputedStyle(document.body).getPropertyValue('--mg-control-border')};})()")
   r['styleHashes']=[hashlib.sha256(s.encode()).hexdigest()for s in r['styleHashes']];r.update(mode=mode,viewport=width);rows.append(r);(out/'outline-source.json').write_text(json.dumps(rows,indent=2)+'\n');print(mode,width,flush=True)
finally:cli('close')
