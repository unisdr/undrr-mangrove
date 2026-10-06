from pathlib import Path
import json,hashlib,runpy,tempfile,shutil,subprocess,sys
b=Path(__file__).parent
p=json.loads((b/'provenance.json').read_text())
for item in p['files']:
 raw=(b/item['path']).read_bytes()
 assert len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256'],item['path']
subprocess.run([sys.executable,str(b/'foundation-readback/mock-independent-comparison-tag.py')],check=True)
frozen=b/'foundation-readback/independent-actual-source-verdict-tag-20261006.json'
work=Path(tempfile.mkdtemp(prefix='mangrove-horizontal-foundation-replay-'))
(work/'foundation-import').mkdir();(work/'foundation-readback').mkdir()
shutil.copyfile(b/'foundation-import/source-document.json',work/'foundation-import/source-document.json')
for name in ['independent-compare-source-tag.py']+[f'actual-part{i}-native-tool.json' for i in range(1,7)]:
 shutil.copyfile(b/'foundation-readback'/name,work/'foundation-readback'/name)
runpy.run_path(str(work/'foundation-readback/independent-compare-source-tag.py'))
assert (work/'foundation-readback/independent-actual-source-verdict-tag-20261006.json').read_bytes()==frozen.read_bytes(),'Recomputed actual-source comparison differs from frozen verdict'
for item in p['files']:
 raw=(b/item['path']).read_bytes()
 assert len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256'],item['path']
print(json.dumps({'accepted':True,'exactPinnedFiles':len(p['files']),'recomputedVerdictExact':True,'archiveWrites':False,'retainedReplayDirectory':str(work),'nativeWrites':False}))
