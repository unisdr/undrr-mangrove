import json, subprocess, pathlib, urllib.parse
OUT=pathlib.Path('/tmp/mangrove-stats-card-source-20261006'); SESSION='mangrove-stats-card-mask-mirror'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',SESSION,'--json',*args],capture_output=True,text=True,check=True);j=json.loads(r.stdout)
 if not j['success']:raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
read=r'''(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const rect=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}},root=document.querySelector('.mg-stats-card'),before=rect(root),items=[];for(const [index,n]of [...root.querySelectorAll('.mg-stats-card-item__icon .mg-icon')].entries()){const pseudo=getComputedStyle(n,'::before'),original={owner:rect(n),parent:rect(n.parentElement),card:rect(n.closest('.mg-stats-card-item'))},css=Object.fromEntries([...pseudo].map(k=>[k,pseudo.getPropertyValue(k)]));if(pseudo.maskImage==='none'){items.push({index,classes:n.className,css,original,maskAbsent:true});continue;}const name='mg-source-stats-mirror-'+index,style=document.createElement('style');style.textContent='.'+name+'::before{display:none!important}';document.head.append(style);const mirror=document.createElement('span');for(const [key,value]of Object.entries(css))mirror.style.setProperty(key,value);n.classList.add(name);n.append(mirror);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const projected={owner:rect(n),parent:rect(n.parentElement),card:rect(n.closest('.mg-stats-card-item')),pseudo:rect(mirror)};items.push({index,classes:n.className.replace(name,'').trim(),css,original,projected,ownerAndAncestorsUnchanged:JSON.stringify(original)===JSON.stringify({owner:projected.owner,parent:projected.parent,card:projected.card})});mirror.remove();n.classList.remove(name);style.remove();}return{url:location.href,viewport:{width:innerWidth,height:innerHeight},rootBefore:before,rootAfter:rect(root),restored:JSON.stringify(before)===JSON.stringify(rect(root)),items};})()'''
cases=[]
try:
 for mode,theme in themes.items():
  for width in [390,1164]:
   cli('set','viewport',str(width),'1000')
   for preset in ['with-icons','negative','linked','mixed-content']:
    url='http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':'components-cards-stats-card--'+preset,'viewMode':'story','globals':'theme:'+theme+';locale:english'})
    cli('open',url);cli('wait','--fn','!!document.querySelector(".mg-stats-card")')
    c=cli('eval',read);c.update(mode=mode,preset=preset);cases.append(c)
    (OUT/'mask-mirror-readout.json').write_text(json.dumps(cases,ensure_ascii=False,indent=2)+'\n')
   print(mode,width,len(cases),flush=True)
finally:cli('close')
