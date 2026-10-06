import subprocess,pathlib,json
b=pathlib.Path('/tmp/mangrove-tree-source-20261006');session='mangrove-tree-source-20261006';cases={}
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
contexts={'default':'default','default-collapsed':'default','default-expanded':'default','with-links':'with-links','with-links-hover':'with-links','custom-toggle-icon':'custom-toggle-icon','hydrated-from-html':'hydrated-from-html'}
def cmd(*args,stdin=None):return subprocess.run(['agent-browser','--session',session,*args],input=stdin,text=True,capture_output=True,check=True).stdout
try:
 for context,story in contexts.items():
  for mode,theme in themes.items():
   for width in [390,1164]:
    key=f'{mode}-{context}-{width}';cmd('set','viewport',str(width),'1000');cmd('open','http://localhost:6121/iframe.html?id=components-navigation-tree--'+story+'&viewMode=story&globals=theme:'+theme.replace(' ','%20')+';locale:english');cmd('wait','--fn',"document.querySelector('.mg-tree__label') !== null");cmd('mouse','move','0','0')
    if context=='default-collapsed':cmd('click','[data-mg-treeitem-id="sendai"] > .mg-tree__label-container > button')
    if context=='default-expanded':cmd('click','[data-mg-treeitem-id="hazards"] > .mg-tree__label-container > button')
    if context=='with-links-hover':cmd('hover','[data-mg-treeitem-id="priorities"] > .mg-tree__label-container > a')
    if context!='with-links-hover':cmd('mouse','move','0','0')
    cmd('wait','200')
    data=json.loads(cmd('eval','--stdin',stdin=(b/'capture.js').read_text()));cases[key]=data;(b/(key+'.json')).write_text(json.dumps(data,indent=2)+'\n');print(key,data['root']['rect']['height'],len(data['items']),flush=True)
 (b/'source-footprints.json').write_text(json.dumps({'scope':'Actual Tree authored initial stories and supported source toggled/hovered states, allfive390/1164','cases':cases},indent=2)+'\n')
finally:cmd('close')
