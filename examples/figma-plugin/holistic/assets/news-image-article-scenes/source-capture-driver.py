import subprocess,pathlib,json
b=pathlib.Path('/tmp/mangrove-news-image-article-scenes-source-20261006');session='mangrove-news-image-article-scenes-20261006';cases={}
themes={'undrr':'Global UNDRR Theme','delta':'DELTA Resilience Theme','irp':'IRP Theme','mcr':'MCR2030 Theme','preventionweb':'PreventionWeb Theme'}
def cmd(*args,stdin=None):return subprocess.run(['agent-browser','--session',session,*args],input=stdin,text=True,capture_output=True,check=True).stdout
try:
 for treatment in ['large-image','compact-image','alternate-hero-image','split-hero']:
  for mode,theme in themes.items():
   for width in [390,1164]:
    key=f'{mode}-{treatment}-{width}';cmd('set','viewport',str(width),'1000');cmd('open','http://localhost:6121/iframe.html?id=patterns-article-story--'+treatment+'&viewMode=story&globals=theme:'+theme.replace(' ','%20')+';locale:english')
    cmd('wait','--fn',"document.querySelector('.mg-reading__article iframe') !== null")
    data=json.loads(cmd('eval','--stdin',stdin=(b/'capture.js').read_text()));assert all(i['complete'] and i['naturalWidth']>0 for i in data['images']);cases[key]=data;(b/(key+'.json')).write_text(json.dumps(data,indent=2)+'\n');print(key,data['documentHeight'],flush=True)
 (b/'source-footprints.json').write_text(json.dumps({'scope':'Actual source four image-bearing ArticleStory complete wrappers, never inferred NoHero shifts','cases':cases},indent=2)+'\n')
finally:cmd('close')
