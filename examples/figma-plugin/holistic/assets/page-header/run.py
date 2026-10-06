import subprocess,json,pathlib,time
from urllib.parse import quote
out=pathlib.Path('/tmp/mangrove-page-header-source-20261006');session=(out/'session.txt').read_text().strip()
def call(*a,stdin=None):
 p=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(out/'capture.log').open('a').write(' '.join(a)+'\n'+p.stdout+p.stderr);p.check_returncode();return p.stdout
modes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
contexts=[]
for story in ['default','decoration-only','with-custom-languages','with-language-links','with-many-language-links','with-custom-class','locale-driven-logo']:
 for width in [390,1164]:contexts.append({'key':story+'-'+str(width),'story':story,'width':width,'locale':'english','args':None})
for locale in ['spanish','arabic','french','russian','chinese','japanese']:
 for width in [390,1164]:contexts.append({'key':'default-'+locale+'-'+str(width),'story':'default','width':width,'locale':locale,'args':None})
for flags in [{'key':'no-logo','args':'showLogo:false'},{'key':'no-account','args':'showAccount:false'},{'key':'no-language','args':'showLanguage:false'},{'key':'logo-only','args':'showAccount:false;showLanguage:false'},{'key':'controls-only','args':'showLogo:false'},{'key':'empty-toolbar','args':'showLogo:false;showAccount:false;showLanguage:false'}]:
 for width in [390,1164]:contexts.append({'key':flags['key']+'-'+str(width),'story':'default','width':width,'locale':'english','args':flags['args']})
for story,widths in [('with-language-links',[899,900,901]),('default',[1199,1200,1201])]:
 for width in widths:contexts.append({'key':story+'-'+str(width),'story':story,'width':width,'locale':'english','args':None})
cases={}
try:
 call('network','har','start')
 for mode,theme in modes.items():
  for context in contexts:
   call('set','viewport',str(context['width']),'1000')
   url='http://localhost:6121/iframe.html?id=components-pageheader--'+context['story']+'&viewMode=story&globals='+quote('theme:'+theme+';locale:'+context['locale'])
   if context['args']:url+='&args='+quote(context['args'])
   call('open',url);raw=call('eval','--stdin',stdin=(out/'capture.js').read_text());case=json.loads(raw);case['context']=context;key=mode+'-'+context['key'];cases[key]=case;print(key,case['tree'][0]['rect']['height'],case['rootLanguage'],flush=True)
   (out/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')))
 call('network','har','stop',str(out/'all-contexts.har'))
finally:
 (out/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')));call('close')
