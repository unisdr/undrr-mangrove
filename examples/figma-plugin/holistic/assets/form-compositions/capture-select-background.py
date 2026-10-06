import json,subprocess,pathlib,urllib.parse
OUT=pathlib.Path('/tmp/mangrove-form-compositions-source-20261006');SESSION='mangrove-form-select-background-source'
def cli(*args):
 r=subprocess.run(['agent-browser','--session',SESSION,'--json',*args],capture_output=True,text=True,check=True);j=json.loads(r.stdout)
 if not j['success']:raise RuntimeError(j)
 return j['data'].get('result',j['data'])
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
scenes=json.loads((OUT/'source-footprints.json').read_text())
for mode,theme in themes.items():
 for width in [390,1164]:
  cli('set','viewport',str(width),'1000');cli('open','http://localhost:6121/iframe.html?'+urllib.parse.urlencode({'id':'components-forms-form-action--select-and-continue','viewMode':'story','globals':'theme:'+theme+';locale:english'}));cli('wait','--fn','!!document.querySelector("select")');cli('mouse','move','0','0')
  bg=cli('eval',"(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));let s=getComputedStyle(document.querySelector('select'));return Object.fromEntries(['backgroundOrigin','backgroundClip','backgroundPositionX','backgroundPositionY','backgroundSize','backgroundImage','borderRightWidth','borderLeftWidth','borderTopWidth','borderBottomWidth'].map(k=>[k,s[k]]));})()")
  scene=next(c for c in scenes if c['mode']==mode and c['viewport']['width']==width and c['case']=='action-select-and-continue');scene['selectBackground']=bg;scene['tree']['children'][1]['children'][0]['selectBackground']=bg
  (OUT/'source-footprints.json').write_text(json.dumps(scenes,ensure_ascii=False,indent=2)+'\n')
 print(mode,flush=True)
cli('close')
