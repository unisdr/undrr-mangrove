import pathlib,subprocess,json
from urllib.parse import quote
p=pathlib.Path('/tmp/mangrove-layout-foundations-source-20261006');session='notice-layout-foundations-d6cea725ad81';cases={}
def call(*a,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(p/'browser.log').open('a').write(' '.join(a)+'\n'+r.stderr);r.check_returncode();return r.stdout
stories=['design-decisions-container--default','design-decisions-container--padded-variant','design-decisions-grid-layout--default-grid','components-fullwidth--default-full-width','components-fullwidth--blocked-by-ancestor-background']
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
try:
 for mode,theme in themes.items():
  for locale in ['english','arabic']:
   for story in stories:
    widths=[390,1164]
    if mode=='undrr' and locale=='english':widths=sorted(set(widths+[479,480,481,899,900,901,1163,1165,1439,1440,1441]))
    for width in widths:
     call('set','viewport',str(width),'1200');url='http://localhost:6121/iframe.html?id='+story+'&viewMode=story&globals='+quote('theme:'+theme+';locale:'+locale);call('open',url);call('wait','#storybook-root');c=json.loads(call('eval','--stdin',stdin=(p/'capture.js').read_text()));assert c['viewport']['width']==width;assert c['rootLanguage']['lang']==('ar' if locale=='arabic' else 'en');key=f'{mode}-{locale}-{story}-{width}';cases[key]=c;print(key,c['tree'][0]['rect']['height'],flush=True);(p/'source-cases.ndjson').open('a').write(json.dumps({'key':key,'case':c},separators=(',',':'))+'\n')
    (p/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')))
finally:
 (p/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')));call('close')
