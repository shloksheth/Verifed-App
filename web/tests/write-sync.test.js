import test from 'node:test';
import assert from 'node:assert/strict';
import {finishCommittedWrite} from '../src/write-sync.js';

test('committed request remains successful if the follow-up read loses connection',async()=>{
 const committed={id:'created-on-server'};
 let warning='';
 const result=await finishCommittedWrite(committed,async()=>{throw new Error('Network unavailable');},message=>{warning=message;});
 assert.equal(result,committed);
 assert.match(warning,/Saved successfully/);
 assert.match(warning,/Retry refresh/);
});
test('successful synchronization returns the committed record without a warning',async()=>{
 let warned=false;
 assert.deepEqual(await finishCommittedWrite({id:'saved'},async()=>{},()=>{warned=true;}),{id:'saved'});
 assert.equal(warned,false);
});
