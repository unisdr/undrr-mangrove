"""Replay captured source evidence without browsers, Figma or archive writes."""
from pathlib import Path
import collections,gzip,hashlib,json,subprocess,sys,tarfile,tempfile
b=Path(__file__).resolve().parent
manifest=json.loads((b/'provenance.json').read_text())
def check(p,item):
 raw=p.read_bytes(); assert len(raw)==item['bytes'] and hashlib.sha256(raw).hexdigest()==item['sha256'],str(p)
def verify():
 for item in manifest['files']:check(b/item['path'],item)
verify()
work=Path(tempfile.mkdtemp(prefix='mangrove-generated-source-replay-'))
expected={r['path']:r for r in manifest['rawEntries']};seen=set()
for label in ['ink','geometry']:
 with tarfile.open(b/(label+'-raw.tar.gz'),'r:gz') as tar:
  for member in tar:
   assert member.isfile() and member.name in expected and member.name not in seen,member.name
   assert Path(member.name).parts[0]==label and len(Path(member.name).parts)==2,member.name
   p=work/member.name;p.parent.mkdir(exist_ok=True);p.write_bytes(tar.extractfile(member).read());check(p,expected[member.name]);seen.add(member.name)
assert seen==set(expected)
base=b/'accepted-source-footprints.json.gz';encoded=json.loads(gzip.decompress(base.read_bytes()))
def expand(v):
 if isinstance(v,list):return [expand(x) for x in v]
 if isinstance(v,dict):
  if list(v)==['$sourceStyle']:return encoded['styles'][v['$sourceStyle']]
  return {k:expand(x) for k,x in v.items()}
 return v
baseline=expand(encoded['data'])['cases']
keys={f'{brand}-{locale}-{kind}-{width}' for brand in ['undrr','delta','irp','mcr','preventionweb'] for locale in ['english','arabic','japanese'] for kind in ['quotation','list-ordered','list-unordered'] for width in [390,1164]}
assert {p.name[:-9] for p in (work/'ink').glob('*-dom.json')}==keys
assert {p.name[:-16] for p in (work/'geometry').glob('*-diagnostic.json')}==keys
fields=['html','tree','text','viewport','rootLanguage']
for key in sorted(keys):
 dom=json.loads((work/'ink'/(key+'-dom.json')).read_text())
 diag=json.loads((work/'geometry'/(key+'-diagnostic.json')).read_text())
 assert diag['key']==key and diag['allRecordedSourceFieldsExact'] is True
 for field in fields:assert dom[field]==diag['before'][field]==diag['after'][field]==baseline[key][field],(key,field)
 for owner in diag['geometry']['records']:
  chars=owner['characters'].encode('utf-16-le');previous=0
  for segment in owner['segments']:
   assert segment['start']==previous and chars[2*segment['start']:2*segment['end']].decode('utf-16-le')==segment['characters'],key
   previous=segment['end'];offset=segment['start']
   for char in segment['characterRects']:
    assert char['start']==offset and chars[2*char['start']:2*char['end']].decode('utf-16-le')==char['characters'],key
    offset=char['end']
   assert offset==segment['end'],key
  assert previous*2==len(chars),key
# The historical comparator uses one absolute baseline path. Relocate that
# exact literal in the disposable replay copy; archive and capture bytes stay exact.
ink=work/'ink';code=(ink/'compare.py').read_text()
old="/Users/khawkins/Documents/git/drupal-base/.ddev/related-repos/undrr-mangrove/examples/figma-plugin/holistic/assets/semantic-inline/source-footprints.json.gz"
assert code.count(old)==1;proof=(ink/'generated-ink-source-proof.json').read_bytes()
(ink/'compare.py').write_text(code.replace(old,str(base)))
subprocess.run([sys.executable,str(ink/'compare.py')],check=True)
assert (ink/'generated-ink-source-proof.json').read_bytes()==proof
geometry=work/'geometry';proof=(geometry/'geometry-source-proof.json').read_bytes()
subprocess.run([sys.executable,str(geometry/'summarize.py')],check=True)
assert (geometry/'geometry-source-proof.json').read_bytes()==proof
verify()
print(json.dumps({'sourceOnly':True,'nativeAccepted':False,'diagnostics':180,'rawFiles':len(seen),'rawHashesExact':True,'sourceBeforeAfterBaselineExact':True,'UTF16CharacterSlicesExact':True,'frozenProofsReproducedByteExact':True,'retainedReplayDirectory':str(work),'archiveWrites':False}))
