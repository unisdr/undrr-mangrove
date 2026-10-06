import pathlib,subprocess,json
from urllib.parse import quote
p=pathlib.Path('/tmp/mangrove-semantic-typography-source-20261006');session='notice-semantic-typography-d6cea725ad81';cases={}
def call(*a,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(p/'browser.log').open('a').write(' '.join(a)+'\n'+r.stderr);r.check_returncode();return r.stdout
def evaluate(s):return json.loads(call('eval','--stdin',stdin=s))
stories=['heading','paragraph','small','cite','hr','list-ordered','list-unordered','list-description','figcaption','quotation','mark','code','abbreviation']
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
try:
 call('frame','main');call('set','viewport','1600','1500')
 for mode,theme in themes.items():
  for locale in ['english','arabic','japanese']:
   for kind in stories:
    story='components-typography--typography-'+kind;url='http://localhost:6121/?path=/story/'+story+'&globals='+quote('theme:'+theme+';locale:'+locale);call('open',url);call('wait','#storybook-preview-iframe');call('wait','--fn','document.querySelector("#storybook-preview-iframe").contentDocument?.querySelector("#storybook-root")?.children.length>0')
    for size in (['','150','200','250','300','400','500','600','800','900'] if kind=='paragraph' else [None]):
     if kind=='paragraph':call('wait','#control-size');call('select','#control-size',size)
     for width in [390,1164]:
      call('eval','(()=>{const frame=document.querySelector("#storybook-preview-iframe");for(const k of ["width","min-width","max-width"])frame.style.setProperty(k,"'+str(width)+'px","important");return true})()')
      capture=(p/'capture.js').read_text().replace('(async()=>{','(async()=>{const sourceFrame=globalThis.document.querySelector("#storybook-preview-iframe"),document=sourceFrame.contentDocument,sourceWindow=sourceFrame.contentWindow,getComputedStyle=sourceWindow.getComputedStyle.bind(sourceWindow),location=sourceWindow.location,innerWidth=sourceWindow.innerWidth,innerHeight=sourceWindow.innerHeight,performance=sourceWindow.performance;')
      c=evaluate(capture);assert c['viewport']['width']==width;assert c['rootLanguage']['lang']=={'english':'en','arabic':'ar','japanese':'ja'}[locale]
      if kind=='paragraph':assert c['tree'][1]['classes']==('mg-u-font-size-'+size if size else '')
      for n in c['tree']:
       if n['image']:assert n['image']['complete'] and n['image']['naturalWidth']>0
      treatment=kind+('-size-'+(size or 'default') if size is not None else '')
      c['sourceContext']={'kind':kind,'locale':locale,'viewport':width,'paragraphSize':size,'sourceManagerURL':url,'method':'Actual Storybook Controls select for paragraph size and actual preview iframe width/min/max allocation. No source content DOM rewrite.'}
      key=f'{mode}-{locale}-{treatment}-{width}';cases[key]=c;print(key,c['tree'][0]['rect']['height'],flush=True);(p/'source-cases.ndjson').open('a').write(json.dumps({'key':key,'case':c},separators=(',',':'))+'\n')
      if len(cases)%30==0:(p/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')))
finally:
 (p/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')));call('close')
