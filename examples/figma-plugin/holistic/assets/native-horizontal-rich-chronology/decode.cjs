'use strict';
function decode(packet){
 if(!packet||packet.format!=='lossless-native-receipt-shapes-stringrefs-v3'||packet.completeReceipt!==true||!Array.isArray(packet.keys)||new Set(packet.keys).size!==packet.keys.length||packet.keys.some(k=>typeof k!=='string')||!Array.isArray(packet.pool)||!Array.isArray(packet.shapes))throw Error('Incomplete/invalid native receipt');
 function restore(x,seen=new Set()){
  if(typeof x==='string'&&x.startsWith('~')){if(x.startsWith('~~'))return x.slice(1);if(!/^~(?:0|[1-9][0-9]*)$/.test(x))throw Error('Invalid receipt string reference');const id=Number(x.slice(1));if(!Number.isSafeInteger(id)||id>=packet.pool.length||seen.has(id))throw Error('Invalid/cyclic receipt reference');return restore(packet.pool[id],new Set([...seen,id]));}
  if(!Array.isArray(x))return x;
  if(x[0]==='r'){const id=x[1];if(x.length!==2||!Number.isInteger(id)||id<0||id>=packet.pool.length||seen.has(id))throw Error('Invalid/cyclic receipt reference');return restore(packet.pool[id],new Set([...seen,id]));}
  if(x[0]==='a')return x.slice(1).map(v=>restore(v,seen));
  if(x[0]!=='s'||!Number.isInteger(x[1])||x[1]<0||x[1]>=packet.shapes.length)throw Error('Invalid receipt shape reference');const shape=packet.shapes[x[1]];if(!Array.isArray(shape)||x.length!==shape.length+2)throw Error('Invalid receipt shape');const out={};
  for(let i=0;i<shape.length;i++){const id=shape[i];if(!Number.isInteger(id)||id<0||id>=packet.keys.length||Object.hasOwn(out,packet.keys[id]))throw Error('Invalid receipt key');Object.defineProperty(out,packet.keys[id],{value:restore(x[i+2],seen),enumerable:true,writable:true,configurable:true});}
  return out;
 }
 return restore(packet.receipt);
}
module.exports={decode};
if(require.main===module){const fs=require('fs');process.stdout.write(JSON.stringify(decode(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2)+'\n');}
