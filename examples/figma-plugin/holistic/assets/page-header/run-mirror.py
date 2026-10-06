import subprocess,json,pathlib
out=pathlib.Path('/tmp/mangrove-page-header-source-20261006');session=(out/'session.txt').read_text().strip();source=json.load(open(out/'source-footprints.json'))['cases']
def call(*a,stdin=None):
 p=subprocess.run(['agent-browser','--session',session,*a],input=stdin,text=True,capture_output=True);(out/'mirror.log').open('a').write(' '.join(a)+'\n'+p.stdout+p.stderr);p.check_returncode();return p.stdout
mirrors={}
try:
 call('network','har','start','--content','all')
 for key,case in source.items():
  call('set','viewport',str(case['viewport']['width']),'1000');call('open',case['url']);raw=call('eval','--stdin',stdin=(out/'mirror.js').read_text());value=json.loads(raw);mirrors[key]=value;print(key,len(value['masks']),flush=True)
  (out/'mask-mirrors.json').write_text(json.dumps({'sourceOnly':True,'cases':mirrors},separators=(',',':')))
 call('network','har','stop',str(out/'all-body-mask-captures.har'))
finally:
 (out/'mask-mirrors.json').write_text(json.dumps({'sourceOnly':True,'cases':mirrors},separators=(',',':')));call('close')
