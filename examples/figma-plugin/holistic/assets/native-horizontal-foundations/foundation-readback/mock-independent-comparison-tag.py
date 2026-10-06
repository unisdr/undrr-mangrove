from pathlib import Path
import json,tempfile,shutil,subprocess
b=Path(__file__).parent
cases=['effect-description','text-extra-binding','effect-extra-binding','aggregate-extra-binding','aggregate-wrong-target']
for case in cases:
 t=Path(tempfile.mkdtemp(prefix='horizontal-compare-negative-'));(t/'foundation-import').mkdir();(t/'foundation-readback').mkdir()
 shutil.copyfile(b.parent/'foundation-import/source-document.json',t/'foundation-import/source-document.json')
 for name in ['independent-compare-source-tag.py']+[f'actual-part{i}-native-tool.json' for i in range(1,7)]:shutil.copyfile(b/name,t/'foundation-readback'/name)
 f=t/'foundation-readback/actual-part6-native-tool.json';outer=json.loads(f.read_text());entry=next(x for x in outer['content'] if x['type']=='text');d=json.loads(entry['text']);tc=d['textStyleColumns'];ec=d['effectStyleColumns'];text=d['textStyles'][0];effect=d['effectStyles'][0]
 if case=='effect-description':effect[ec.index('description')]+=' foreign'
 if case=='text-extra-binding':text[tc.index('boundVariables')]['foreign']={'type':'VARIABLE_ALIAS','id':'foreign'}
 if case=='effect-extra-binding':effect[ec.index('effects')][0]['boundVariables']['foreign']={'type':'VARIABLE_ALIAS','id':'foreign'}
 if case=='aggregate-extra-binding':effect[ec.index('boundVariables')]['foreign']=[]
 if case=='aggregate-wrong-target':effect[ec.index('boundVariables')]['effects'][0]['id']='foreign'
 entry['text']=json.dumps(d);f.write_text(json.dumps(outer));r=subprocess.run(['python3',str(t/'foundation-readback/independent-compare-source-tag.py')],capture_output=True);assert r.returncode!=0,case
print(json.dumps({'passed':True,'negativeCases':cases,'nativeCalls':False}))
