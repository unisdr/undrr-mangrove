import json,subprocess,pathlib,sys
p=pathlib.Path('/tmp/mangrove-cookie-consent-source-20261006');session='mangrove-cookie-consent-source-20261006'
def cli(*args,js=None):
 r=subprocess.run(['agent-browser','--session',session,*args],input=js,text=True,capture_output=True)
 if r.returncode:raise RuntimeError(r.stderr+r.stdout)
 return r.stdout
modes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
source=json.loads((p/'config.json').read_text());configs={'cdn':source,'fallback':json.loads((p/'local-fallback-config.json').read_text()),'custom':json.loads((p/'custom-story-config.json').read_text())};cases={};errors=[]
try:
 for mode,theme in modes.items():
  for width in [390,1164]:
   cli('set','viewport',str(width),'1000');cli('open','http://localhost:6121/iframe.html?id=components-notice-cookieconsentbanner--rendering-check&viewMode=story&globals=theme:'+theme)
   cli('wait','--fn','!!document.querySelector("#cc-main .cm") && getComputedStyle(document.querySelector(".cm")).visibility === "visible"')
   for config,cfg in configs.items():
    if config!='cdn':
     cfg={**cfg,'hideFromBots':False};cli('eval','--stdin',js='(async()=>{CookieConsent.reset(true);await CookieConsent.run('+json.dumps(cfg)+');await new Promise(r=>setTimeout(r,400));return {main:!!document.querySelector("#cc-main"),inputConfig:'+json.dumps(cfg)+'}})()')
    for state in ['consent','preferences','necessary-expanded','analytics-on-expanded','preferences-bottom']:
     action='({ok:true})'
     if state=='preferences':action='(()=>{CookieConsent.showPreferences();return {ok:true}})()'
     if state=='necessary-expanded':action='(()=>{let n=document.querySelector("[aria-controls=necessary-desc]");if(!n)return {error:"No source necessary-expansion control"};n.click();return{ok:true}})()'
     if state=='analytics-on-expanded':action='(()=>{let n=document.querySelector("[aria-controls=analytics-desc]");if(!n)return{error:"No source analytics-expansion control"};n.click();let t=document.querySelector("input[value=analytics]")||document.querySelector("input[data-category=analytics]");if(t&&!t.checked)t.click();return{ok:true,toggle:!!t}})()'
     if state=='preferences-bottom':action='(()=>{let n=document.querySelector(".pm__body");if(!n)return{error:"No source preference body"};n.scrollTop=n.scrollHeight;return{ok:true,top:n.scrollTop}})()'
     try:
      result=json.loads(cli('eval','--stdin',js=action));a=json.loads(cli('eval','--stdin',js=(p/'capture.js').read_text()));a.update({'mode':mode,'configuration':config,'state':state,'actionResult':result,'visualProxyOverride':None if config=='cdn' else {'hideFromBots':False},'sourceConfig':configs[config]});key=f'{mode}-{config}-{state}-{width}';cases[key]=a;(p/(key+'.json')).write_text(json.dumps(a,separators=(',',':')));print(key,len(a['tree']),flush=True)
     except Exception as e:errors.append({'mode':mode,'width':width,'config':config,'state':state,'error':str(e)});print('ERROR',config,state,str(e),flush=True);break
 (p/'source-footprints.json').write_text(json.dumps({'scope':'Actual CDN RenderingCheck and exact source fallback/custom visual proxies with sole bot-visibility override','cases':cases,'errors':errors},separators=(',',':')))
finally:cli('close')
