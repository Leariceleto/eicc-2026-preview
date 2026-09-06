/* Learning passport: local-only interaction preview. No login, AI or shared storage is implied. */
(function () {
  'use strict';
  var M = window.EICCPassportModel;
  var root = document.getElementById('passport-app');
  var home = document.querySelector('[data-passport-home]');
  if (!root || !M) return;
  var context = {identity:'combo', phase:'prep', assessment:true};
  var tabs = {path:'我的学习路径', records:'学习任务与记录', organization:'我的学习组织', outcomes:'学习成果'};
  var kinds = {forum:'主论坛',subforum:'分论坛',offsite:'场外深研课',expo:'方案展交流',fishbowl:'鱼缸对话',evening:'晚自习 · 交个朋友',ai:'AI共创',paper:'纸质笔记',other:'其他学习'};
  var communityThemes = ['下一代学生','下一代学习','下一代课程','下一代技术','下一代校园','下一代教师','下一代学校'];
  var names = {main:'主论坛',combo:'主论坛＋深研课',expo:'独立方案展',online:'线上参会'};
  var days = ['12-01','12-02','12-03','12-04','12-05'];
  var view = 'path', day = '12-01', filter = 'all', message = '', modal = null, recorder = null, stream = null, recordingTimer = null, attachment = null, audioPending = false;
  var state = restore(context.identity) || M.create(context.identity, true);
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function key(identity) {return 'eicc-passport-v1-' + identity;}
  function restore(identity) {try{return M.load(localStorage.getItem(key(identity)), identity);}catch(e){return null;}}
  function registered() {return !!names[context.identity];}
  function save(next, notice) {
    if(!M.load(JSON.stringify(next), context.identity)) {message='未保存：请检查必填内容与记录关联，必填项不能只输入空格。原有档案已保留。';render();return;}
    state = next; message = notice || '已保存到这份本地学习护照。';
    try { localStorage.setItem(key(context.identity), JSON.stringify(state)); }
    catch(e) {message += ' 浏览器存储不可用或已满，本次内容仅在当前页面保留，请导出备份。';}
    render(); window.dispatchEvent(new CustomEvent('eicc:passport-change', {detail:{identity:context.identity, assessment:!!state.path, tasks:M.taskStatus(state)}}));
  }
  function button(action, label, cls, attrs) {return '<button type="button" class="pp-button '+(cls||'')+'" data-pp-action="'+action+'" '+(attrs||'')+'>'+label+'</button>';}
  function jump(viewName,label) {return button('view',label,'secondary small','data-value="'+viewName+'"');}
  function pill(text, cls) {return '<span class="pp-pill '+(cls||'')+'">'+esc(text)+'</span>';}
  function card(title, body, cls) {return '<div class="pp-card '+(cls||'')+'"><h4>'+title+'</h4>'+body+'</div>';}
  function options(list, selected) {return list.map(function(x){var p=Array.isArray(x)?x:[x,x];return '<option value="'+esc(p[0])+'" '+(p[0]===selected?'selected':'')+'>'+esc(p[1])+'</option>';}).join('');}
  function label(text, control) {return '<label>'+text+control+'</label>';}
  function input(name, val, required, max) {return '<input name="'+name+'" value="'+esc(val)+'" '+(required?'required':'')+' maxlength="'+(max||160)+'">';}
  function textarea(name, val, required, max) {return '<textarea name="'+name+'" rows="3" '+(required?'required':'')+' maxlength="'+(max||2000)+'">'+esc(val)+'</textarea>';}
  function empty(title,copy,action) {return '<div class="pp-empty"><h4>'+title+'</h4><p>'+copy+'</p>'+(action||'')+'</div>';}
  function setView(next) {view=tabs[next]?next:'path';render();}
  function render() {
    root.innerHTML = '<div class="pp-toolbar"><span>'+ (state.mode==='sample'?'完整样例':'我的本地预览')+' · '+({registration:'报名期',prep:'会前准备',live:'会议进行',post:'会后'}[context.phase]||'会前准备')+' · 不提交真实信息</span><div class="pp-actions">'+button('paper','纸质护照入口','quiet small')+button('export','导出档案','quiet small')+button('reset','切换样例／空白护照','quiet small')+'</div></div>'+
      '<div class="pp-head"><span class="eyebrow">学习护照</span><h3>一份贯穿会前、现场与会后的学习档案</h3></div>'+
      '<div class="pp-tabs" role="tablist" aria-label="学习护照内容">'+Object.keys(tabs).map(function(t){return '<button type="button" id="pp-tab-'+t+'" class="pp-tab" role="tab" aria-controls="pp-panel" aria-selected="'+(view===t)+'" tabindex="'+(view===t?'0':'-1')+'" data-pp-action="view" data-value="'+t+'">'+tabs[t]+'</button>';}).join('')+'</div>'+
      '<div id="pp-panel" role="tabpanel" aria-labelledby="pp-tab-'+view+'">'+(!registered()?empty('报名后开启你的学习护照','学习路径、记录和成果都归入同一份档案。','<a class="pp-button" href="#tickets">查看参会方式</a>'):({path:pathView,records:recordsView,organization:organizationView,outcomes:outcomesView}[view])())+'</div>'+
      '<p class="pp-feedback" role="status" aria-live="polite">'+esc(message)+'</p>';
  }
  function pathView() {
    var route = state.path;
    if(!route) return '<div class="pp-grid">'+card('从你带来的问题开始','<p>完成一份简短自评，生成与你的关注方向及参会权益相符的学习路径。</p><div class="pp-actions">'+button('assessment','开始自评')+'</div><p class="pp-help">本预览用 5 项输入演示流程，正式问卷由内容团队确认。不打分，不贴人格标签。</p>')+card('也可以先看、先记','<p>暂未自评不会挡住已有权益内的学习。你可以先查看公开内容，留下自己的记录。</p><div class="pp-actions"><a class="pp-button secondary" href="'+(context.identity==='online'?'#account/replay':context.identity==='expo'?'#expo':'#agenda')+'">查看学习内容</a>'+jump('records','开始记录')+'</div>','blue')+'</div>';
    var free = state.records.filter(function(r){return r.branch==='free';});
    return '<div class="pp-summary"><div><span class="pp-help">我带来的真实问题</span><b>'+esc(route.question)+'</b><p>关注方向：'+esc(route.focus)+' · '+esc(names[context.identity])+'</p></div>'+pill('学习路径已生成')+'</div><div class="pp-grid">'+
      card('我的学习地图','<p class="pp-help">以会前自评为起点；方案展可在开放时段穿插探索，不要求依次打卡。</p>'+(route.focusSession?'<div class="pp-quote"><b>与你的关注方向相关</b><p>'+esc(route.focusSession.date)+' · '+esc(route.focusSession.title)+'</p>'+button('focus-session','查看对应主论坛内容','quiet small')+'</div>':'')+'<div class="pp-route">'+route.stops.map(function(s,i){return '<div class="pp-stop"><span class="pp-step">'+String(i+1).padStart(2,'0')+'</span><div><b>'+esc(s.title)+'</b><p>'+esc(s.copy)+'</p><div class="pp-actions">'+(s.href?'<a class="pp-link" href="'+esc(s.href)+'">查看内容 ↗</a>':'')+button('record','留一条记录','quiet small','data-kind="'+esc(s.kind||'other')+'"')+'</div></div></div>';}).join('')+'</div><p class="pp-help">这里的推荐不代替正式选课；分论坛每天最多 1 场，场外深研课最多 1 场。</p>')+
      '<div>'+card('自由学习也有自己的位置','<p>临时遇到的人、讨论与方案，可以单独记录。</p><div class="pp-actions">'+button('record','记录一次自由探索','secondary','data-branch="free"')+'</div><div class="pp-list">'+(free.length?free.slice(-3).map(function(r){return '<div><b>'+esc(r.title)+'</b><p>'+esc(kinds[r.kind]||r.kind)+' · '+esc(r.day)+'</p></div>';}).join(''):'<p>还没有自由学习记录。</p>')+'</div>','blue')+card('把每一次学习带回来','<div class="pp-metrics"><div><b>'+state.records.length+'</b><span>学习记录</span></div><div><b>'+free.length+'</b><span>自由探索</span></div><div><b>'+state.org.posts.filter(function(p){return p.source==='self';}).length+'</b><span>知识接力</span></div></div><div class="pp-actions">'+jump('records','查看任务与记录')+button('assessment-read','查看自评','quiet small')+'</div>')+'</div></div>';
  }
  function recordMarkup(r, compact) {
    var shared = state.org.posts.some(function(p){return p.recordId===r.id&&p.source==='self';});
    return '<article class="pp-record"><div class="pp-record-meta">'+pill(kinds[r.kind]||r.kind)+pill(r.branch==='free'?'自由学习':'主路径记录','gold')+'<time>'+esc(r.day)+'</time></div><h4>'+esc(r.title)+'</h4><p class="pp-record-body">'+esc(r.text)+'</p>'+
      (r.question?'<p class="pp-quote">新问题：'+esc(r.question)+'</p>':'')+(r.nextStep?'<p class="pp-help">下一步：'+esc(r.nextStep)+'</p>':'')+
      (r.attachment?'<div class="pp-attachment">'+attachmentView(r.attachment)+'<small>'+esc(r.attachment.name)+'</small></div>':'')+
      (!compact?'<div class="pp-actions">'+button('share',shared?'已带入知识接力':'带入知识接力','quiet small','data-id="'+esc(r.id)+'" '+(shared?'disabled':''))+(r.kind==='expo'?button('solution','查看方案整理','quiet small','data-id="'+esc(r.id)+'"'):'')+'</div>':'')+'</article>';
  }
  function attachmentView(a) {
    if(/^data:image\/(png|jpeg|webp);base64,/.test(a.dataUrl||'')) return '<img src="'+esc(a.dataUrl)+'" alt="本人添加的学习材料">';
    if(/^data:audio\/[a-z0-9.+;-]+;base64,/i.test(a.dataUrl||'')) return '<audio controls preload="metadata" src="'+esc(a.dataUrl)+'"></audio>';
    return '';
  }
  function recordsView() {
    var records=state.records.filter(function(r){return r.day===day&&(filter==='all'||r.branch===filter);});
    var status=M.taskStatus(state), summary=state.daily[day];
    return '<div class="pp-filters"><label>学习日期 <select data-pp-day>'+options(days.map(function(d){return[d,'12 月 '+Number(d.slice(3))+' 日'];}),day)+'</select></label><label>记录范围 <select data-pp-filter>'+options([['all','全部记录'],['main','主路径'],['free','自由学习']],filter)+'</select></label><div class="pp-actions">'+button('record','＋ 记一笔')+button('scan','扫码／场景入口','secondary')+'</div></div><div class="pp-grid"><div>'+card('任务和记录，在这里一起完成','<div class="pp-checklist">'+[['完成自评','形成自己的学习路径',status.assessment,'assessment'],['留下一次学习记录','问题、观点、交流与现场材料',status.record,'record'],['带回一份知识接力','选择愿意分享的内容，带给所在班级或社区',status.relay,'relay']].map(function(x){return '<div><span class="pp-progress">'+(x[2]?'✓':'○')+'</span><div><b>'+x[0]+'</b><p>'+x[1]+'</p></div>'+button(x[3],x[2]?(x[3]==='record'?'再记一笔':x[3]==='relay'?'继续接力':'查看'):'去完成','quiet small')+'</div>';}).join('')+'</div><p class="pp-help">奖励需核验实际贡献，数值待公布。扫码或打开页面不等于完成任务。</p>')+'<div class="pp-records">'+(records.length?records.map(function(r){return recordMarkup(r);}).join(''):empty('这一天还没有记录','沿着路径学习，或记下路径之外的发现。',button('record','留下第一条记录','secondary')))+'</div></div><aside>'+card('我的每日小结',summary?'<p class="pp-help">依据 '+(summary.recordIds||[]).length+' 条记录整理 · 可由本人补充确认</p><p>'+esc(summary.learning)+'</p><p class="pp-quote">更好的问题：'+esc(summary.newQuestion||'尚未填写')+'</p><p>下一步：'+esc(summary.next||'尚未填写')+'</p><div class="pp-actions">'+button('daily','继续整理','secondary')+'</div>':'<p>把今天的记录放在一起，留住一个关键收获、一个新的问题和一个下一步。</p><div class="pp-actions">'+button('daily','整理今天的小结','secondary')+'</div>','blue')+card('交流之后，留下可用的方案','<p>方案展的对话，与展位方案资料、平台知识共同构成后续整理的依据。</p><div class="pp-actions">'+button('record','记录一次展位交流','secondary','data-kind="expo"')+'</div><p class="pp-help">录音与照片由你主动添加；异步AI整理将在正式服务接入后运行。</p>')+'</aside></div>';
  }
  function organizationView() {
    var org=state.org, community=org.type==='community';
    var posts=org.posts.slice().sort(function(a,b){return (b.likes||0)-(a.likes||0);});
    return '<div class="pp-grid">'+card('我的学习组织','<div class="pp-actions">'+pill(community?'主题学习社区':'普通班级')+pill('归属样例','gold')+'</div><h3>'+(community?esc(org.theme||'下一代学习（主题示例）'):'年会学习班级（示例）')+'</h3><p>'+(community?'围绕同一个主题交换经验、追问问题，一起整理一份主题共创报告。':'以所在班级为共同任务单位，交流各自的发现，把有价值的经验接力下去。')+'</p><p class="pp-help">'+(context.identity==='online'?'线上参会的组织归属尚待确认；此处仅展示两种组织的交互样例。':'正式归属从报名和座位信息读取；普通班级与主题学习社区不重复归属。')+'</p><div class="pp-actions">'+button('org-switch',community?'预览普通班级':'预览主题学习社区','secondary')+button('relay','分享我的记录')+(community?button('themes','七个主题与共创任务','quiet small'):'')+'</div>')+
      card(community?'共同任务 · 主题共创报告':'共同任务 · 知识接力','<p>'+(community?'从大会内容中收集与主题相关的发现、不同观点和待追问的问题，形成由社区共同完成的大会报告。':'选择一条值得带给同伴的收获，彼此回应与点赞，让高价值内容继续传递。')+'</p><ul class="pp-list"><li>全年会期间都可分享，不局限于转场时段</li><li>个人记录由本人选择后才进入共创区</li><li>点赞帮助筛选内容，不自动等同奖励发放</li></ul><div class="pp-actions">'+button('org-report',community?'整理主题共创报告':'查看接力摘录','secondary')+'</div>','dark')+'</div><div class="pp-card-head"><h4>我们的共创区</h4><small>按点赞排序 · 本地互动样例，尚未多人同步</small></div><div class="pp-board">'+(posts.length?posts.map(function(p){return '<article class="pp-post">'+pill(p.source==='self'?'我分享的':'同伴样例','gold')+'<h4>'+esc(p.title)+'</h4><p class="pp-record-body">'+esc(p.text)+'</p><div class="pp-post-footer"><span>'+esc(p.author)+'</span>'+button('like',(org.likedIds.indexOf(p.id)>-1?'已赞 ':'赞 ')+(p.likes||0),'quiet small','data-id="'+esc(p.id)+'" '+(p.source==='self'?'disabled':''))+button('comment','回应','quiet small','data-id="'+esc(p.id)+'"')+'</div>'+(p.comments||[]).map(function(c){return '<p class="pp-quote">'+esc(c.text||c)+'</p>';}).join('')+'</article>';}).join(''):empty('还没有共同记录','从自己的学习记录中选择一条，开启知识接力。',button('relay','分享记录','secondary')))+'</div>';
  }
  function outcomesView() {
    var report=M.report(state), plan=state.plan;
    return '<div class="pp-grid">'+card('个人学习报告','<p>从会前问题到现场记录，再到带回学校的收获。</p><div class="pp-metrics"><div><b>'+state.records.length+'</b><span>记录依据</span></div><div><b>'+Object.keys(state.daily).length+'</b><span>每日小结</span></div><div><b>'+report.freeCount+'</b><span>自由探索</span></div></div><div class="pp-actions">'+button('report','查看我的报告')+button('export-report','导出报告','secondary')+'</div><p class="pp-help">预览按现有记录整理，不编造参与经历；正式AI报告服务尚未接入。</p>')+
      card('学校 100 天行动','<p>来自同一所学校的伙伴把个人学习汇总起来，共同生成专属于本校的 100 天行动计划。</p><p class="pp-help">大会提供模板，学校团队共同填写、确认问题与分工。个人报告不会自动变成学校方案。</p><div class="pp-actions">'+button('plan',plan.problem?'继续学校行动计划':'打开学校行动模板','secondary')+'</div>','dark')+'</div>'+card('学校行动档案',plan.problem?'<div class="pp-summary"><div><b>'+esc(plan.school)+'</b><p>'+esc(plan.problem)+'</p></div>'+pill('本地草稿 · 未发布','gold')+'</div><p>行动目标：'+esc(plan.goal)+'</p><p>负责与协同：'+esc(plan.owner)+'</p><div class="pp-plan-steps">'+plan.steps.map(function(s){return '<div class="pp-plan-step"><b>'+s.day+' 天</b><p>'+esc(s.action||'由学校团队补充')+'</p><small>成果依据：'+esc(s.evidence||'待补充')+'</small></div>';}).join('')+'</div><div class="pp-actions">'+button('plan-update','记录推进进展','secondary')+button('showcase','预览成果展示','secondary')+button('export-plan','导出学校计划','quiet')+'</div><div class="pp-timeline">'+(plan.updates||[]).map(function(u){return '<div><b>'+esc(u.date)+'</b><p>'+esc(u.text)+'</p></div>';}).join('')+'</div>':empty('把个人学习，带回学校共同讨论','选择愿意带给本校的记录，结合行动模板形成学校计划。',button('plan','开始填写','secondary')))+
      '<div class="pp-grid">'+card('资料与回放','<p>继续查看权益内的大会内容。分论坛的机制、方法与共创成果，待整理发布后在这里领取。</p><div class="pp-actions"><a class="pp-button secondary" href="#account/replay">查看直播与回放权益</a></div><p class="pp-help">本预览未接入真实资料下载。</p>')+card('从行动到展示','<p>学校确认后的计划和实施成果，可进入官网展示；100 天节点开展集中成果发布与交流。</p><p class="pp-help">展示由学校确认、组委会审核后发布。本地预览不会公开任何草稿。</p>')+'</div>';
  }
  function openDialog(title,body,onSubmit) {
    closeDialog(); attachment=null;
    modal=document.createElement('dialog');modal.className='pp-modal';modal.setAttribute('aria-labelledby','pp-dialog-title');
    modal.innerHTML='<div class="pp-modal-head"><h3 id="pp-dialog-title">'+title+'</h3><button type="button" class="pp-button quiet small" data-dialog-close aria-label="关闭窗口">关闭 ×</button></div>'+body+'<p class="pp-feedback pp-error" role="alert"></p>';
    document.body.appendChild(modal);
    modal.querySelector('[data-dialog-close]').addEventListener('click',closeDialog);
    modal.addEventListener('cancel',function(e){e.preventDefault();closeDialog();});
    modal.addEventListener('click',function(e){if(e.target===modal)closeDialog();});
    if(onSubmit)modal.querySelector('form').addEventListener('submit',async function(e){e.preventDefault();var submit=e.submitter;if(submit)submit.disabled=true;try{Array.from(e.target.elements).forEach(function(field){if(field.required&&field.type!=='checkbox'&&typeof field.value==='string'&&!field.value.trim())throw new Error('请填写必填内容，不能只输入空格。');});await onSubmit(new FormData(e.target),e.target);}catch(err){if(modal)modal.querySelector('[role=alert]').textContent=err.message;}finally{if(submit)submit.disabled=false;}});
    modal.showModal();
  }
  function stopRecording() {clearTimeout(recordingTimer);recordingTimer=null;if(recorder&&recorder.state!=='inactive'){audioPending=true;recorder.stop();}if(stream)stream.getTracks().forEach(function(t){t.stop();});stream=null;}
  function closeDialog() {if(modal){stopRecording();modal.close();modal.remove();modal=null;}attachment=null;audioPending=false;}
  function form(body,submit) {return '<form class="pp-form">'+body+'<div class="pp-actions"><button class="pp-button" type="submit">'+(submit||'保存')+'</button></div></form>';}
  function value(fd,name){return String(fd.get(name)||'').trim();}
  function assessmentDialog() {
    if(state.path){action('assessment-read');return;}
    openDialog('会前自评 · 从真实问题出发',form('<p class="pp-help">5 项输入仅用于展示推荐流程，非正式自评题库。暂时不填，也可以继续已有权益内的学习。</p>'+label('1. 所属学校（预览请用示例名称）',input('school','',true,80))+label('2. 我的工作角色',input('role','',false,60))+label('3. 当前最关注的方向','<select name="focus" required>'+options([['','请选择'],['学生','学生'],['学习','学习'],['课程','课程'],['技术','技术'],['校园','校园'],['教师','教师'],['学校','学校']],'')+'</select>')+label('4. 想带到年会的一个真实问题',textarea('question','',true,500))+label('5. 这次最希望获得什么',textarea('need','',true,500))+'<p class="pp-help">确认后形成这次参会的主路径。后续的新发现另列为自由学习记录。</p>','确认并生成学习路径'),function(fd){var next=M.completeAssessment(state,{school:value(fd,'school'),role:value(fd,'role'),focus:value(fd,'focus'),question:value(fd,'question'),need:value(fd,'need')});closeDialog();save(next,'学习路径已生成；新问题和自由探索可继续记录。');});
  }
  function recordDialog(kind,branch) {
    kind=kinds[kind]?kind:'forum';branch=branch==='free'?'free':(state.path?'main':'free');
    if(context.identity==='expo'&&kind==='forum')kind='expo';
    openDialog('留下一次学习记录',form('<div class="pp-fields">'+label('日期','<select name="day">'+options(days,day)+'</select>')+label('来自哪里','<select name="kind">'+options(Object.keys(kinds).map(function(k){return[k,kinds[k]];}),kind)+'</select>')+'</div>'+label('记录归属','<select name="branch">'+options([['main','主路径记录'],['free','自由学习记录']],branch)+'</select>')+label('场次、展位或这次记录的标题',input('title',kind==='expo'?'云涌集 · 展位交流':'',true,160))+label('我的收获／交流内容',textarea('text','',false,4000))+label('新的问题（选填）',textarea('question','',false,500))+label('准备继续做什么（选填）',textarea('nextStep','',false,500))+
      '<div class="pp-file"><label>添加照片或音频（选填）<input type="file" name="file" accept="image/png,image/jpeg,image/webp,audio/*"></label><p class="pp-help">可拍照补录纸质笔记，或添加交流录音。单个文件不超过 2 MB；请勿上传敏感材料。</p><label class="pp-check"><input type="checkbox" name="consent">我已取得记录涉及人员的同意</label><button type="button" class="pp-button secondary small" data-pp-mic>开始本地录音</button><span data-pp-audio-status class="pp-help"></span></div><p class="pp-help">只保存在本机。正式扫码会带入对应场次／展位；当前不会上传或自动开启录音。</p>','存入学习护照'),async function(fd,formEl){
        if(recorder&&recorder.state==='recording')throw new Error('请先结束录音，再保存记录。');if(audioPending)throw new Error('录音正在整理，请稍后保存。');
        var file=formEl.elements.file.files[0];if(file)attachment=await readFile(file);
        if(attachment&&!fd.get('consent'))throw new Error('请先确认已取得相关人员同意。');
        var next=M.addRecord(state,{day:value(fd,'day'),kind:value(fd,'kind'),branch:value(fd,'branch'),title:value(fd,'title'),text:value(fd,'text'),question:value(fd,'question'),nextStep:value(fd,'nextStep'),attachment:attachment||undefined});
        day=value(fd,'day');view='records';filter='all';closeDialog();save(next,'记录已保存，可继续整理每日小结，或选择带入知识接力。');
      });
    modal.querySelector('[data-pp-mic]').addEventListener('click',async function(){var btn=this,dialog=modal,status=dialog.querySelector('[data-pp-audio-status]');
      if(recorder&&recorder.state==='recording'){stopRecording();btn.textContent='重新录音';return;}
      if(!dialog.querySelector('[name=consent]').checked){status.textContent='请先勾选记录同意。';return;}
      if(!navigator.mediaDevices||!window.MediaRecorder){status.textContent='当前浏览器不支持录音，请添加音频文件或文字。';return;}
      btn.disabled=true;
      try{attachment=null;stream=await navigator.mediaDevices.getUserMedia({audio:true});if(modal!==dialog){stopRecording();return;}var chunks=[];recorder=new MediaRecorder(stream);recorder.ondataavailable=function(e){if(e.data.size)chunks.push(e.data);};recorder.onstop=async function(){if(modal!==dialog)return;try{var audioFile=await readFile(new File(chunks,'学习录音.webm',{type:chunks[0]?chunks[0].type:'audio/webm'}));if(modal===dialog){attachment=audioFile;status.textContent='录音已留在本地，保存后进入护照。';}}catch(e){status.textContent=e.message;}finally{if(modal===dialog)audioPending=false;}btn.textContent='重新录音';};recorder.start();status.textContent='正在本地录音 · 最长 60 秒，点击结束';btn.textContent='结束录音';recordingTimer=setTimeout(stopRecording,60000);}
      catch(e){status.textContent='未能开启录音，可改用文字或音频文件。';stopRecording();}finally{btn.disabled=false;}
    });
  }
  function readFile(file) {return new Promise(function(resolve,reject){if(file.size>2*1024*1024)return reject(new Error('文件超过 2 MB，请压缩后添加，或先保存文字。'));var mime=file.type.split(';')[0];if(!/^(image\/(png|jpeg|webp)|audio\/(webm|ogg|mpeg|mp4|wav))$/.test(mime))return reject(new Error('仅支持 PNG、JPEG、WebP 图片及常用音频文件。'));var reader=new FileReader();reader.onload=function(){resolve({name:file.name,type:mime,dataUrl:reader.result});};reader.onerror=function(){reject(new Error('文件读取失败，请重试。'));};reader.readAsDataURL(new Blob([file],{type:mime}));});}
  function dailyDialog() {
    var summary=M.summarize(state,day),old=state.daily[day]||{};
    if(!summary.recordIds.length){message='这一天还没有记录，请先留下学习内容。';view='records';render();return;}
    openDialog('12 月 '+Number(day.slice(3))+' 日 · 每日小结',form('<p class="pp-help">以下依据只来自当天已保存的记录，由你整理确认；不会调整原有学习路径。</p><div class="pp-evidence">'+summary.entries.map(function(r){return '<p><b>'+esc(r.title)+'</b><br>'+esc(r.text)+'</p>';}).join('')+'</div>'+label('今天最重要的收获',textarea('learning',old.learning||'',true,2000))+label('我带走的更好的问题',textarea('newQuestion',old.newQuestion||'',false,1000))+label('接下来准备做什么',textarea('next',old.next||'',false,1000)),'保存每日小结'),function(fd){var next=structuredClone(state);next.daily[day]={recordIds:summary.recordIds,learning:value(fd,'learning'),newQuestion:value(fd,'newQuestion'),next:value(fd,'next')};closeDialog();save(next);});
  }
  function relayDialog() {
    var available=state.records.filter(function(r){return !state.org.posts.some(function(p){return p.recordId===r.id&&p.source==='self';});});
    if(!available.length){message=state.records.length?'当前记录已经分享到知识接力。':'先留下一条学习记录，再选择分享给同伴。';view='records';render();return;}
    openDialog('把一条记录带给同伴',form('<p>只分享你主动选择的这条内容，不会公开整份护照。</p>'+label('选择记录','<select name="recordId">'+options(available.map(function(r){return[r.id,r.title];}),'')+'</select>')+'<p class="pp-help">当前仅演示本地共创区，尚未向其他参会者发送。</p>','确认分享（本地预览）'),function(fd){var next=M.shareRecord(state,value(fd,'recordId'));view='organization';closeDialog();save(next,'已进入本地共创区，正式系统将同步至所属班级或主题社区。');});
  }
  function reportHTML() {
    var r=M.report(state);
    if(!state.records.length)return empty('还没有可整理的学习依据','你的报告将从实际保存的记录开始，不会凭空补全经历。');
    return '<div class="pp-evidence"><b>会前自评与原有路径</b><p>学校：'+esc(state.assessment&&state.assessment.school||'未填写')+' · 角色：'+esc(state.assessment&&state.assessment.role||'未填写')+'</p><p>我希望获得：'+esc(state.assessment&&state.assessment.need||'未填写')+'</p><p>原有路径：'+esc(state.path?state.path.stops.map(function(s){return s.title;}).join(' → '):'尚未自评')+'</p></div><div class="pp-summary"><div><span class="pp-help">会前的起点</span><b>'+esc(r.question||'尚未填写自评问题')+'</b><p>关注：'+esc(r.focus||'尚未填写')+'</p></div>'+pill(state.mode==='sample'?'样例报告':'本地报告草稿','gold')+'</div><h4>我的学习依据</h4><div class="pp-records">'+state.records.map(function(x){return recordMarkup(x,true);}).join('')+'</div><h4>与展位交流关联的方案</h4><div class="pp-list">'+(state.solutions||[]).map(function(solution){var record=state.records.find(function(x){return x.id===solution.recordId;});return '<div><b>'+esc(record?record.title:'交流记录')+'</b><p>'+esc(solution.proposal)+'</p><p>待核实：'+esc(solution.verify||'未填写')+'</p><p>下一步：'+esc(solution.next||'未填写')+'</p><small>本人整理 · 可追溯至原始记录</small></div>';}).join('')+'</div><h4>每日小结与新的追问</h4>'+Object.keys(state.daily).map(function(d){var s=state.daily[d];return '<div class="pp-day-summary"><b>'+esc(d)+'</b><p>'+esc(s.learning)+'</p><p>'+esc(s.newQuestion)+'</p><small>依据 '+(s.recordIds||[]).length+' 条记录</small></div>';}).join('')+'<div class="pp-quote"><b>带回学校继续讨论</b><p>'+esc((r.newQuestions||[]).join('；')||'新的问题尚待你补充。')+'</p><p>'+esc((r.nextSteps||[]).join('；')||'下一步行动尚待你与学校伙伴共同确认。')+'</p></div><p class="pp-help">AI整合尚未接入。这里展示可追溯的记录摘编，不包含未记录的参与或推断。</p>';
  }
  function planDialog() {
    var p=state.plan;
    openDialog('学校 100 天行动模板',form('<p>大会给模板，学校定行动。请与本校伙伴共同确认以下内容。</p><p class="pp-help">字段与 30／60／100 天节点为可调整的原型示例，非正式模板定稿。当前不联网协作。</p>'+label('学校',input('school',p.school||(state.assessment&&state.assessment.school)||'',true,100))+label('我们准备共同解决的问题',textarea('problem',p.problem||'',true,1000))+label('100 天希望看见的变化',textarea('goal',p.goal||'',true,1000))+label('负责人与学校团队分工',textarea('owner',p.owner||'',true,1000))+'<fieldset><legend>选择带入学校讨论的学习依据</legend>'+state.records.map(function(r){return '<label class="pp-check"><input type="checkbox" name="recordIds" value="'+esc(r.id)+'" '+((p.recordIds||[]).indexOf(r.id)>-1?'checked':'')+'>'+esc(r.title)+'</label>';}).join('')+'</fieldset><div class="pp-plan-steps">'+[30,60,100].map(function(d){var s=p.steps.find(function(x){return x.day===d;})||{};return '<fieldset><legend>'+d+' 天节点</legend>'+label('具体行动',textarea('action'+d,s.action||'',false,1000))+label('用什么成果或证据检验',input('evidence'+d,s.evidence||'',false,300))+'</fieldset>';}).join('')+'</div><p class="pp-help">保存仅形成这台设备上的学校草稿；不会自动发布到官网。</p>','保存学校计划草稿'),function(fd){var next=M.savePlan(state,{school:value(fd,'school'),problem:value(fd,'problem'),goal:value(fd,'goal'),owner:value(fd,'owner'),steps:[30,60,100].map(function(d){return{day:d,action:value(fd,'action'+d),evidence:value(fd,'evidence'+d)};}),recordIds:fd.getAll('recordIds'),updates:p.updates||[]});closeDialog();save(next);});
  }
  function solutionDialog(id) {
    var r=state.records.find(function(x){return x.id===id;});if(!r)return;
    var s=(state.solutions||[]).find(function(x){return x.recordId===id;})||{};
    openDialog('展位交流 → 我的方案草稿',form('<div class="pp-evidence"><b>已保存的依据：'+esc(r.title)+'</b><p>'+esc(r.text)+'</p><p>我的问题：'+esc(r.question||(state.assessment&&state.assessment.question)||'待补充')+'</p></div><div class="pp-notice">交流记录已保存 → 展位资料待关联 → AI异步整理待接入 → 本人确认</div><p class="pp-help">正式服务会结合展位方案、对话内容与平台知识生成草稿。当前不伪造AI处理结果，你可先手动整理。</p>'+label('对我有用的方案思路',textarea('proposal',s.proposal||'',true,3000))+label('需要向方案方核实什么',textarea('verify',s.verify||'',false,1000))+label('下一步联系／行动',textarea('next',s.next||'',false,1000)),'保存本人整理的方案'),function(fd){var next=structuredClone(state);next.solutions=(next.solutions||[]).filter(function(x){return x.recordId!==id;});next.solutions.push({recordId:id,status:'manual-draft',proposal:value(fd,'proposal'),verify:value(fd,'verify'),next:value(fd,'next')});closeDialog();save(next,'方案草稿已与这次交流记录关联，未冒充AI生成。');});
  }
  function download(name,body,type) {var url=URL.createObjectURL(new Blob([body],{type:type||'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
  function reportText() {var r=M.report(state);return '# 我的年会学习报告（'+(state.mode==='sample'?'样例':'本地草稿')+'）\n\n会前问题：'+(r.question||'未填写')+'\n关注方向：'+(r.focus||'未填写')+'\n学校：'+(state.assessment&&state.assessment.school||'未填写')+'\n角色：'+(state.assessment&&state.assessment.role||'未填写')+'\n希望获得：'+(state.assessment&&state.assessment.need||'未填写')+'\n原有路径：'+(state.path?state.path.stops.map(function(s){return s.title;}).join(' → '):'未生成')+'\n\n'+state.records.map(function(x){return '## '+x.day+' · '+x.title+'\n'+x.text+'\n新问题：'+(x.question||'未填写')+'\n下一步：'+(x.nextStep||'未填写');}).join('\n\n')+'\n\n## 每日小结\n'+Object.keys(state.daily).map(function(d){var s=state.daily[d];return d+'\n'+s.learning+'\n'+s.newQuestion+'\n'+s.next;}).join('\n\n')+'\n\n## 展位方案草稿（本人整理）\n'+(state.solutions||[]).map(function(s){return s.proposal+'\n待核实：'+s.verify+'\n下一步：'+s.next;}).join('\n\n')+'\n\n本报告仅摘编已保存记录，未接入AI服务。';}
  function action(name,el) {
    var id=el&&el.dataset.id;
    if(name==='view'){setView(el.dataset.value);return;}
    if(!registered()&&['paper','reset'].indexOf(name)<0)return;
    if(name==='assessment')return assessmentDialog();
    if(name==='focus-session'&&state.path&&state.path.focusSession){var agendaButton=document.querySelector('[data-day="'+state.path.focusSession.dayId+'"]');if(agendaButton)agendaButton.click();location.hash='agenda';return;}
    if(name==='record')return recordDialog(el&&el.dataset.kind,el&&el.dataset.branch);
    if(name==='daily')return dailyDialog();
    if(name==='relay')return relayDialog();
    if(name==='plan')return planDialog();
    if(name==='solution')return solutionDialog(id);
    if(name==='report')return openDialog('我的个人学习报告',reportHTML());
    if(name==='themes')return openDialog('七个主题侧面 · 共创任务预览','<p>会议讨论确定以大会的七个主题侧面组织共创，每个主题社区共同形成一份大会报告。</p><p class="pp-help">以下按当前主论坛主题呈现；正式任务书、参与名额与入驻嘉宾待公布，不在此更改报名归属。</p><div class="pp-list">'+communityThemes.map(function(theme){return '<div><b>'+theme+'</b><p>围绕这一主题，整理大会观点、同伴经验与新的问题，共创主题报告。</p></div>';}).join('')+'</div>');
    if(name==='assessment-read')return openDialog('我的会前自评',state.assessment?'<div class="pp-list">'+Object.keys(state.assessment).map(function(k){return '<p><b>'+esc(({school:'学校',role:'工作角色',focus:'关注方向',question:'真实问题',need:'希望获得'})[k]||k)+'</b><br>'+esc(state.assessment[k])+'</p>';}).join('')+'</div>':empty('尚未填写','完成自评后，在这里查看学习起点。'));
    if(name==='share'){save(M.shareRecord(state,id),'已选择这条记录进入知识接力（本地预览）。');return;}
    if(name==='like'){save(M.toggleLike(state,id),'已更新本地点赞，不会自动发放奖励。');return;}
    if(name==='comment')return openDialog('回应这份知识接力',form(label('我的回应',textarea('text','',true,1000)),'保存本地回应'),function(fd){var next=structuredClone(state),p=next.org.posts.find(function(x){return x.id===id;});if(p){p.comments=p.comments||[];p.comments.push({text:value(fd,'text'),author:'我'});}closeDialog();save(next);});
    if(name==='org-switch'){var next=structuredClone(state);next.org.type=next.org.type==='class'?'community':'class';next.org.theme='下一代学习（主题示例）';save(next,'已切换组织展示样例；正式归属以报名信息为准，两个组织不重复归属。');return;}
    if(name==='org-report')return openDialog(state.org.type==='community'?'主题共创报告 · 摘录预览':'知识接力 · 高赞摘录','<p class="pp-help">仅从当前共创区提取依据，尚未形成经成员确认的正式报告。</p><div class="pp-list">'+state.org.posts.slice().sort(function(a,b){return b.likes-a.likes;}).map(function(p){return '<div><b>'+esc(p.title)+'</b><p>'+esc(p.text)+'</p><small>'+esc(p.author)+' · '+p.likes+' 赞</small></div>';}).join('')+'</div><p class="pp-help">正式流程：收集各方观点 → 成员共同整理 → 确认报告 → 组委会审核发布。</p>');
    if(name==='plan-update')return openDialog('学校行动进展',form(label('日期','<input name="date" type="date" required>')+label('我们做了什么、看到了什么变化',textarea('text','',true,2000)),'保存行动记录'),function(fd){var next=structuredClone(state);next.plan.updates.push({date:value(fd,'date'),text:value(fd,'text')});closeDialog();save(next);});
    if(name==='showcase')return openDialog('学校行动成果展示 · 预览',card(esc(state.plan.school),'<p>'+esc(state.plan.problem)+'</p><p>'+esc(state.plan.goal)+'</p><div class="pp-timeline">'+state.plan.updates.map(function(u){return '<div><b>'+esc(u.date)+'</b><p>'+esc(u.text)+'</p></div>';}).join('')+'</div>')+'<p class="pp-help">本窗口不是发布操作。正式展示须由学校确认公开范围，并经组委会审核。</p>');
    if(name==='export'){download('年会学习护照-本地备份.json',JSON.stringify(state,null,2),'application/json');message='已导出本地档案，包含你主动保存的记录与附件，请妥善保管。';render();return;}
    if(name==='export-report'){download('我的年会学习报告.md',reportText());return;}
    if(name==='export-plan'){var p=state.plan;download('学校100天行动计划.md','# '+p.school+' · 100 天行动计划（本地草稿）\n\n问题：'+p.problem+'\n目标：'+p.goal+'\n分工：'+p.owner+'\n\n'+p.steps.map(function(s){return '## '+s.day+' 天\n'+s.action+'\n成果依据：'+s.evidence;}).join('\n\n')+'\n\n'+p.updates.map(function(u){return u.date+' '+u.text;}).join('\n'));return;}
    if(name==='reset')return openDialog('选择体验方式',form('<p>会覆盖当前票种的本地护照。其他票种预览不受影响，已有内容可先导出备份。</p>'+label('体验方式','<select name="mode"><option value="personal">从空白护照开始</option><option value="sample">查看完整样例</option></select>')+'<label class="pp-check"><input type="checkbox" required>确认替换当前本地草稿</label>','确认切换'),function(fd){var next=M.create(context.identity,value(fd,'mode')==='sample');view='path';closeDialog();save(next,'已切换体验方式。');});
    if(name==='vote'){
      openDialog('主论坛返场投票 · 交互样例','<p>演讲结束时扫描嘉宾 PPT 二维码参与投票，当日得票最高的嘉宾返场分享 10 分钟。</p><p class="pp-help">本预览用 A／B 代表示例候选人，只记录本机选择，不代表真实投票规则、嘉宾或票数。</p><div class="pp-actions">'+['a','b'].map(function(c){return '<button type="button" class="pp-button secondary" data-vote="'+c+'">'+(state.ballots&&state.ballots[day]===c?'已选择 · ':'选择 · ')+'嘉宾 '+c.toUpperCase()+'（样例）</button>';}).join('')+'</div>');
      modal.querySelectorAll('[data-vote]').forEach(function(b){b.addEventListener('click',function(){var next=structuredClone(state);next.ballots=next.ballots||{};next.ballots[day]=b.dataset.vote;closeDialog();save(next,'已记录返场选择样例；未提交真实投票。');});});return;
    }
    if(name==='paper'||name==='scan'){
      openDialog(name==='paper'?'纸质护照，与线上档案相连':'选择你的学习场景','<p class="pp-help">纸质手册提供统一地图、场次与笔记区，扫码进入自己的线上护照。本预览用按钮代替正式二维码。</p><div class="pp-board">'+[['path','个性化学习地图'],['paper','拍照补录纸质笔记'],['expo','记录展位交流'],['relay','进入班级／社区共创'],['daily','整理每日小结'],['report','查看学习报告'],['fishbowl','鱼缸对话记录'],['evening','晚自习 · 交个朋友'],['ai','AI共创体验记录'],['vote','主论坛返场投票']].map(function(x){return '<button type="button" class="pp-button secondary" data-entry="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div><div class="pp-list"><p><b>鱼缸对话</b><br>在指定交流区追问、认识同行，愿意留下的收获可记为自由学习。</p><p><b>晚自习 · 交个朋友</b><br>在组委会合作酒店开展，面向通过组委会预订相应酒店的参会者；可交流、交朋友，也可做学校内部复盘，不设强制学术任务。</p><p><b>AI共创</b><br>现场体验一体化平台的智能体等能力，愿意保留的成果可进入自己的学习记录。</p></div>');
      modal.querySelectorAll('[data-entry]').forEach(function(b){b.addEventListener('click',function(){var entry=b.dataset.entry;closeDialog();if(entry==='path')setView('path');else if(['paper','expo','fishbowl','evening','ai'].indexOf(entry)>-1)recordDialog(entry,['fishbowl','evening','ai'].indexOf(entry)>-1?'free':undefined);else action(entry);});});return;
    }
  }
  root.addEventListener('click',function(e){var el=e.target.closest('[data-pp-action]');if(el&&!el.disabled)try{action(el.dataset.ppAction,el);}catch(err){message=err.message;render();}});
  root.addEventListener('change',function(e){if(e.target.hasAttribute('data-pp-day')){day=e.target.value;render();}if(e.target.hasAttribute('data-pp-filter')){filter=e.target.value;render();}});
  root.addEventListener('keydown',function(e){if(e.target.getAttribute('role')!=='tab'||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();var keys=Object.keys(tabs),i=keys.indexOf(view);setView(keys[e.key==='Home'?0:e.key==='End'?3:(i+(e.key==='ArrowRight'?1:3))%4]);root.querySelector('[aria-selected=true]').focus();});
  function sync(event) {
    closeDialog();var next=event.detail,changed=context.identity!==next.identity;
    context=Object.assign({},context,next);
    if(changed)state=restore(context.identity)||M.create(context.identity,!!context.assessment);
    else if(state.mode==='sample'&&!!state.path!==!!context.assessment)state=M.create(context.identity,!!context.assessment);
    message='';render();
  }
  window.addEventListener('eicc:demo-state',sync);
  window.addEventListener('eicc:registration-preview',function(e){context={identity:e.detail.identity,phase:'prep',assessment:false};state=M.create(context.identity,false);save(state,'报名预览完成，可以开始会前自评。');});
  window.addEventListener('hashchange',closeDialog);
  window.addEventListener('pagehide',stopRecording);
  window.EICCPassport={
    mount:function(host,nextView){(host||home).appendChild(root);if(nextView&&tabs[nextView])view=nextView;render();},
    show:setView,
    status:function(){return {assessment:!!state.path,tasks:M.taskStatus(state),records:state.records.length};}
  };
  render();
}());
