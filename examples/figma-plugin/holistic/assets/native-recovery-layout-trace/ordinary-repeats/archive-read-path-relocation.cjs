'use strict';
const fs=require('fs'),assert=require('assert');
const location=process.env.MANGROVE_REPLAY_PATH_MAP;
assert(location,'Offline replay requires explicit read-path mapping');
const original=fs.readFileSync.bind(fs);
const mapping=JSON.parse(original(location,'utf8'));
assert(mapping&&typeof mapping==='object'&&!Array.isArray(mapping));
fs.readFileSync=function(file,...args){const key=typeof file==='string'?file:null;return original(key&&Object.hasOwn(mapping,key)?mapping[key]:file,...args);};
// Exact allowlisted historical file reads only. No report/association mutation,
// native execution, dynamic Figma transport or global filesystem remapping.
