from pathlib import Path
import tempfile,tarfile,io,json,hashlib,subprocess,sys
archive=Path('/tmp/mangrove-semantic-generated-source-archive-20261006');code=(archive/'replay-archive.py').read_bytes();results=[]
for case,entries,expected in [('foreign',[('ink/foreign',tarfile.REGTYPE)],[]),('duplicate',[('ink/a',tarfile.REGTYPE),('ink/a',tarfile.REGTYPE)],['ink/a']),('symlink',[('ink/a',tarfile.SYMTYPE)],['ink/a']),('nested-path',[('ink/sub/a',tarfile.REGTYPE)],['ink/sub/a']),('traversal',[('ink/../outside',tarfile.REGTYPE)],['ink/../outside'])]:
 p=Path(tempfile.mkdtemp(prefix='mangrove-archive-negative-'));(p/'replay-archive.py').write_bytes(code)
 for label in ['ink','geometry']:
  with tarfile.open(p/(label+'-raw.tar.gz'),'w:gz') as tar:
   if label=='ink':
    for name,kind in entries:
     member=tarfile.TarInfo(name);member.type=kind;member.size=1 if kind==tarfile.REGTYPE else 0
     if kind==tarfile.SYMTYPE:member.linkname='../outside'
     tar.addfile(member,io.BytesIO(b'x') if member.size else None)
 rows=[{'path':name,'bytes':1,'sha256':hashlib.sha256(b'x').hexdigest()} for name in expected]
 (p/'provenance.json').write_text(json.dumps({'files':[],'rawEntries':rows}))
 r=subprocess.run([sys.executable,str(p/'replay-archive.py')],text=True,capture_output=True)
 assert r.returncode!=0 and 'AssertionError:' in r.stderr and entries[0][0] in r.stderr,(case,r.stderr)
 assert not (p/'outside').exists()
 results.append({'case':case,'refusedAtExtractionGuard':True,'exit':r.returncode})
p=Path(tempfile.mkdtemp(prefix='mangrove-archive-hash-negative-'));(p/'replay-archive.py').write_bytes(code);(p/'pinned').write_bytes(b'altered');(p/'provenance.json').write_text(json.dumps({'files':[{'path':'pinned','bytes':1,'sha256':hashlib.sha256(b'x').hexdigest()}],'rawEntries':[]}));r=subprocess.run([sys.executable,str(p/'replay-archive.py')],text=True,capture_output=True);assert r.returncode!=0 and 'AssertionError:' in r.stderr and 'pinned' in r.stderr;results.append({'case':'changed-file-pin','refusedBeforeExtraction':True})
Path('/tmp/mangrove-semantic-generated-source-archive-negative-verdict-notice-20261006.json').write_text(json.dumps({'actualUnchangedVerifier':True,'archiveWrites':False,'isolatedSyntheticFixtures':True,'results':results},indent=2)+'\n');print(json.dumps(results))
