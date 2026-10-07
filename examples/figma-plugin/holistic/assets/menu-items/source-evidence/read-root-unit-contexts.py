import pathlib,json,subprocess
P=pathlib.Path(__file__).parent;u=json.loads((P/'server.json').read_text())['url'];session='mangrove-menu-items-preview-context-tag'
def run(*args):
 r=subprocess.run(['agent-browser','--session',session,*args],capture_output=True,text=True)
 if r.returncode:
  assert args[0]=='open' and 'Operation timed out' in (r.stdout+r.stderr),r
  observed=subprocess.run(['agent-browser','--session',session,'get','url'],capture_output=True,text=True,check=True).stdout.strip();assert observed==args[1]
  with (P/'root-unit-navigation-timeout-observations.log').open('a') as log:log.write(json.dumps({'requestedURL':args[1],'observedURL':observed,'error':r.stdout+r.stderr})+'\n')
 return r.stdout
rows={}
for brand in ['undrr','delta','irp','mcr','preventionweb']:
 for script in ['english','arabic']:
  for width in [390,1164]:
   run('set','viewport',str(width),'420','1');run('open',u+'/?brand='+brand+'&script='+script)
   r=json.loads(run('eval','--json','document.fonts.ready.then(()=>({rootFontSize:getComputedStyle(document.documentElement).fontSize,lang:document.documentElement.lang,dir:document.documentElement.dir,selectedPadding:getComputedStyle(document.querySelector("a.selected")).paddingBottom,spacingToken:getComputedStyle(document.documentElement).getPropertyValue("--mg-spacing-25"),letterSpacing:getComputedStyle(document.querySelector("a")).letterSpacing,bodyClasses:[...document.body.classList],i18n:window.menuLocaleObservation,canvasLang:document.getElementById("storybook-root").lang,canvasDir:document.getElementById("storybook-root").dir}))'))
   assert r['success'];assert r['data']['result']['bodyClasses']==([] if brand=='undrr' else ['mg-theme-'+brand]);assert r['data']['result']['i18n']['locale']==('ar' if script=='arabic' else 'en');rows[brand+'-'+script+'-'+str(width)]=r['data']['result']
(P/'root-unit-contexts.json').write_text(json.dumps({'scope':'Fresh readonly same controlled fixture root rem resolution after full capture; no raw historical capture changes','contexts':rows},indent=2)+'\n');run('close');print(len(rows),'root contexts read')
