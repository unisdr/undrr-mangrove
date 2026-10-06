import pathlib,subprocess,json
from urllib.parse import quote
from PIL import Image
p=pathlib.Path('/tmp/mangrove-layout-foundations-source-20261006');session='notice-layout-paint-proof-d6cea725ad81';rows=[]
def call(*a,stdin=None):
 r=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(p/'paint-proof-browser.log').open('a').write(' '.join(a)+'\n'+r.stderr);r.check_returncode();return r.stdout
s=json.load(open(p/'source-footprints.json'))['cases'];assert len(s)==155
try:
 for mode,theme in {'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}.items():
  for locale in ['english','arabic']:
   for width in [390,1164]:
    story='components-fullwidth--blocked-by-ancestor-background';key=f'{mode}-{locale}-{story}-{width}';url='http://localhost:6121/iframe.html?id='+story+'&viewMode=story&globals='+quote('theme:'+theme+';locale:'+locale);call('set','viewport',str(width),'1200');call('open',url);call('wait','#storybook-root');c=json.loads(call('eval','--stdin',stdin=(p/'capture.js').read_text()));before=s[key]['tree'];assert all(a['rect']==b['rect'] for a,b in zip(before,c['tree'])),key
    png=p/(key+'-source.png');call('screenshot',str(png));im=Image.open(png).convert('RGB');bands=[n for n in c['tree'] if n['classes']=='mg-container-full-width'];assert len(bands)==3;checks=[]
    for i,n in enumerate(bands):
     y=int(n['rect']['y']+n['rect']['height']/2);pixels=[im.getpixel((x,y)) for x in range(width)];green=[x for x,color in enumerate(pixels) if color==(46,125,50)];checks.append({'sourceIndex':n['index'],'sourceOwner':n['rect'],'sourcePseudo':{k:n['pseudoBefore'][k] for k in ['width','height','margin-left','margin-right','left','z-index','background-color']},'scanY':y,'greenMinX':min(green) if green else None,'greenMaxX':max(green) if green else None,'outerLeftPixel':pixels[0],'outerRightPixel':pixels[-1],'expectedVisibleGreenMinX':round(n['rect']['x']) if i==0 else max(0,round(n['rect']['x']+float(n['pseudoBefore']['left'][:-2])+float(n['pseudoBefore']['margin-left'][:-2]))),'expectedVisibleGreenMaxX':round(n['rect']['right'])-1 if i==0 else min(width-1,round(n['rect']['x']+float(n['pseudoBefore']['left'][:-2])+float(n['pseudoBefore']['margin-left'][:-2])+float(n['pseudoBefore']['width'][:-2]))-1)})
    assert all(c['greenMinX']==c['expectedVisibleGreenMinX'] and c['greenMaxX']==c['expectedVisibleGreenMaxX'] for c in checks),checks
    rows.append({'key':key,'sourceDOMGeometryExact':True,'png':png.name,'checks':checks});print(key,'blocked/transparent/isolate actual computed source paint bounds pass',flush=True)
finally:
 (p/'full-width-paint-proof.json').write_text(json.dumps({'sourceOnly':True,'rows':rows,'nativeAccepted':False},indent=2)+'\n');call('close')
