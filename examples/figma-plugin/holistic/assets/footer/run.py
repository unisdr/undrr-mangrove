import subprocess,json,pathlib,time
out=pathlib.Path('/tmp/mangrove-footer-source-20261006');session=(out/'session.txt').read_text().strip()
def call(*a,stdin=None):
 p=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(out/'capture.log').open('a').write(' '.join(a)+'\n'+p.stdout+p.stderr);p.check_returncode();return p.stdout
modes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
cases={}
try:
 for mode,theme in modes.items():
  for width in [390,1164]:
   call('set','viewport',str(width),'1000')
   for story in ['default','with-complementary-content','no-syndication','custom-syndication-config']:
    from urllib.parse import quote
    url='http://localhost:6121/iframe.html?id=components-footer--'+story+'&viewMode=story&globals=theme:'+quote(theme)
    call('open',url);raw=call('eval','--stdin',stdin=(out/'capture.js').read_text());case=json.loads(raw);key=f'{mode}-{story}-{width}';cases[key]=case;print(key,case['tree'][0]['rect']['height'],flush=True)
   call('network','route','**/publish.preventionweb.net/widget.js*','--abort')
   call('open','http://localhost:6121/iframe.html?id=components-footer--default&viewMode=story&globals=theme:'+quote(theme));raw=call('eval','--stdin',stdin=(out/'capture.js').read_text());cases[f'{mode}-script-load-error-{width}']=json.loads(raw)
   call('network','unroute','**/publish.preventionweb.net/widget.js*')
   (out/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},indent=2))
finally:
 (out/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},indent=2));call('close')
