import json, pathlib, urllib.request, hashlib
p=pathlib.Path('/tmp/mangrove-page-header-source-20261006');dst=p/'http-bodies';dst.mkdir(exist_ok=True)
urls={
 'toolbar-background.png':'https://www.undrr.org/themes/custom/undrr_common/images/toolbar-background.png',
 'undrr-logo-horizontal.svg':'https://assets.undrr.org/logos/undrr/undrr-logo-horizontal.svg',
 **{f'undrr-logo-{l}-white.svg':f'https://assets.undrr.org/logos/undrr/undrr-logo-{l}-white.svg' for l in ['es','ar','fr','ru','zh']},
 'Roboto-Regular.woff2':'https://assets.undrr.org/fonts/roboto/v1.0.0/Regular/Roboto-Regular.woff2?v=2.137',
 'Roboto-Bold.woff2':'https://assets.undrr.org/fonts/roboto/v1.0.0/Bold/Roboto-Bold.woff2?v=2.137',
}
manifest={}
for filename,url in urls.items():
 req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Cache-Control':'no-cache'})
 with urllib.request.urlopen(req,timeout=90) as r:
  b=r.read(); (dst/filename).write_bytes(b);manifest[filename]={'url':url,'status':r.status,'headers':dict(r.headers),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'retrieval':'Separate HTTP body retrieval after browser completed source captures; browser HAR cache bodies empty.'}
 print(filename,len(b),flush=True)
(dst/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
