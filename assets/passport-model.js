(function(root, factory){
  if(typeof module === 'object' && module.exports) module.exports = factory();
  else root.EICCPassportModel = factory();
}(typeof self !== 'undefined' ? self : this, function(){
  'use strict';

  var IDENTITIES = ['main','combo','expo','online','anonymous','guest'];
  var KINDS = ['forum','subforum','offsite','expo','fishbowl','evening','ai','paper','other'];
  var DAYS = ['12-01','12-02','12-03','12-04','12-05'];
  var FOCUS_SESSIONS = {
    '学生':{date:'12-02',title:'下一代学生 · 游戏的人',dayId:'d2'},
    '学习':{date:'12-02',title:'下一代学习 · 游戏即创造',dayId:'d2'},
    '课程':{date:'12-02',title:'下一代课程 · 舞蹈与混沌',dayId:'d2'},
    '技术':{date:'12-03',title:'下一代技术 · 游刃有余',dayId:'d3'},
    '校园':{date:'12-03',title:'下一代校园 · 身游、心游、神游',dayId:'d3'},
    '教师':{date:'12-03',title:'下一代教师 · 从容无待，光行不止',dayId:'d3'},
    '学校':{date:'12-04',title:'下一代学校',dayId:'d4'}
  };
  var counter = 0;
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function object(value){ return !!value && typeof value === 'object' && !Array.isArray(value); }
  function has(list, value){ return list.indexOf(value) !== -1; }
  function registered(identity){ return has(['main','combo','expo','online'], identity); }
  function text(value, label, max, required){
    if(typeof value !== 'string'){
      if(!required && value == null) return '';
      throw new Error('请填写' + label);
    }
    var result = value.trim();
    if(required && !result) throw new Error('请填写' + label);
    if(result.length > max) throw new Error(label + '请控制在 ' + max + ' 字以内');
    return result;
  }
  function id(value, label){
    if(typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(value)) throw new Error(label + '格式不正确');
    return value;
  }
  function unique(values){ return values.filter(function(value, index){ return values.indexOf(value) === index; }); }
  function now(){ return new Date().toISOString(); }
  function nextId(prefix, list){
    var result;
    do { result = prefix + '-' + Date.now().toString(36) + '-' + (++counter).toString(36); }
    while(list.some(function(item){ return item.id === result; }));
    return result;
  }
  function day(value){
    if(!has(DAYS, value)) throw new Error('请选择 12 月 1 日至 5 日的学习日期');
    return value;
  }
  function assessment(input){
    if(!object(input)) throw new Error('请填写学习自评');
    return {
      question:text(input.question,'真实问题',600,true),
      focus:text(input.focus,'关注方向',120,true),
      need:text(input.need,'希望获得的帮助',600,true),
      school:text(input.school,'学校名称',120,true),
      role:text(input.role,'角色',80,false)
    };
  }
  function pathFor(identity, answers){
    var stops = [];
    var focusKey = answers.focus === '学生学习' ? '学习' : answers.focus;
    var focusSession = identity !== 'expo' && Object.prototype.hasOwnProperty.call(FOCUS_SESSIONS,focusKey) ? clone(FOCUS_SESSIONS[focusKey]) : null;
    var forumCopy = focusSession ? '根据你的关注方向，可重点关注「' + focusSession.title + '」，记录与本校问题有关的理解。' : '带着会前问题参与共同学习，记录与本校情境有关的观点。';
    function stop(key, title, copy, kind, href){ stops.push({id:key,title:title,copy:copy,kind:kind,href:href}); }
    if(identity === 'online'){
      stop('online-forum','主论坛直播与回看',forumCopy + ' 在直播与回看入口观看对应内容。','forum','#account/replay');
      stop('online-recording','分论坛与场外深研课录播','从已开放的录播中选择与关注方向相关的内容，留下自己的理解与后续问题。','subforum','#account/replay');
    }else{
      if(identity !== 'expo'){
        stop('forum','主论坛',forumCopy,'forum','#agenda');
        stop('subforum','分论坛','在已选分论坛中比较做法与实施条件，围绕共同问题深入讨论；每天最多选择一场。','subforum','#account/forum');
      }
      stop('expo','云涌集 · 方案展','围绕“' + answers.focus + '”寻找学校创新方案，记录适用条件与需要向方案方核实的问题。','expo','#expo');
      if(identity === 'combo') stop('offsite','场外深研课','走进已选学校现场，比较实践情境与本校条件；最多选择一场。','offsite','#account/offsite');
    }
    stop('school','回到学校 · 100 天行动','汇总本校伙伴的学习所得，由学校共同填写行动模板。','other','#account/outcomes');
    return {question:answers.question,focus:answers.focus,createdAt:now(),stops:stops,focusSession:focusSession};
  }
  function emptyPlan(){
    return {school:'',problem:'',goal:'',owner:'',steps:[{day:30,action:'',evidence:''},{day:60,action:'',evidence:''},{day:100,action:'',evidence:''}],recordIds:[],updates:[]};
  }
  function create(identity, sample){
    if(!has(IDENTITIES,identity)) throw new Error('参会身份无效');
    var state = {version:1,identity:identity,mode:sample?'sample':'personal',assessment:null,path:null,records:[],org:{type:'class',theme:'',posts:[],likedIds:[]},daily:{},plan:emptyPlan(),solutions:[],ballots:{}};
    if(!sample || !registered(identity)) return state;
    state = completeAssessment(state,{question:'怎样让学生在真实问题中更主动地学习？',focus:'学生学习',need:'了解可以在学校小范围试行的做法',school:'示例学校',role:'学校教师'});
    state.org.theme = '学生主动学习（主题示例）';
    var samples = identity === 'online' ? [
      {id:'sample-record-1',day:'12-01',kind:'forum',title:'先听学生怎样描述问题',text:'看主论坛时，我记下了一个提醒：设计活动前，可以先问学生想解决什么，而不急着给他们一份任务单。',branch:'main',question:'学生提出的问题，怎样转化为能一起推进的任务？',nextStep:'回校后先访谈几位学生，保留他们原来的表达。'},
      {id:'sample-record-2',day:'12-02',kind:'subforum',title:'为小范围试行留出复盘时间',text:'从录播里记下的方法需要放回本校情境再判断。我想先把实施条件列清楚，再和同事讨论。',branch:'main',question:'我们能先从哪个小任务开始？',nextStep:'和本校伙伴一起列出可试行的条件。'},
      {id:'sample-record-3',day:'12-02',kind:'other',title:'一次延伸阅读带来的追问',text:'顺着今天的问题，额外读了一份资料。我还不能判断它是否适合学校，先把疑问记下来。',branch:'free',question:'怎样观察学生是否真正参与了决策？',nextStep:''}
    ] : [
      {id:'sample-record-1',day:'12-01',kind:identity==='expo'?'expo':'forum',title:'先听学生怎样描述问题',text:'今天的交流提醒我：设计活动前，可以先问学生想解决什么，而不急着给他们一份任务单。',branch:'main',question:'学生提出的问题，怎样转化为能一起推进的任务？',nextStep:'回校后先访谈几位学生，保留他们原来的表达。'},
      {id:'sample-record-2',day:'12-02',kind:'expo',title:'先问方案需要什么条件',text:'与方案方交流时，我记下了教师准备、时间安排和空间要求。还需要和同事判断哪些条件在学校已经具备。',branch:'main',question:'我们能先从哪个小任务开始？',nextStep:'和本校伙伴一起列出可试行的条件。'},
      {id:'sample-record-3',day:'12-02',kind:'other',title:'一次临时交流带来的追问',text:'计划之外和同行聊了学生参与的问题。我还没有形成结论，先留下这个值得继续讨论的角度。',branch:'free',question:'怎样观察学生是否真正参与了决策？',nextStep:''}
    ];
    samples.forEach(function(record){ state = addRecord(state,record); });
    state.org.posts = [
      {id:'sample-post-1',recordId:null,author:'同伴 A（示例）',title:'先从一个小任务试起',text:'我们讨论了先选一个真实任务试行，再收集学生的反馈。想听听大家会用什么证据判断这次尝试有没有价值。',likes:4,comments:[],source:'sample'},
      {id:'sample-post-2',recordId:null,author:'同伴 B（示例）',title:'保留不同意见',text:'今天的交流中出现了几种不同做法。我希望把各自成立的条件写清楚，而不急着选一个统一答案。',likes:2,comments:[],source:'sample'}
    ];
    state.daily['12-01'] = {
      recordIds:['sample-record-1'],
      learning:'今天最想带回学校的一点，是先听学生怎样描述问题。与其马上给出任务，不如先保留他们的表达，再一起讨论可以做什么。',
      newQuestion:'学生提出的问题，怎样转化为能一起推进的任务？',
      next:'回校后邀请几位学生聊一聊，把原话整理出来，再和年级教师一起讨论。'
    };
    if(state.records[1].kind === 'expo') state.solutions = [{
      recordId:'sample-record-2',status:'manual-draft',
      proposal:'先从一个年级、一个真实任务试起。让学生参与提出问题和安排分工，教师记录过程中需要的支持；试行之后再决定是否扩大。',
      verify:'需要向方案方核实教师准备时间、已有学校的实施条件，以及哪些材料可以用于校内讨论。',
      next:'把交流中的条件清单带回学校，和年级教师核对，再约一次具体沟通。'
    }];
    state.plan = {
      school:'示例学校',
      problem:'学生目前更多在完成安排好的任务。我们准备先了解他们真正关心的问题，并尝试让学生参与一次学习任务的设计。',
      goal:'在一个年级完成一次师生共同设计的学习任务，留下学生参与过程、教师观察和复盘记录，再判断下一步怎样改。',
      owner:'学校课程团队统筹；年级教师组织学生访谈和试行；参会伙伴整理学习依据并参与复盘。',
      steps:[
        {day:30,action:'访谈学生，收集他们关心的问题；由年级教师与学生共同确定一个能在校内试行的真实任务。',evidence:'学生访谈原话、共同问题清单、任务安排与分工。'},
        {day:60,action:'开展一轮小范围试行，记录学生怎样做选择、怎样协作，以及教师在哪些环节提供了支持。',evidence:'学生过程记录、教师观察、阶段交流纪要。'},
        {day:100,action:'邀请参与学生和教师一起复盘，对照原来的问题讨论变化与困难，形成下一轮调整安排。',evidence:'学生与教师反馈、复盘结论、下一轮行动安排。'}
      ],
      recordIds:['sample-record-1','sample-record-2'],updates:[]
    };
    return state;
  }
  function completeAssessment(state, answers){
    if(state.path) throw new Error('学习主路径已生成，不能重复自评或改写；新发现可另存自由学习记录');
    if(!registered(state.identity)) throw new Error('报名后可完成学习自评');
    var next = clone(state), values = assessment(answers);
    next.assessment = values;
    next.path = pathFor(next.identity,values);
    next.plan.school = values.school;
    return next;
  }
  function attachment(input){
    if(input == null) return undefined;
    if(!object(input)) throw new Error('附件格式不正确');
    var name = text(input.name,'附件名称',180,true), type = input.type, url = input.dataUrl;
    if(typeof type !== 'string' || !/^(image\/(?:jpeg|png|webp|gif)|audio\/(?:webm|ogg|mpeg|mp4|wav))$/.test(type)) throw new Error('请使用照片或音频附件');
    if(typeof url !== 'string' || url.length > 4 * 1024 * 1024 || url.indexOf('data:' + type + ';base64,') !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(url.slice(url.indexOf(',') + 1)) || !url.slice(url.indexOf(',') + 1)) throw new Error('附件数据无效或过大');
    return {name:name,type:type,dataUrl:url};
  }
  function recordInput(input, records){
    if(!object(input)) throw new Error('请填写学习记录');
    var item = {id:input.id == null ? nextId('record',records) : id(input.id,'记录编号'),day:day(input.day),kind:input.kind,title:text(input.title,'记录标题',160,true),text:text(input.text,'学习记录',6000,false),branch:input.branch,question:text(input.question,'新的问题',600,false),nextStep:text(input.nextStep,'下一步',600,false),createdAt:now()};
    if(!has(KINDS,item.kind)) throw new Error('请选择记录所属的学习场景');
    if(!has(['main','free'],item.branch)) throw new Error('请选择主路径或自由学习');
    if(records.some(function(record){ return record.id === item.id; })) throw new Error('记录编号重复');
    var file = attachment(input.attachment);
    if(!item.text && !file) throw new Error('请填写学习记录或添加照片、语音');
    if(file) item.attachment = file;
    return item;
  }
  function addRecord(state, input){
    var item = recordInput(input,state.records), next = clone(state);
    next.records.push(item);
    return next;
  }
  function shareRecord(state, recordId){
    var record = state.records.find(function(item){ return item.id === recordId; });
    if(!record) throw new Error('找不到这条学习记录');
    var next = clone(state);
    if(next.org.posts.some(function(post){ return post.source === 'self' && post.recordId === recordId; })) return next;
    next.org.posts.push({id:nextId('post',next.org.posts),recordId:record.id,author:'我',title:record.title,text:record.text,likes:0,comments:[],source:'self'});
    return next;
  }
  function toggleLike(state, postId){
    var next = clone(state), post = next.org.posts.find(function(item){ return item.id === postId; });
    if(!post) throw new Error('找不到这条知识接力');
    if(post.source === 'self') throw new Error('不能给自己的分享点赞');
    var index = next.org.likedIds.indexOf(postId);
    if(index === -1){ next.org.likedIds.push(postId); post.likes += 1; }
    else { next.org.likedIds.splice(index,1); post.likes = Math.max(0,post.likes - 1); }
    return next;
  }
  function summarize(state, selectedDay){
    day(selectedDay);
    var rows = state.records.filter(function(record){ return record.day === selectedDay; });
    return {day:selectedDay,recordIds:rows.map(function(record){ return record.id; }),mainCount:rows.filter(function(record){ return record.branch === 'main'; }).length,freeCount:rows.filter(function(record){ return record.branch === 'free'; }).length,entries:rows.map(function(record){ return {id:record.id,title:record.title,text:record.text}; }),questions:unique(rows.map(function(record){ return record.question; }).filter(Boolean)),nextSteps:unique(rows.map(function(record){ return record.nextStep; }).filter(Boolean))};
  }
  function report(state){
    return {question:state.assessment ? state.assessment.question : '',focus:state.assessment ? state.assessment.focus : '',records:clone(state.records),days:unique(state.records.map(function(record){ return record.day; })).sort(),sharedCount:state.org.posts.filter(function(post){ return post.source === 'self' && state.records.some(function(record){ return record.id === post.recordId; }); }).length,newQuestions:unique(state.records.map(function(record){ return record.question; }).filter(Boolean)),nextSteps:unique(state.records.map(function(record){ return record.nextStep; }).filter(Boolean)),freeCount:state.records.filter(function(record){ return record.branch === 'free'; }).length};
  }
  function planInput(input, records, required){
    if(!object(input)) throw new Error('请填写学校行动模板');
    var plan = {school:text(input.school,'学校名称',120,required),problem:text(input.problem,'学校共同问题',1200,required),goal:text(input.goal,'行动目标',1200,required),owner:text(input.owner,'共同推进人',1000,false),steps:[],recordIds:[],updates:[]};
    if(!Array.isArray(input.steps) || input.steps.length !== 3) throw new Error('请保留 30、60、100 天行动节点');
    [30,60,100].forEach(function(value){
      var matches = input.steps.filter(function(step){ return object(step) && step.day === value; });
      if(matches.length !== 1) throw new Error('行动节点不能缺失或重复');
      plan.steps.push({day:value,action:text(matches[0].action,'行动安排',2000,false),evidence:text(matches[0].evidence,'成果证据',1200,false)});
    });
    if(!Array.isArray(input.recordIds) || input.recordIds.length > 500 || unique(input.recordIds).length !== input.recordIds.length) throw new Error('关联学习记录格式不正确');
    plan.recordIds = input.recordIds.map(function(recordId){
      if(!records.some(function(record){ return record.id === recordId; })) throw new Error('行动计划只能关联已保存的学习记录');
      return recordId;
    });
    if(!Array.isArray(input.updates) || input.updates.length > 100) throw new Error('行动进展格式不正确');
    plan.updates = input.updates.map(function(update){
      if(!object(update)) throw new Error('行动进展格式不正确');
      if(Object.prototype.hasOwnProperty.call(update,'date')) return {date:calendarDate(update.date),text:text(update.text,'行动进展',2000,true)};
      return {day:has([30,60,100],update.day) ? update.day : function(){ throw new Error('行动进展日期不正确'); }(),text:text(update.text,'行动进展',2000,true),createdAt:dateString(update.createdAt)};
    });
    return plan;
  }
  function savePlan(state, plan){
    var next = clone(state);
    next.plan = planInput(plan,state.records,true);
    return next;
  }
  function taskStatus(state){
    return {assessment:!!state.assessment,record:state.records.length > 0,relay:state.org.posts.some(function(post){ return post.source === 'self' && state.records.some(function(record){ return record.id === post.recordId; }); })};
  }
  function dateString(value){
    if(typeof value !== 'string' || value.length > 40 || !/^\d{4}-\d{2}-\d{2}T/.test(value) || isNaN(Date.parse(value))) throw new Error('保存时间无效');
    return value;
  }
  function calendarDate(value){
    if(typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('行动进展日期不正确');
    var parsed = new Date(value + 'T00:00:00Z');
    if(isNaN(parsed.getTime()) || parsed.toISOString().slice(0,10) !== value) throw new Error('行动进展日期不正确');
    return value;
  }
  function safeTree(value, depth){
    if(depth > 18) return false;
    if(value === null || typeof value === 'string' || typeof value === 'boolean') return true;
    if(typeof value === 'number') return isFinite(value);
    if(Array.isArray(value)) return value.length <= 500 && value.every(function(item){ return safeTree(item,depth+1); });
    if(!object(value)) return false;
    return Object.keys(value).length <= 40 && Object.keys(value).every(function(key){ return !has(['__proto__','constructor','prototype'],key) && safeTree(value[key],depth+1); });
  }
  function load(raw, identity){
    try {
      if(typeof raw !== 'string' || raw.length > 12 * 1024 * 1024 || !has(IDENTITIES,identity)) return null;
      var value = JSON.parse(raw);
      if(!object(value) || !safeTree(value,0) || value.version !== 1 || value.identity !== identity || !has(['sample','personal'],value.mode)) return null;
      if(!Array.isArray(value.records) || !Array.isArray(value.solutions) || !object(value.daily) || !object(value.org) || !has(['class','community'],value.org.type) || !Array.isArray(value.org.posts) || !Array.isArray(value.org.likedIds)) return null;
      var next = create(identity,false);
      next.mode = value.mode;
      next.assessment = value.assessment === null ? null : assessment(value.assessment);
      if(!!next.assessment !== !!value.path || (next.assessment && !registered(identity))) return null;
      if(value.path){
        if(!object(value.path) || value.path.question !== next.assessment.question || value.path.focus !== next.assessment.focus || !Array.isArray(value.path.stops)) return null;
        var expected = pathFor(identity,next.assessment);
        if(value.path.stops.length !== expected.stops.length || value.path.stops.some(function(stop,index){ return !object(stop) || ['id','title','kind','href'].some(function(key){ return stop[key] !== expected.stops[index][key]; }); })) return null;
        // v1 已有路径保持原内容，不因推荐说明升级而丢弃个人草稿或改写主线。
        next.path = {question:value.path.question,focus:value.path.focus,createdAt:dateString(value.path.createdAt),stops:value.path.stops.map(function(stop){ return {id:stop.id,title:stop.title,copy:text(stop.copy,'路径说明',1500,true),kind:stop.kind,href:stop.href}; }),focusSession:expected.focusSession};
        if(Object.prototype.hasOwnProperty.call(value.path,'focusSession')){
          if(expected.focusSession === null){ if(value.path.focusSession !== null) return null; }
          else if(!object(value.path.focusSession) || ['date','title','dayId'].some(function(key){ return value.path.focusSession[key] !== expected.focusSession[key]; })) return null;
        }
      }
      value.records.forEach(function(item){
        var record = recordInput(item,next.records);
        record.createdAt = dateString(item.createdAt);
        next.records.push(record);
      });
      next.org.type = value.org.type;
      next.org.theme = text(value.org.theme,'社区主题',200,false);
      value.org.posts.forEach(function(post){
        if(!object(post) || !has(['sample','self'],post.source) || !Number.isSafeInteger(post.likes) || post.likes < 0 || !Array.isArray(post.comments)) throw new Error('知识接力数据无效');
        id(post.id,'分享编号');
        if(next.org.posts.some(function(other){ return other.id === post.id || (post.source === 'self' && other.source === 'self' && other.recordId === post.recordId); })) throw new Error('分享重复');
        if(post.source === 'self' && !next.records.some(function(record){ return record.id === post.recordId; })) throw new Error('分享关联不存在的记录');
        if(post.source === 'sample' && post.recordId !== null) throw new Error('示例分享格式无效');
        var item = {id:post.id,recordId:post.recordId,author:text(post.author,'分享人',80,true),title:text(post.title,'分享标题',160,true),text:text(post.text,'分享内容',6000,false),likes:post.likes,comments:post.comments.map(function(comment){
          if(!object(comment)) throw new Error('回应格式不正确');
          return {text:text(comment.text,'回应内容',1000,true),author:text(comment.author,'回应人',80,true)};
        }),source:post.source};
        if(post.source === 'self'){
          var original = next.records.find(function(record){ return record.id === post.recordId; });
          if(item.author !== '我' || item.title !== original.title || item.text !== original.text) throw new Error('分享内容与本人记录不一致');
        }
        next.org.posts.push(item);
      });
      if(unique(value.org.likedIds).length !== value.org.likedIds.length) return null;
      next.org.likedIds = value.org.likedIds.map(function(postId){
        if(!next.org.posts.some(function(post){ return post.id === postId && post.source !== 'self' && post.likes > 0; })) throw new Error('点赞关联无效');
        return postId;
      });
      next.plan = planInput(value.plan,next.records,false);
      Object.keys(value.daily).forEach(function(key){
        day(key);
        var saved = value.daily[key];
        if(!object(saved) || !Array.isArray(saved.recordIds) || unique(saved.recordIds).length !== saved.recordIds.length || saved.recordIds.some(function(recordId){ return !next.records.some(function(record){ return record.id === recordId && record.day === key; }); })) throw new Error('每日汇总关联无效');
        next.daily[key] = {recordIds:saved.recordIds.slice(),learning:text(saved.learning,'每日收获',2000,true),newQuestion:text(saved.newQuestion,'每日新的问题',1000,false),next:text(saved.next,'每日下一步',1000,false)};
      });
      var solutionRecords = [];
      next.solutions = value.solutions.map(function(solution){
        if(!object(solution) || solution.status !== 'manual-draft' || !next.records.some(function(record){ return record.id === solution.recordId && record.kind === 'expo'; }) || has(solutionRecords,solution.recordId)) throw new Error('方案记录无效');
        solutionRecords.push(solution.recordId);
        return {recordId:solution.recordId,status:'manual-draft',proposal:text(solution.proposal,'方案思路',3000,true),verify:text(solution.verify,'待核实的问题',1000,false),next:text(solution.next,'方案下一步',1000,false)};
      });
      if(object(value.ballots)) Object.keys(value.ballots).forEach(function(key){
        if(has(DAYS,key) && has(['a','b'],value.ballots[key])) next.ballots[key] = value.ballots[key];
      });
      return next;
    } catch(error){ return null; }
  }
  return {create:create,completeAssessment:completeAssessment,addRecord:addRecord,shareRecord:shareRecord,toggleLike:toggleLike,summarize:summarize,report:report,savePlan:savePlan,load:load,taskStatus:taskStatus};
}));
