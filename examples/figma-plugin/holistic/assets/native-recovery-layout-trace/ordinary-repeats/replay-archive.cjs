'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),crypto=require('crypto'),zlib=require('zlib'),cp=require('child_process');
const root=__dirname,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pins=JSON.parse(fs.readFileSync(path.join(root,'archive-source-pins.json'),'utf8'));
for(const[name,pin]of Object.entries(pins.files)){assert.equal(path.basename(name),name);const bytes=fs.readFileSync(path.join(root,name));assert.equal(bytes.length,pin.bytes,name);assert.equal(sha(bytes),pin.sha256,name);}
const replay=fs.mkdtempSync(path.join(os.tmpdir(),'mangrove-recovery-ordinary-replay-'));
for(const name of Object.keys(pins.files))fs.copyFileSync(path.join(root,name),path.join(replay,name),fs.constants.COPYFILE_EXCL);
for(const r of pins.rawReports){const compressed=fs.readFileSync(path.join(root,r.gzipName));assert.equal(sha(compressed),r.gzipSHA256);const raw=zlib.gunzipSync(compressed);assert.equal(raw.length,r.rawBytes);assert.equal(sha(raw),r.rawSHA256);fs.writeFileSync(path.join(replay,r.rawName),raw,{flag:'wx'});}
const mapping={};for(const[original,name]of Object.entries(pins.originalReadPathAliases)){assert(Object.hasOwn(pins.files,name));mapping[original]=path.join(replay,name);}
const mapPath=path.join(replay,'explicit-original-read-path-map.json');fs.writeFileSync(mapPath,JSON.stringify(mapping,null,2)+'\n',{flag:'wx'});
const env={...process.env,MANGROVE_REPLAY_PATH_MAP:mapPath};
const shim=path.join(replay,'archive-read-path-relocation.cjs');
const pairs=[['baseline','ordinary-1'],['ordinary-1','ordinary-2'],['baseline','ordinary-2']];
for(const[a,b]of pairs){cp.execFileSync(process.execPath,['--require',shim,path.join(replay,'compare-inspections.cjs'),path.join(replay,a+'-raw-inspection.json'),path.join(replay,b+'-raw-inspection.json'),path.join(replay,'replayed-'+a+'-vs-'+b+'.json'),path.join(replay,a+'-desktop-association.json'),path.join(replay,b+'-desktop-association.json')],{env,stdio:'inherit'});}
const accepted=JSON.parse(fs.readFileSync(path.join(root,'complete-records-and-original79-comparison.json'),'utf8'));
cp.execFileSync(process.execPath,['--require',shim,path.join(replay,'compare-complete-records.cjs')],{env,stdio:'inherit'});
const current=JSON.parse(fs.readFileSync(path.join(replay,'complete-records-and-original79-comparison.json'),'utf8'));
assert.deepStrictEqual(current,accepted,'Full-record/original79 replay differs');
const receipt={scope:'Offline exact archive-source/hash/raw-decompression and unchanged comparator replay. Actual native evidence scope remains accepted original peer. No Figma operation or publication.',replayDirectory:replay,rawReportsVerified:pins.rawReports.map(r=>({phase:r.phase,bytes:r.rawBytes,sha256:r.rawSHA256})),allThreeRawPairsPassed:true,completeRecordOriginal79ReplayExact:true,readPathRelocationExplicit:mapping,originalArchiveFilesUntouched:true};
fs.writeFileSync(path.join(replay,'offline-replay-receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(receipt));
// Keep isolated replay bytes/receipt for review. No raw original or archive is removed.
