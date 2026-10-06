import subprocess,pathlib,json
b=pathlib.Path('/tmp/mangrove-code-block-source-20261006');session='mangrove-code-block-source-20261006';cases={}
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
stories=['plain','with-language','with-filename','with-filename-and-language','with-line-numbers','with-line-numbers-and-filename']
def cmd(*args,stdin=None):return subprocess.run(['agent-browser','--session',session,*args],input=stdin,text=True,capture_output=True,check=True).stdout
try:
 for story in stories:
  for mode,theme in themes.items():
   for width in [390,1164]:
    key=f'{mode}-{story}-{width}';cmd('set','viewport',str(width),'1000');cmd('open','http://localhost:6121/iframe.html?id=components-codeblock--'+story+'&viewMode=story&globals=theme:'+theme.replace(' ','%20')+';locale:english');cmd('wait','--fn',"document.querySelector('#storybook-root pre > code') !== null");cmd('mouse','move','0','0');data=json.loads(cmd('eval','--stdin',stdin=(b/'capture.js').read_text()));cases[key]=data;(b/(key+'.json')).write_text(json.dumps(data,indent=2)+'\n');print(key,data['scroll'],flush=True)
    if width==390 and data['scroll']['width']>data['scroll']['clientWidth']:
     cmd('eval',"document.querySelector('#storybook-root pre').scrollLeft = document.querySelector('#storybook-root pre').scrollWidth");cmd('wait','100');end=json.loads(cmd('eval','--stdin',stdin=(b/'capture.js').read_text()));cases[key+'-scroll-end']=end;(b/(key+'-scroll-end.json')).write_text(json.dumps(end,indent=2)+'\n')
 (b/'source-footprints.json').write_text(json.dumps({'scope':'Actual six authored CodeBlock stories plus genuine overflowing narrow scroll-end states','cases':cases},indent=2)+'\n')
finally:cmd('close')
