import subprocess,json,pathlib
from urllib.parse import quote
p=pathlib.Path('/tmp/mangrove-image-figure-source-20261006');session='notice-image-figure-d6cea725ad81';cases={};(p/'session.txt').write_text(session)
def call(*a,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(p/'capture.log').open('a').write(' '.join(a)+'\n'+r.stderr);r.check_returncode();return r.stdout
def evaluate(js):return json.loads(call('eval','--stdin',stdin=js))
try:
 call('frame','main');call('network','har','start','--content','all');call('set','viewport','1600','1400')
 for mode,theme in {'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}.items():
  for locale in ['english','arabic','japanese']:
   url='http://localhost:6121/?path=/story/components-images-image-with-credit-caption--default-image-with-credit-caption&globals='+quote('theme:'+theme+';locale:'+locale);call('frame','main');call('open',url);call('wait','#control-size-0')
   controls=evaluate("({caption:!!document.querySelector('#control-caption'),credit:!!document.querySelector('#control-credit')})")
   for field in ['caption','credit']:
    if not controls[field]:call('click','#set-'+field)
   for size in ['wide','medium','portrait']:
    call('click',{'wide':'#control-size-0','medium':'#control-size-1','portrait':'#control-size-2'}[size])
    for content,caption,credit in [('both',True,True),('caption',True,False),('credit',False,True),('media-only',False,False)]:
     call('check' if caption else 'uncheck','#control-caption');call('check' if credit else 'uncheck','#control-credit')
     actual=evaluate("({size:document.querySelector('input[name=control-size]:checked').value,caption:document.querySelector('#control-caption').checked,credit:document.querySelector('#control-credit').checked})")
     assert actual=={'size':size,'caption':caption,'credit':credit}
     for width in [390,1164]:
      call('eval',"(()=>{const frame=document.querySelector('#storybook-preview-iframe');for(const k of ['width','min-width','max-width'])frame.style.setProperty(k,'"+str(width)+"px','important');return true})()")
      capture=(p/'capture.js').read_text().replace('(async()=>{','(async()=>{const sourceFrame=globalThis.document.querySelector("#storybook-preview-iframe"),document=sourceFrame.contentDocument,sourceWindow=sourceFrame.contentWindow,getComputedStyle=sourceWindow.getComputedStyle.bind(sourceWindow),location=sourceWindow.location,innerWidth=sourceWindow.innerWidth,innerHeight=sourceWindow.innerHeight,performance=sourceWindow.performance;');c=evaluate(capture)
      key=f'{mode}-{locale}-{size}-{content}-{width}';assert c['viewport']['width']==width
      root=c['tree'][0];assert ('mg-image-figcaption--'+size in root['classes'])==(size!='wide')
      imgs=[n for n in c['tree'] if n['image']];assert len(imgs)==1;im=imgs[0]['image'];assert im['complete'];suffix={'wide':'lg','medium':'md','portrait':'sm'}[size];assert im['currentSrc'].endswith('sample_image-'+suffix+'.jpg')
      assert any(n['classes']=='mg-image-caption' for n in c['tree'])==(caption or credit)
      assert any(n['tag']=='P' for n in c['tree'])==caption
      assert any(n['classes']=='mg-credits' for n in c['tree'])==credit
      assert c['rootLanguage']['html']=={'english':'en','arabic':'ar','japanese':'ja'}[locale]
      c['context']={'locale':locale,'size':size,'content':content,'width':width,'sourceArgs':actual,'sourceManagerURL':url,'allocationMethod':'Actual Storybook Controls UI plus preview-iframe width/min-width/max-width CSS allocation; actual innerWidth recorded. No source component DOM rewrite.'};cases[key]=c;print(key,root['rect']['width'],root['rect']['height'],im['naturalWidth'],flush=True)
      (p/'source-cases.ndjson').open('a').write(json.dumps({'key':key,'case':c},separators=(',',':'))+'\n')
      if len(cases)%30==0:(p/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')))
 call('network','har','stop',str(p/'source.har'))
finally:
 (p/'source-footprints.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')));call('close')
