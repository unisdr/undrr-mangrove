import subprocess,json,pathlib
from urllib.parse import quote
p=pathlib.Path('/tmp/mangrove-image-figure-source-20261006');session='notice-image-credit-proof-d6cea725ad81';cases={};(p/'credit-proof-session.txt').write_text(session)
def call(*a,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(p/'credit-proof-capture.log').open('a').write(' '.join(a)+'\n'+r.stderr);r.check_returncode();return r.stdout
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
    for content,caption,credit in [('both',True,True),('credit',False,True)]:
     call('check' if caption else 'uncheck','#control-caption');call('check' if credit else 'uncheck','#control-credit')
     actual=evaluate("({size:document.querySelector('input[name=control-size]:checked').value,caption:document.querySelector('#control-caption').checked,credit:document.querySelector('#control-credit').checked})")
     assert actual=={'size':size,'caption':caption,'credit':credit}
     for width in [390]:
      call('eval',"(()=>{const frame=document.querySelector('#storybook-preview-iframe');for(const k of ['width','min-width','max-width'])frame.style.setProperty(k,'"+str(width)+"px','important');return true})()")
      c=evaluate((p/'credit-flex-mirror.js').read_text());key=f'{mode}-{locale}-{size}-{content}-{width}';c['context']={'mode':mode,'locale':locale,'size':size,'content':content,'width':width,'sourceArgs':actual,'sourceManagerURL':url};cases[key]=c;print(key,c['organization']['rect']['width'],c['organization']['rect']['height'],flush=True)
      (p/'credit-flex-proof-cases.ndjson').open('a').write(json.dumps({'key':key,'case':c},separators=(',',':'))+'\n')
      (p/'credit-flex-proof.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')))
 call('network','har','stop',str(p/'credit-proof.har'))
finally:
 (p/'credit-flex-proof.json').write_text(json.dumps({'sourceOnly':True,'cases':cases},separators=(',',':')));call('close')
