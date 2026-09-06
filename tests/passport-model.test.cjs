'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Model = require('../assets/passport-model.js');
const answers = {question:'怎样让学生参与课程设计？',focus:'学生学习',need:'寻找小规模试行的方法',school:'测试学校',role:'教师'};
const record = {id:'test-record',day:'12-02',kind:'expo',title:'方案交流后的一个问题',text:'先了解实施条件，再判断是否适合本校。',branch:'free',question:'需要哪些前置条件？',nextStep:'和本校伙伴核对现有条件。'};

test('四类参会权益分别生成学习主路径，不虚构具体场次', function(){
  const cases = {main:['forum','subforum','expo','school'],combo:['forum','subforum','expo','offsite','school'],expo:['expo','school'],online:['online-forum','online-recording','school']};
  for(const [identity,ids] of Object.entries(cases)){
    const initial = Model.create(identity,false);
    const state = Model.completeAssessment(initial,answers);
    assert.equal(initial.path,null);
    assert.deepEqual(state.path.stops.map(stop=>stop.id),ids);
    assert.equal(state.path.question,answers.question);
    assert.equal(state.path.focus,answers.focus);
    assert.equal(state.plan.school,answers.school);
  }
});
test('自评需必填字段，主路径生成后不可再改', function(){
  const state = Model.create('main',false);
  assert.throws(()=>Model.completeAssessment(state,{...answers,question:' '}));
  assert.throws(()=>Model.completeAssessment(state,{...answers,need:''}));
  const ready = Model.completeAssessment(state,answers);
  const snapshot = JSON.stringify(ready);
  assert.throws(()=>Model.completeAssessment(ready,{...answers,question:'另一个问题'}),/主路径已生成/);
  assert.equal(JSON.stringify(ready),snapshot);
  assert.throws(()=>Model.completeAssessment(Model.create('guest',false),answers));
});
test('自评前可记录，自由记录不改变主路径且输入不被修改', function(){
  const empty = Model.create('combo',false);
  const pending = Model.addRecord(empty,record);
  assert.equal(pending.path,null);
  assert.equal(empty.records.length,0);
  const state = Model.completeAssessment(pending,answers);
  const path = JSON.stringify(state.path);
  const after = Model.addRecord(state,{...record,id:'second-record',title:'补充观察'});
  assert.equal(JSON.stringify(after.path),path);
  assert.equal(state.records.length,1);
});
test('空记录、重复编号、不安全附件与超长内容被拒绝', function(){
  const state = Model.create('main',false);
  assert.throws(()=>Model.addRecord(state,{...record,title:''}));
  assert.throws(()=>Model.addRecord(state,{...record,text:''}));
  assert.throws(()=>Model.addRecord(state,{...record,text:'长'.repeat(6001)}));
  assert.throws(()=>Model.addRecord(state,{...record,day:'12-99'}));
  const saved = Model.addRecord(state,record);
  assert.throws(()=>Model.addRecord(saved,record),/重复/);
  assert.throws(()=>Model.addRecord(state,{...record,attachment:{name:'bad.svg',type:'image/svg+xml',dataUrl:'data:image/svg+xml;base64,PHN2Zz4='}}));
  const attached = Model.addRecord(state,{...record,text:'',attachment:{name:'note.png',type:'image/png',dataUrl:'data:image/png;base64,aGVsbG8='}});
  assert.equal(attached.records[0].attachment.name,'note.png');
});
test('本人记录须主动分享，分享幂等；点赞可取消且不能给自己点赞', function(){
  const state = Model.create('combo',true);
  const id = state.records[0].id;
  assert.equal(Model.taskStatus(state).relay,false);
  const shared = Model.shareRecord(state,id);
  assert.equal(state.org.posts.length,2);
  assert.equal(shared.org.posts.length,3);
  assert.deepEqual(Model.shareRecord(shared,id),shared);
  assert.throws(()=>Model.shareRecord(state,'absent'));
  const mine = shared.org.posts.find(post=>post.source==='self');
  assert.throws(()=>Model.toggleLike(shared,mine.id));
  const peer = shared.org.posts[0];
  const liked = Model.toggleLike(shared,peer.id);
  assert.equal(liked.org.posts[0].likes,peer.likes+1);
  assert.deepEqual(liked.org.likedIds,[peer.id]);
  assert.deepEqual(Model.toggleLike(liked,peer.id),shared);
});
test('汇总与报告只引用现存记录，无记录时返回空结果', function(){
  const state = Model.create('main',false);
  assert.deepEqual(Model.report(state),{question:'',focus:'',records:[],days:[],sharedCount:0,newQuestions:[],nextSteps:[],freeCount:0});
  assert.deepEqual(Model.summarize(state,'12-01'),{day:'12-01',recordIds:[],mainCount:0,freeCount:0,entries:[],questions:[],nextSteps:[]});
  const saved = Model.addRecord(state,record);
  const report = Model.report(saved);
  const daily = Model.summarize(saved,'12-02');
  assert.deepEqual(daily.recordIds,[record.id]);
  assert.equal(daily.freeCount,1);
  assert.deepEqual(daily.questions,[record.question]);
  report.records[0].title='修改返回值';
  assert.equal(saved.records[0].title,record.title);
  assert.deepEqual(Model.taskStatus(saved),{assessment:false,record:true,relay:false});
});
test('学校计划只能保存显式输入和已存在证据，不代写计划', function(){
  const state = Model.addRecord(Model.create('main',false),record);
  const plan = {...state.plan,school:'测试学校',problem:'学生对课程选择参与不足',goal:'完成一次学生共创试行',owner:'课程团队',recordIds:[record.id]};
  plan.steps = plan.steps.map(step=>({...step,action:step.day===30?'访谈学生并确定试行任务':'',evidence:step.day===30?'访谈纪要':''}));
  const saved = Model.savePlan(state,plan);
  assert.deepEqual(saved.plan,plan);
  assert.equal(state.plan.school,'');
  assert.equal(saved.plan.steps[1].action,'');
  assert.throws(()=>Model.savePlan(state,{...plan,school:''}));
  assert.throws(()=>Model.savePlan(state,{...plan,goal:''}));
  assert.throws(()=>Model.savePlan(state,{...plan,recordIds:['absent']}));
  assert.throws(()=>Model.savePlan(state,{...plan,steps:[plan.steps[0],plan.steps[0],plan.steps[2]]}));
});
test('load 可恢复当前档案，拒绝损坏数据、串号、注入与伪造路径', function(){
  const sample = Model.create('combo',true);
  assert.deepEqual(Model.load(JSON.stringify(sample),'combo'),sample);
  const personal = Model.addRecord(Model.completeAssessment(Model.create('expo',false),answers),record);
  assert.deepEqual(Model.load(JSON.stringify(personal),'expo'),personal);
  assert.equal(Model.load('{','combo'),null);
  assert.equal(Model.load(JSON.stringify(sample),'main'),null);
  for(const patch of [{version:2},{records:{}},{org:{...sample.org,likedIds:['absent']}},{assessment:null},{plan:{...sample.plan,recordIds:['absent']}}]){
    assert.equal(Model.load(JSON.stringify({...sample,...patch}),'combo'),null);
  }
  const changed = JSON.parse(JSON.stringify(sample));
  changed.path.stops[0].href='javascript:alert(1)';
  assert.equal(Model.load(JSON.stringify(changed),'combo'),null);
  assert.equal(Model.load(JSON.stringify(sample).replace('"version":1','"version":1,"__proto__":{"polluted":true}'),'combo'),null);
  assert.equal({}.polluted,undefined);
});
test('UI全流程数据刷新后保留小结原文、选定依据、方案、学校进展和回应', function(){
  let state = Model.completeAssessment(Model.create('combo',false),answers);
  state = Model.addRecord(state,{...record,title:'题'.repeat(160)});
  state = Model.shareRecord(state,record.id);
  state.org.type='community';
  state.org.theme='下一代学习（主题示例）';
  state.org.posts[0].comments.push({text:'这项做法需要先和教师确认时间安排。',author:'我'});
  state.daily['12-02']={recordIds:[record.id],learning:'我需要先了解实施条件，再讨论具体做法。',newQuestion:'哪些条件可以先创造？',next:'带回学校，与课程团队讨论。'};
  state.solutions.push({recordId:record.id,status:'manual-draft',proposal:'从一个班级的小任务开始试行。',verify:'请方案方提供前置条件。',next:'整理问题后联系方案方。'});
  state = Model.savePlan(state,{...state.plan,problem:'让学生参与课程设计',goal:'完成一次小规模共创',owner:'分工'.repeat(500),recordIds:[record.id],updates:[{date:'2026-12-08',text:'学校团队完成了第一次讨论。'}]});
  // 小结保存后新增同日记录，不应在刷新时偷偷扩大已确认小结的依据。
  state = Model.addRecord(state,{...record,id:'after-daily-summary',title:'后来补充的记录'});
  assert.deepEqual(Model.load(JSON.stringify(state),'combo'),state);
  assert.deepEqual(Model.load(JSON.stringify(state),'combo').daily['12-02'].recordIds,[record.id]);
});
test('load 拒绝失效小结、重复或无展位依据方案与无效学校进展日期', function(){
  let state = Model.addRecord(Model.create('main',false),record);
  state.daily['12-02']={recordIds:[record.id],learning:'今天的收获',newQuestion:'',next:''};
  state.solutions=[{recordId:record.id,status:'manual-draft',proposal:'本人填写的方案',verify:'',next:''}];
  const invalid = [
    value=>{value.daily['12-02'].recordIds.push(record.id);},
    value=>{value.daily['12-01']=value.daily['12-02'];},
    value=>{value.daily['12-02'].learning='长'.repeat(2001);},
    value=>{value.solutions.push(value.solutions[0]);},
    value=>{value.solutions[0].recordId='missing';},
    value=>{value.records[0].kind='forum';},
    value=>{value.solutions[0].proposal='长'.repeat(3001);},
    value=>{value.plan.updates=[{date:'2026-02-30',text:'日期无效'}];},
    value=>{value.plan.updates=[{date:'2026-13-01',text:'日期无效'}];}
  ];
  for(const mutate of invalid){
    const value=JSON.parse(JSON.stringify(state));
    mutate(value);
    assert.equal(Model.load(JSON.stringify(value),'main'),null);
  }
  const plan={...state.plan,school:'测试学校',problem:'共同问题',goal:'共同目标',updates:[{date:'2026-12-10',text:'已开展讨论'}]};
  assert.deepEqual(Model.savePlan(state,plan).plan.updates,plan.updates);
  assert.throws(()=>Model.savePlan(state,{...plan,updates:[{date:'2026-02-30',text:'日期无效'}]}));
  const legacy={...plan,updates:[{day:30,text:'第一阶段记录',createdAt:'2026-12-31T00:00:00.000Z'}]};
  assert.deepEqual(Model.savePlan(state,legacy).plan.updates,legacy.updates);
});
test('关注方向对应真实主论坛主题及日期，独立方案展不获主论坛推荐', function(){
  const topics = {
    学生:['12-02','下一代学生 · 游戏的人','d2'],学习:['12-02','下一代学习 · 游戏即创造','d2'],课程:['12-02','下一代课程 · 舞蹈与混沌','d2'],
    技术:['12-03','下一代技术 · 游刃有余','d3'],校园:['12-03','下一代校园 · 身游、心游、神游','d3'],教师:['12-03','下一代教师 · 从容无待，光行不止','d3'],学校:['12-04','下一代学校','d4']
  };
  for(const [focus,values] of Object.entries(topics)){
    for(const identity of ['main','combo','online']){
      const state=Model.completeAssessment(Model.create(identity,false),{...answers,focus});
      assert.deepEqual(state.path.focusSession,{date:values[0],title:values[1],dayId:values[2]});
      assert.equal(state.path.stops[0].copy.includes(answers.question),false);
      assert.equal(state.path.stops[0].copy.includes(values[1]),true);
      if(identity==='online')assert.equal(state.path.stops.some(stop=>['#agenda','#expo','#account/offsite','#account/forum'].includes(stop.href)),false);
      assert.deepEqual(Model.load(JSON.stringify(state),identity),state);
    }
    const expo=Model.completeAssessment(Model.create('expo',false),{...answers,focus});
    assert.equal(expo.path.focusSession,null);
    assert.deepEqual(expo.path.stops.map(stop=>stop.id),['expo','school']);
  }
  const unknown=Model.completeAssessment(Model.create('main',false),{...answers,focus:'尚未归类的真实方向'});
  assert.equal(unknown.path.focusSession,null);
});
test('旧v1路径缺少focusSession仍能恢复，原主线与个人草稿不被改写', function(){
  let state=Model.completeAssessment(Model.create('main',false),{...answers,focus:'技术'});
  state=Model.addRecord(state,record);
  delete state.path.focusSession;
  delete state.ballots;
  state.path.stops[0].copy='原v1已生成的路径说明。';
  const restored=Model.load(JSON.stringify(state),'main');
  assert.ok(restored);
  assert.deepEqual(restored.path.stops,state.path.stops);
  assert.equal(restored.path.createdAt,state.path.createdAt);
  assert.deepEqual(restored.records,state.records);
  assert.deepEqual(restored.path.focusSession,{date:'12-03',title:'下一代技术 · 游刃有余',dayId:'d3'});
  assert.deepEqual(restored.ballots,{});
  restored.path.focusSession.title='伪造场次';
  assert.equal(Model.load(JSON.stringify(restored),'main'),null);
});
test('返场投票只持久化本地候选选择，未知值回到空对象', function(){
  const state=Model.create('main',false);
  assert.deepEqual(state.ballots,{});
  state.ballots={'12-01':'a','12-02':'b'};
  assert.deepEqual(Model.load(JSON.stringify(state),'main').ballots,state.ballots);
  for(const ballots of [null,42,'unknown',[]])assert.deepEqual(Model.load(JSON.stringify({...state,ballots}),'main').ballots,{});
  state.ballots={'12-03':'a','12-99':'a','12-04':'c'};
  assert.deepEqual(Model.load(JSON.stringify(state),'main').ballots,{'12-03':'a'});
});
test('完整样例可直接查看有依据的每日小结、方案草稿和学校行动闭环', function(){
  for(const identity of ['main','combo','expo','online']){
    const sample=Model.create(identity,true);
    assert.equal(sample.mode,'sample');
    assert.equal(sample.records.length,3);
    assert.equal(sample.org.posts.length,2);
    assert.deepEqual(sample.daily['12-01'].recordIds,['sample-record-1']);
    assert.ok(sample.daily['12-01'].learning);
    assert.ok(sample.daily['12-01'].newQuestion);
    assert.ok(sample.daily['12-01'].next);
    assert.deepEqual(sample.plan.recordIds,['sample-record-1','sample-record-2']);
    assert.ok(sample.plan.school && sample.plan.problem && sample.plan.goal && sample.plan.owner);
    assert.deepEqual(sample.plan.steps.map(step=>step.day),[30,60,100]);
    assert.equal(sample.plan.steps.every(step=>step.action && step.evidence),true);
    assert.deepEqual(sample.plan.updates,[]);
    if(identity==='online')assert.deepEqual(sample.solutions,[]);
    else{
      assert.equal(sample.solutions.length,1);
      assert.equal(sample.solutions[0].status,'manual-draft');
      assert.equal(sample.records.find(row=>row.id===sample.solutions[0].recordId).kind,'expo');
    }
    assert.deepEqual(Model.load(JSON.stringify(sample),identity),sample);
  }
});
test('个人空白护照不带入任何样例自评、记录、小结、方案或学校行动', function(){
  for(const identity of ['main','combo','expo','online']){
    const personal=Model.create(identity,false);
    assert.equal(personal.mode,'personal');
    assert.equal(personal.assessment,null);
    assert.equal(personal.path,null);
    assert.deepEqual(personal.records,[]);
    assert.deepEqual(personal.org.posts,[]);
    assert.deepEqual(personal.daily,{});
    assert.deepEqual(personal.solutions,[]);
    assert.deepEqual(personal.plan.recordIds,[]);
    assert.deepEqual(personal.plan.updates,[]);
    assert.equal(personal.plan.school+personal.plan.problem+personal.plan.goal+personal.plan.owner,'');
    assert.equal(personal.plan.steps.every(step=>!step.action && !step.evidence),true);
    assert.deepEqual(Model.load(JSON.stringify(personal),identity),personal);
  }
});
