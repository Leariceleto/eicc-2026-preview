const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/diagnosis-data.js'),'utf8'),context);
const q=context.window.EiccDiagnosisData.questions;
test('前置诊断保留15道可见必填题，隐藏身份字段不进入用户问卷',()=>{
 assert.equal(q.length,15);assert.ok(q.every(x=>x.required));
 assert.equal(q.filter(x=>x.type==='select'&&!x.multiple).length,13);
 assert.equal(q.filter(x=>x.multiple).length,1);
 assert.equal(q[13].id,'fld94SwyGj');assert.equal(q[14].id,'fldwjCjowp');
 assert.ok(!q.some(x=>x.title==='userid'||x.title==='智能总结'));
 for(const question of q.slice(0,13)){assert.equal(question.options.length,6);assert.equal(question.options.at(-1).name,'不了解/不适用');}
});
