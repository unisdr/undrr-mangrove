from urllib.parse import quote
import subprocess,json,pathlib,time
out=pathlib.Path('/tmp/mangrove-footer-source-20261006');session=(out/'session.txt').read_text().strip()
def call(*a,stdin=None):
 p=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(out/'capture.log').open('a').write(' '.join(a)+'\n'+p.stdout+p.stderr);p.check_returncode();return p.stdout
modes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
cases=json.loads((out/'source-footprints.json').read_text())['cases']
try:
 for mode,theme in modes.items():
  for width in [390,1164]:
   call('set','viewport',str(width),'1000')
   call('network','route','*widget.js*','--abort')
   call('open','http://localhost:6121/iframe.html?id=components-footer--default&viewMode=story&globals=theme:'+quote(theme));raw=call('eval','--stdin',stdin=(out/'capture.js').read_text());cases[f'{mode}-script-load-error-{width}']=json.loads(raw)
   call('network','unroute','*widget.js*')
   (out/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},indent=2))
finally:
 (out/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},indent=2));call('close')
