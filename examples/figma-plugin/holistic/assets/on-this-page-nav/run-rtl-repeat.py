import subprocess,json,pathlib
from urllib.parse import quote
out=pathlib.Path('/tmp/mangrove-on-this-page-nav-source-20261006');session=(out/'session.txt').read_text().strip();cases={}
def call(*a,stdin=None):
 p=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(out/'capture.log').open('a').write(' '.join(a)+'\n'+p.stdout+p.stderr);p.check_returncode();return p.stdout
modes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
stories=['auto-detect','with-nested-headings','explicit-links','with-cta','with-excluded-heading','many-items','with-offset','rtl','with-tabs-content']
def save(mode,story,width,state='initial'):
 key=f'{mode}-{story}-{width}-{state}';cases[key]=json.loads(call('eval','--stdin',stdin=(out/'capture.js').read_text()));(out/'rtl-repeat-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},indent=2));print(key,flush=True)
def settle():call('eval','--stdin',stdin='(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,600));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return true})()')
def op(js):call('eval','--stdin',stdin=js);settle()
try:
 for mode,theme in modes.items():
  for width in [390,1164]:
   call('set','viewport',str(width),'1000')
   call('open','http://localhost:6121/iframe.html?id=components-navigation-on-this-page-nav--explicit-links&viewMode=story&globals=theme:'+quote(theme));settle()
   call('open','http://localhost:6121/iframe.html?id=components-navigation-on-this-page-nav--rtl&viewMode=story&globals=theme:'+quote(theme));call('mouse','move','0','999');settle();save(mode,'rtl',width)
finally:
 (out/'rtl-repeat-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},indent=2));call('close')
