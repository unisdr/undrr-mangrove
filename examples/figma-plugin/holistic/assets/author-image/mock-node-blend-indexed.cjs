'use strict';
const assert=require('assert/strict'),api=require('./node-blend-capability-indexed.cjs');
const ownerKey='family/author-image/variant/source1',key=ownerKey+'/avatar/hover-layer';
const records=[{key,ownerKey,tree:{type:'FRAME',blendMode:'MULTIPLY',gradient:{layers:[]}}}];
const validateGradient=t=>{assert.ok(t.gradient);};
const plans=api.sourcePlans(records,validateGradient);let seq=0;
function env(){const main={id:'main',type:'COMPONENT',stamp:ownerKey,children:[]},leaf={id:'leaf',type:'FRAME',stamp:key,parent:main,blendMode:'MULTIPLY',children:[]};main.children=[leaf];const inst={id:'instance',type:'INSTANCE',children:[],getMainComponentAsync:async()=>main},copy={id:'copy',type:'FRAME',stamp:key,parent:inst,blendMode:'MULTIPLY',children:[]};inst.children=[copy];const calls=[];let inScope=true;const ctx={assertScope(){if(!inScope)throw Error('PAGE/target changed');},identity:n=>n.stamp||'',mainByKey:k=>k===ownerKey?[main]:[],nodesByKey:k=>k===key?[leaf,copy]:[],instances:()=>[inst],recordAttempt:a=>calls.push(a)};return{main,leaf,inst,copy,ctx,calls,setScope:v=>{inScope=v;}};}
async function bad(mutate,regex){const e=env();mutate(e);await assert.rejects(api.preflight(plans,e.ctx),regex);assert.equal(e.calls.length,0);seq++;}
(async()=>{
 for(const mode of ['undrr','delta','irp','mcr','preventionweb']){const e=env();for(let i=0;i<3;i++){const receipt=await api.preflight(plans,e.ctx);assert.equal(receipt.checkedMains,1);assert.equal(receipt.checkedInstanceLeaves,1);}api.apply(e.leaf,plans[0],{...e.ctx,fresh:false});assert.equal(e.calls.length,1);assert.equal(e.copy.blendMode,'MULTIPLY');}
 assert.throws(()=>api.sourcePlans(records),/validation callback/);
 assert.throws(()=>api.sourcePlans(records,()=>{throw Error('Production gradient invalid');}),/Production gradient invalid/);
 const zero=await api.preflight([],new Proxy({},{get(){throw Error('unrelated native access');}}));assert.equal(zero.checkedMains,0);api.apply(null,null,null);
 await bad(e=>{e.leaf.blendMode='NORMAL';},/blend drift/);
 await bad(e=>{e.copy.blendMode='NORMAL';},/blend drift/);
 await bad(e=>{e.main.stamp='foreign';},/source owner/);
 await bad(e=>{e.leaf.parent={type:'COMPONENT',id:'foreign',stamp:'foreign'};},/gradient leaf/);
 await bad(e=>{e.ctx.mainByKey=()=>[e.main,e.main];},/Duplicate/);
 await bad(e=>{e.main.children=[];},/gradient leaf/);
 await bad(e=>{e.inst.getMainComponentAsync=async()=>{e.leaf.blendMode='NORMAL';return e.main;};},/blend drift/);
 await bad(e=>{e.inst.getMainComponentAsync=async()=>{e.setScope(false);return e.main;};},/PAGE/);
 // Genuine unrelated-instance ink is not classified by coincident stamp alone.
 const foreign=env();foreign.inst.getMainComponentAsync=async()=>({id:'foreign',type:'COMPONENT',stamp:'foreign'});foreign.copy.blendMode='NORMAL';await api.preflight(plans,foreign.ctx);
 // Equivalent native-ID proxy handles are accepted, no object-reference assumption.
 const proxy=env();proxy.ctx.mainByKey=()=>[{...proxy.main}];proxy.inst.getMainComponentAsync=async()=>({...proxy.main});await api.preflight(plans,proxy.ctx);
 // A native leaf type-specific unsupported children read must not happen.
 const strict=env();const text={type:'TEXT',id:'text',parent:strict.main};strict.main.children.push(new Proxy(text,{get(t,k){if(k==='children')throw Error('unsupported TEXT children');return t[k];}}));await api.preflight(plans,strict.ctx);
 for(const tree of [{type:'TEXT',blendMode:'MULTIPLY'},{type:'FRAME',blendMode:'NORMAL',gradient:{}},{type:'FRAME',blendMode:'MULTIPLY',gradient:{},fill:'bad'},{type:'FRAME',blendMode:'MULTIPLY',gradient:{},children:[{}]}])assert.throws(()=>api.sourcePlans([{key,ownerKey,tree}],validateGradient),/gradient leaf/);
 assert.throws(()=>api.sourcePlans([...records,...records],validateGradient),/Duplicate/);
 const fresh=env();fresh.leaf.blendMode='PASS_THROUGH';api.apply(fresh.leaf,plans[0],{...fresh.ctx,fresh:true});assert.equal(fresh.leaf.blendMode,'MULTIPLY');assert.equal(fresh.calls.length,1);
 const err=env();Object.defineProperty(err.leaf,'blendMode',{get:()=> 'MULTIPLY',set(){throw Error('native setter failure');}});assert.throws(()=>api.apply(err.leaf,plans[0],{...err.ctx,fresh:false}),/native setter failure/);assert.equal(err.calls.length,1);
 console.log('PASS all5 source/node blend repeats, omission zero-API/default unchanged, owning/linked/proxy/strict-leaf fences, '+seq+' zero-setter native refusals, source-shape negatives and partial-setter attempt journal; no native acceptance');
})().catch(e=>{console.error(e);process.exitCode=1;});
