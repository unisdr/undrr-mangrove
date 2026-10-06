import subprocess,json,pathlib
from urllib.parse import quote
p=pathlib.Path('/tmp/mangrove-page-header-source-20261006');session=(p/'session.txt').read_text().strip();cases={};mirrors={}
def call(*a,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(p/'boundary-driver.log').open('a').write(r.stderr);r.check_returncode();return r.stdout
try:
 for mode,theme in {'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}.items():
  for width in [1163,1165]:
   context={'key':'default-'+str(width),'story':'default','width':width,'locale':'english','args':None};k=mode+'-'+context['key'];url='http://localhost:6121/iframe.html?id=components-pageheader--default&viewMode=story&globals='+quote('theme:'+theme+';locale:english');call('set','viewport',str(width),'1000');call('open',url);c=json.loads(call('eval','--stdin',stdin=(p/'capture.js').read_text()));c['context']=context;cases[k]=c;mirrors[k]=json.loads(call('eval','--stdin',stdin=(p/'mirror.js').read_text()));print(k,flush=True)
finally:
 call('close');(p/'boundary-source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')));(p/'boundary-mask-mirrors.json').write_text(json.dumps({'sourceOnly':True,'cases':mirrors},separators=(',',':')))
