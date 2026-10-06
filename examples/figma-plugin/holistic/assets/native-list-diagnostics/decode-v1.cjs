'use strict';
function decode(packet){
 if(!packet||packet.format!=='lossless-native-receipt-tuples-v1'||packet.completeReceipt!==true||!Array.isArray(packet.keys)||new Set(packet.keys).size!==packet.keys.length||packet.keys.some(k=>typeof k!=='string')||!Array.isArray(packet.pool))throw Error('Incomplete/invalid native receipt');
 function restore(x,seen=new Set()){
  if(!Array.isArray(x))return x;
  if(x[0]==='r'){const id=x[1];if(x.length!==2||!Number.isInteger(id)||id<0||id>=packet.pool.length||seen.has(id))throw Error('Invalid/cyclic receipt reference');return restore(packet.pool[id],new Set([...seen,id]));}
  if(x[0]==='a')return x.slice(1).map(v=>restore(v,seen));
  if(x[0]!=='o'||x.length%2!==1)throw Error('Invalid receipt tuple');const out={};
  for(let i=1;i<x.length;i+=2){const id=x[i];if(!Number.isInteger(id)||id<0||id>=packet.keys.length||Object.hasOwn(out,packet.keys[id]))throw Error('Invalid receipt key');Object.defineProperty(out,packet.keys[id],{value:restore(x[i+1],seen),enumerable:true,writable:true,configurable:true});}
  return out;
 }
 return restore(packet.receipt);
}
module.exports={decode};
if(require.main===module){const fs=require('fs');process.stdout.write(JSON.stringify(decode(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2)+'\n');}
