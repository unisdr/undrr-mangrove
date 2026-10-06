import subprocess,json,pathlib
b=pathlib.Path('/tmp/mangrove-error-page-source-20261006');session='mangrove-error-page-source-20261006';cases={}
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
stories=['not-found-404','forbidden-403','too-many-requests-429','bad-gateway-502','service-unavailable-503','internal-server-error-500','gateway-timeout-504','unauthorized-401','interactive-challenge','managed-challenge']
def cmd(*args,stdin=None):return subprocess.run(['agent-browser','--session',session,*args],input=stdin,text=True,capture_output=True,check=True).stdout
try:
 for story in stories:
  for mode,theme in themes.items():
   for width in [390,1164]:
    key=f'{mode}-{story}-{width}';cmd('set','viewport',str(width),'1000');cmd('open','http://localhost:6121/iframe.html?id=components-error-pages--'+story+'&viewMode=story&globals=theme:'+theme.replace(' ','%20')+';locale:english');cmd('wait','--fn',"document.querySelector('#storybook-root .mg-error-page') !== null");cmd('mouse','move','0','0');data=json.loads(cmd('eval','--stdin',stdin=(b/'capture.js').read_text()));cases[key]=data;(b/(key+'.json')).write_text(json.dumps(data,indent=2)+'\n');print(key,len(data['tree']),len(data['paragraphs']),flush=True)
    if mode=='undrr' and story in ['not-found-404','interactive-challenge']:cmd('screenshot',str(b/(key+'.png')))
 (b/'source-footprints.json').write_text(json.dumps({'scope':'Ten actual React ErrorPage stories, all5 themes and390/1164 with1000px source viewport height','cases':cases},indent=2)+'\n')
finally:cmd('close')
