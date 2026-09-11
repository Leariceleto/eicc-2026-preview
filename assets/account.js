// 一键查询：所有个人数据均为预览样例，未连接登录、报名或兑换接口。
(function(){
  'use strict';
  var root = document.querySelector('[data-account-hub]');
  var M = window.EICCAccountModel, params = new URLSearchParams(location.search);
  // 填入已确认的平台充值页地址后，按钮直接跳转；未配置时显示接入说明，不猜测支付路由。
  var platformRechargeUrl = '';
  var platformMemberCenterUrl = 'https://one.dett.info/PersonalCenter';
  var explicitRole = Object.prototype.hasOwnProperty.call(M.roles,params.get('queryRole'));
  var role = explicitRole ? params.get('queryRole') : 'both';
  var area = role==='buyer' ? 'managed' : 'personal', proxyTab='registration', orderFilter='all';
  var initialIdentity = params.get('demo')==='1' && params.get('identity');
  var initialPhase = params.get('demo')==='1' && params.get('phase');
  var account = M.create(role,initialIdentity||'combo',true);
  var targetId='', pendingChoice=null;
  var state = {identity:initialIdentity||'combo', phase:initialPhase||'prep', course:true, assessment:true, checkin:false};
  if (initialIdentity==='anonymous'||initialIdentity==='guest') {
    if(!explicitRole) account=M.create('none','combo',false);
    account.loggedIn=initialIdentity!=='anonymous';
  }
  var names = {main:'主论坛', combo:'主论坛＋深研课', online:'线上参会', expo:'独立方案展'};
  var phases = {registration:'报名期', prep:'会前准备', live:'会议进行', post:'会后'};
  var prices = {main:'2,800', combo:'2,900', online:'1,560', expo:'300'};
  var claimed = {}, redeemed = {}, notice = '', passportRoute = null;
  var tasks = [
    {id:'assessment', title:'完成学习自评', copy:'梳理关注方向，生成个人学习路径', coins:60},
    {id:'record', title:'留下一条学习记录', copy:'用文字、照片或语音记录一次学习所得', coins:40},
    {id:'relay', title:'参与一次知识接力', copy:'把收获分享给所在班级或主题学习社区', coins:80}
  ];
  var products = [
    {id:'resource', title:'学校创新方案资料包', copy:'电子资料 · 兑换后在记录中查看', coins:100},
    {id:'notebook', title:'年会学习笔记本', copy:'实物产品 · 兑换后查看领取状态', coins:180}
  ];
  function registered(){return !!M.self(account);}
  function forumRight(){return registered() && M.hasForum(M.self(account));}
  function onsite(){return registered() && state.identity !== 'online';}
  function studyReady(){return registered() && window.EICCPassport.status().assessment;}
  function stageOpen(){return state.phase !== 'registration';}
  function coins(){
    if(!account.loggedIn) return 0;
    return 240 + tasks.reduce(function(n,t){return n + (claimed[t.id] ? t.coins : 0);},0) - products.reduce(function(n,p){return n + (redeemed[p.id] ? p.coins : 0);},0);
  }
  function status(text, ready){return '<span class="hub-status'+(ready?' ready':'')+'">'+text+'</span>';}
  function link(key, text, cls){return '<a class="'+(cls||'hub-link')+'" href="#account/'+key+'">'+text+'</a>';}
  function action(href, text, secondary, attrs){return '<a class="hub-button'+(secondary?' secondary':'')+'" href="'+href+'" '+(attrs||'')+'>'+text+'</a>';}
  function box(title, content){return '<div class="hub-detail-box"><h2>'+title+'</h2>'+content+'</div>';}
  function fields(rows){return '<dl>'+rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>';}).join('')+'</dl>';}
  function card(key, title, content){return '<a class="hub-card" href="#account/'+key+'"><h3>'+title+'</h3>'+content+'</a>';}
  function entry(title, copy, tail){return '<div class="hub-entry"><div><b>'+title+'</b><p>'+copy+'</p></div>'+(tail||'')+'</div>';}
  function noData(title, copy, cta){return '<div class="hub-empty"><h2>'+title+'</h2><p>'+copy+'</p>'+(cta?'<div class="hub-detail-actions">'+cta+'</div>':'')+'</div>';}
  function note(text){return '<div class="hub-notice">'+text+'</div>';}
  function learningLink(view,text,textClass){return action('#account/'+(view==='records'?'passport':view),text);}
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function button(text,attrs,secondary){return '<button type="button" class="hub-button'+(secondary?' secondary':'')+'" '+attrs+'>'+text+'</button>';}
  function rechargeButton(){
    return action(platformRechargeUrl||'#account/recharge','充值未来币',false,'data-platform-recharge'+(platformRechargeUrl?' target="_blank" rel="noopener noreferrer"':''));
  }
  function previewControls(){
    return '<details class="hub-demo"><summary>身份预览 · '+(account.loggedIn?M.roles[M.role(account)]:'未登录')+'</summary><div class="hub-role-options" aria-label="预览查询身份">'+Object.keys(M.roles).map(function(r){return '<button type="button" data-hub-role="'+r+'" aria-pressed="'+(account.loggedIn&&M.role(account)===r)+'">'+M.roles[r]+'</button>';}).join('')+'</div><p>仅切换示例关系；正式身份由登录账号与报名记录决定。全部操作不提交、不付款。</p></details>';
  }
  function wallet(){
    return '<div class="hub-group hub-wallet-group"><div class="hub-group-head"><h2>我的未来币与兑换</h2>'+link('coins','收支明细')+'</div><div class="hub-wallet"><div><div class="hub-wallet-label">当前登录账号 · 138****6666（示例）</div><div class="hub-wallet-balance-row"><div class="hub-balance"><strong>'+coins()+'</strong><span>枚可用未来币</span></div></div><p>余额与兑换记录属于当前账号，不随代办对象切换。</p></div><div class="hub-wallet-actions">'+link('tasks','做任务赚币','')+link('exchange','去兑换','')+link('redemptions','我的兑换','')+link('favorites','收藏的方案','')+'</div></div></div>';
  }
  function personalOverview(){
    if(!registered())return noData('还没有本人的参会报名','可以为自己报名，也可以为学校同事办理报名。已有代报名记录的参会者，请使用报名时填写的本人账号查询。',action('#tickets','查看参会方式')+action('#account/help','联系会务',true));
    var p=M.self(account), forum=forumRight(), selections=account.selections[p.id];
    var seat=forum?(stageOpen()?'A 区 · 08 排 · 16 座':'座位待公布'):state.identity==='online'?'线上参会，无需现场座位':'方案展通行，无主论坛座位';
    var top='<div class="hub-top"><div class="hub-ticket"><div class="hub-label">我的报名'+status(phases[state.phase])+'</div><h2>'+names[state.identity]+'</h2><p>第十三届中国教育创新年会</p><p>2026.12.01–12.04 · 中国广州</p>'+link('registration','查看我的参会权益')+'</div><div class="hub-seat"><div class="hub-label">'+(state.identity==='online'?'我的线上参会':'我的座位与入场')+'</div><h2>'+seat+'</h2><p>'+(forum&&stageOpen()?(state.checkin?'已签到（示例）':'未签到 · 座位号为演示样例'):'按本人参会权益查看对应信息')+'</p>'+link(state.identity==='online'?'replay':'seat',state.identity==='online'?'查看直播与回放':'查看入场信息')+'</div></div>';
    var arr='<div class="hub-group"><div class="hub-group-head"><h2>我的参会安排</h2><span>选课、出行与住宿</span></div><div class="hub-arrangements">';
    arr+=card('forum','我的分论坛',status(forum?((selections['12-02']?1:0)+(selections['12-03']?1:0))+' 天已选':'当前权益不包含',forum&&!!selections['12-02'])+'<p>'+M.courseName(account,p.id,'12-02')+'</p><p>'+M.courseName(account,p.id,'12-03')+'</p>');
    arr+=card('offsite','场外深研课',status(state.identity==='combo'?(selections.offsite?'已选课':'已含权益 · 待选课'):forum?'尚未选购':'当前权益不包含',!!selections.offsite)+'<p>12 月 5 日 · 每人最多选择 1 场</p><p>'+(state.identity==='combo'?M.courseName(account,p.id,'offsite'):'查看选购与课程说明')+'</p>');
    arr+=card('hotel','我的酒店',status(p.hotel&&stageOpen()?'已预订':'暂无预订',p.hotel&&stageOpen())+'<p>'+(p.hotel&&stageOpen()?'协议酒店 · 大床房<br>12 月 1 日入住 · 12 月 4 日离店':'查看本人的住宿安排与入住信息')+'</p>')+'</div></div>';
    var learning='<div class="hub-group"><div class="hub-group-head"><h2>我的学习护照</h2><span>只属于本人的学习档案</span></div><div class="hub-learning">';
    learning+=card('path','我的学习路径','<p>'+(studyReady()?'已生成 · 查看我的学习安排':'完成自评，查看个人学习安排')+'</p>');
    learning+=card('passport','我的学习护照','<p>学习任务、个人记录与自由探索</p>');
    learning+=card('organization','我的学习组织','<p>查看班级或主题学习社区</p>');
    learning+=card('outcomes','我的学习成果','<p>个人学习报告与学校 100 天行动</p>')+'</div></div>';
    var detailRows=[['参会人',p.name],['单位',p.school||'--'],['联系电话',p.phone],['主论坛座位',seat],['报名订单',p.orderId],['场外深研课',M.courseName(account,p.id,'offsite')]];
    top='<div class="hub-section"><div class="hub-section-head"><div><h2>我的参会信息</h2><p>本人报名、座位与入场状态</p></div><span class="hub-section-hint">第十三届中国教育创新年会</span></div><div class="personal-card"><div class="personal-main"><div><span class="personal-label">我的报名</span><h3>'+names[state.identity]+'</h3><p>第十三届中国教育创新年会</p><p>2026.12.01–12.04 · 中国广州</p></div><span class="personal-checkin">'+phases[state.phase]+' · '+(state.checkin?'已签到':'尚未签到')+'</span></div><div class="personal-details">'+detailRows.map(function(r){return '<div><span class="detail-label">'+r[0]+'</span><div class="detail-value">'+esc(r[1])+'</div></div>';}).join('')+'</div></div></div>';
    return top+arr;
  }
  function managedOverview(){
    var people=M.managed(account), active=people.filter(function(p){return M.active(account,p);});
    return '<div class="hub-management-head"><div><span class="hub-label">我经办的报名</span><h2>为同事安排好每一程</h2><p>查订单、核对参会人，分别办理选课与住宿查询。</p></div>'+link('orders','查看全部订单')+'</div><div class="hub-management-metrics">'+
      [['orders',M.orders(account).length,'报名订单'],['managed',active.length,'有效参会人'],['orders?status=pending',M.orders(account).filter(function(o){return o.status==='pending';}).length,'待支付订单']].map(function(x){return '<a href="#account/'+x[0]+'"><b>'+x[1]+'</b><span>'+x[2]+'</span><span aria-hidden="true">↗</span></a>';}).join('')+'</div><div class="hub-group"><div class="hub-group-head"><h2>参会人安排</h2>'+link('managed','查看全部参会人')+'</div><div class="hub-managed-people">'+active.map(function(p){return '<a class="hub-person-card" href="#account/proxy?person='+p.id+'"><span class="hub-person-mark" aria-hidden="true">'+esc(p.name.slice(0,1))+'</span><div><h3>'+esc(p.name)+(p.userId===account.userId?' <small>本人</small>':'')+'</h3><p>'+names[p.ticket]+' · '+esc(p.phone)+'</p><p>'+esc(p.orderId)+'</p></div><span class="hub-person-arrow">代办详情 ↗</span></a>';}).join('')+'</div></div>';
  }
  // 展示布局来自前端年会分支 da11507；继续使用本地样例，不调用业务接口。
  function orderAction(type,label,o,p,variant){
    return '<button type="button" class="order-btn '+(variant||'')+'" data-order-action="'+type+'" data-order-id="'+o.id+'" data-person-id="'+(p?p.id:'')+'">'+label+'</button>';
  }
  function alignedOrders(){
    return '<div class="hub-section"><div class="hub-section-head"><div><h2>我经办的订单</h2><p>订单信息和参会人直接展示，操作就在对应订单上完成</p></div><span class="hub-section-hint">按下单时间倒序</span></div><div class="orders">'+M.orders(account).map(function(o){
      var people=M.managed(account).filter(function(p){return p.orderId===o.id;});
      var actions=o.status==='paid'?orderAction('invoice','查看发票',o)+orderAction('refund','申请退款',o):o.status==='pending'?orderAction('cancel','取消订单',o,null,'danger')+orderAction('pay','立即支付',o,null,'primary'):o.status==='refunded'?orderAction('invoice','查看发票',o)+orderAction('refundProgress','退款进度',o):'';
      return '<article class="order-card"><div class="order-head"><div><span class="order-code">订单号 · '+o.id+'</span><h3>第十三届中国教育创新年会</h3></div><span class="order-status '+o.status+'">'+M.orderStates[o.status]+'</span></div><div class="order-summary">'+[[o.status==='pending'?'待付金额':'实付金额','¥'+o.amount.toLocaleString()+'（示例）'],['参会人数',people.length+' 人'],['支付方式',o.payType||'--'],['下单时间',o.date||'--']].map(function(r){return '<div><span class="summary-label">'+r[0]+'</span><span class="summary-value">'+esc(r[1])+'</span></div>';}).join('')+'</div><div class="order-attendees">'+people.map(function(p){return '<div class="order-attendee"><div class="person-name">'+esc(p.name)+(p.userId===account.userId?'<small>本人</small>':'')+'</div><div class="person-meta">'+esc(p.phone)+'</div><div class="person-ticket">'+names[p.ticket]+'</div>'+(o.status==='paid'?orderAction('edit','修改参会人',o,p):'')+'</div>';}).join('')+'</div>'+(actions?'<div class="order-actions">'+actions+'</div>':'')+'</article>';
    }).join('')+'</div></div>';
  }
  function openOrderDialog(trigger){
    var type=trigger.dataset.orderAction,o=M.orders(account).find(function(x){return x.id===trigger.dataset.orderId;});
    if(!o)return;
    var people=M.managed(account).filter(function(p){return p.orderId===o.id;}),p=people.find(function(x){return x.id===trigger.dataset.personId;});
    var titles={edit:'修改参会人',invoice:'订单发票',refund:'申请退款',refundProgress:'退款进度',cancel:'取消订单',pay:'立即支付'};
    var content='';
    if(type==='edit'&&p)content=[['name','参会人姓名',p.name],['phone','联系电话',p.phone],['school','单位/学校',p.school||'']].map(function(r){return '<div class="field"><label for="order-'+r[0]+'">'+r[1]+'</label><input id="order-'+r[0]+'" name="'+r[0]+'" value="'+esc(r[2])+'"></div>';}).join('');
    else if(type==='refund')content='<div class="check-list">'+people.map(function(x,i){return '<label class="check-row"><input type="checkbox" name="people" value="'+x.id+'" '+(!i?'checked':'')+'>'+esc(x.name)+' · '+names[x.ticket]+'</label>';}).join('')+'</div><div class="field"><label for="order-reason">退款原因</label><textarea id="order-reason" name="reason" rows="3" required></textarea></div>';
    else if(type==='invoice')content=fields([['订单号',o.id],['开票金额','¥'+o.amount.toLocaleString()+'（示例）'],['发票状态','发票预览，无真实票据']]);
    else if(type==='refundProgress')content=fields([['当前状态',M.orderStates[o.status]],['退款人员',people.map(function(x){return x.name;}).join('、')],['金额','¥'+o.amount.toLocaleString()+'（示例）']]);
    else content='<p class="dialog-text">'+(type==='cancel'?'确认取消此待支付订单？仅改变本页示例状态。':'正式页面在此进入统一收银台；原型只演示，不发起支付。')+'</p>';
    var dialog=document.createElement('dialog');dialog.className='hub-dialog';dialog.setAttribute('aria-labelledby','order-dialog-title');
    var confirms={edit:'保存修改',invoice:'预览下载',refund:'提交申请',refundProgress:'知道了',cancel:'确认取消',pay:'模拟进入收银台'};
    dialog.innerHTML='<form><div class="dialog-head"><div><h2 id="order-dialog-title">'+titles[type]+'</h2><p>'+o.id+' · 原地操作</p></div><button type="button" class="dialog-close" aria-label="关闭">×</button></div><div class="dialog-body">'+content+'<p class="dialog-note" role="status">交互演示，不提交、不付款；刷新后恢复示例数据。</p></div><div class="dialog-actions"><button type="button" class="order-btn" data-close>取消</button><button class="order-btn primary" type="submit">'+confirms[type]+'</button></div></form>';
    root.appendChild(dialog);dialog.showModal();
    function close(){dialog.close();}
    dialog.querySelector('.dialog-close').onclick=close;dialog.querySelector('[data-close]').onclick=close;
    dialog.addEventListener('close',function(){dialog.remove();if(trigger.isConnected)trigger.focus({preventScroll:true});});
    dialog.querySelector('form').onsubmit=function(event){event.preventDefault();var data=new FormData(event.target);
      if(type==='refund'&&!data.getAll('people').length){dialog.querySelector('.dialog-note').textContent='请至少选择一位参会人。';return;}
      if(type==='edit'&&p){p.name=String(data.get('name')).trim()||p.name;p.phone=String(data.get('phone')).trim()||p.phone;p.school=String(data.get('school')).trim()||p.school;}
      if(type==='cancel')o.status='cancelled';
      var y=window.scrollY;close();render(false);window.scrollTo({top:y,behavior:'instant'});
      var feedback=root.querySelector('.hub-preview');if(feedback)feedback.textContent='已完成演示 · 未提交真实业务';
      var target=root.querySelector('[data-order-id="'+o.id+'"]');if(target)target.focus({preventScroll:true});
    };
  }
  function overview(){
    var buyer=M.orders(account).length>0;
    var head='<div class="hub-head"><div><h1>一键查询</h1><p>参会信息与经办事项，都在这里</p></div><span class="hub-preview">交互预览 · 示例数据</span></div>'+previewControls();
    if(!account.loggedIn)return head+noData('登录后查询参会与报名信息','使用本人账号登录，查看自己的参会安排或经办的报名。',button('预览登录后状态','data-hub-login'));
    var content=(registered()?personalOverview():buyer?'':personalOverview())+(buyer?alignedOrders():'');
    var services=[['notices','大会通知'],['guide','服务信息'],['help','联系会务']];
    if(registered())services.unshift(['profile','本人参会资料'],['replay','直播与回放']);
    if(buyer)services.unshift(['orders','我经办的订单'],['invoice','订单发票']);
    return head+content+wallet()+'<div class="hub-group"><div class="hub-group-head"><h2>更多服务</h2></div><div class="hub-services">'+services.map(function(x){return link(x[0],x[1],'hub-service');}).join('')+'</div></div>';
  }
  var titles = {registration:'我的报名与权益',managed:'我经办的参会人',proxy:'办理参会安排',orders:'我经办的订单',seat:'我的座位与入场',forum:'我的分论坛',offsite:'场外深研课',hotel:'我的酒店',path:'我的学习路径',passport:'我的学习护照',organization:'我的学习组织',outcomes:'我的学习成果',coins:'未来币收支',recharge:'充值未来币',tasks:'做任务赚未来币',exchange:'兑换方案与产品',redemptions:'我的兑换',favorites:'收藏的方案',invoice:'发票信息',replay:'直播与回放',notices:'大会通知',guide:'服务信息',profile:'参会人信息',transfer:'更换参会人',help:'联系会务'};
  var routeParams = new URLSearchParams();
  function personPicker(){
    return '<label class="hub-target-picker">选择经办的参会人<select data-hub-target><option value="">请选择参会人</option>'+M.managed(account).map(function(p){return '<option value="'+p.id+'" '+(targetId===p.id?'selected':'')+'>'+esc(p.name)+' · '+names[p.ticket]+' · '+M.orderStates[M.orderFor(account,p).status]+' · '+p.orderId+'</option>';}).join('')+'</select></label>';
  }
  function targetBanner(p){
    return '<div class="hub-target-banner"><div><span>正在为以下参会人办理</span><strong>'+esc(p.name)+'</strong><p>'+esc(p.phone)+' · '+names[p.ticket]+' · '+p.orderId+'</p></div><span class="hub-status">'+(p.userId===account.userId?'本人报名':'代办模式')+'</span></div>';
  }
  function selectionBox(p,date,proxy){
    var selected=(account.selections[p.id]||{})[date];
    var title=date==='offsite'?'12 月 5 日 · 场外深研课':'12 月 '+(date==='12-02'?'2':'3')+' 日 · 分论坛';
    var readonly=account.phase==='post';
    var confirming=pendingChoice&&pendingChoice.personId===p.id&&pendingChoice.date===date;
    var displayed=confirming?pendingChoice.courseId:selected;
    var current=box(title,fields([['已选场次',M.courseName(account,p.id,date)],['选课规则',date==='offsite'?'每人最多选择 1 场场外深研课':'每人每天最多选择 1 场分论坛']])+(readonly?'<p class="hub-muted">会后仅可查询选课结果。</p>':'<form class="hub-course-form" data-hub-course="'+date+'" data-person="'+p.id+'" data-proxy="'+proxy+'"><label>选择'+(selected?'新的':'')+'场次<select name="course" required '+(confirming?'disabled':'')+'><option value="">请选择场次</option>'+M.courses[date].map(function(c){return '<option value="'+c.id+'" '+(c.id===displayed?'selected':'')+'>'+c.name+'</option>';}).join('')+'</select></label><button class="hub-button" type="submit" '+(confirming?'disabled':'')+'>'+(selected?'预览更改':'预览确认')+'</button></form>'));
    if(confirming){
      var chosen=M.courses[date].find(function(c){return c.id===pendingChoice.courseId;});
      current+='<div class="hub-selection-confirm" role="region" aria-label="确认选课"><h3>请确认：'+esc(p.name)+' · '+title+'</h3><p>'+chosen.name+'</p><p>原场次：'+M.courseName(account,p.id,date)+'。仅替换该参会人的这一场次，不影响其他日期或其他参会人。</p><div class="hub-detail-actions">'+button('模拟确认选课','data-hub-confirm')+button('取消','data-hub-cancel',true)+'</div></div>';
    }
    return current;
  }
  function courseContent(p,kind,proxy){
    if(!M.active(account,p))return noData('当前没有有效选课权益','此报名为'+M.orderStates[M.orderFor(account,p).status]+'，可查询记录，不能选课。');
    if(kind==='forum'&&!M.hasForum(p))return noData('当前参会权益不包含现场分论坛','线上参会可按权益观看开放后的录播；独立方案展不含分论坛选课。');
    if(kind==='offsite'&&p.ticket!=='combo')return noData('尚未获得场外深研课选课资格','仅购买主论坛的参会者，需另行选购后选课。',action('#deep','查看场外深研课说明'));
    return (kind==='forum'?M.dates:['offsite']).map(function(d){return selectionBox(p,d,proxy);}).join('')+note('场次名称均为交互示例，不代表正式议程、余量或真实选课结果。');
  }
  function managedList(){
    return box('我经办的参会人',M.managed(account).map(function(p){return entry(esc(p.name)+(p.userId===account.userId?' · 本人':''),names[p.ticket]+' · '+p.orderId+' · '+M.orderStates[M.orderFor(account,p).status],link('proxy?person='+p.id,'查看与办理'));}).join(''))+note('这里只展示当前账号所经办订单下的参会人。同一学校的其他成员不会自动出现在这里。');
  }
  function orderContent(){
    var id=routeParams.get('order'), order=id&&M.orders(account).find(function(o){return o.id===id;});
    if(id&&!order)return noData('无法查看这笔订单','当前账号没有这笔订单的经办权限。');
    if(order){
      var people=M.managed(account).filter(function(p){return p.orderId===order.id;});
      return box('报名订单 · '+order.id,fields([['订单状态',M.orderStates[order.status]],['报名金额','¥'+order.amount.toLocaleString()+'（示例）'],['下单账号','当前登录账号 · 138****6666'],['参会人数',String(people.length)+' 人']]))+
        box('订单内参会人',people.map(function(p){return entry(esc(p.name),names[p.ticket],link('proxy?person='+p.id,'参会安排'));}).join(''))+
        (order.status==='paid'?'<div class="hub-detail-actions">'+action('#account/invoice?order='+order.id,'查看订单发票',true)+'</div>':note(order.status==='pending'?'这是一笔待支付报名，不构成有效参会资格。正式接入后在此继续支付；本预览不发起支付。':'保留'+M.orderStates[order.status]+'记录供查询，不再提供选课或入场权益。'))+
        note('酒店与其他增购项目正式接入后按其实际经办订单归集，不混入其他下单人的订单。');
    }
    var filter=routeParams.get('status')||orderFilter;
    if(!M.orderStates[filter])filter='all';
    return '<div class="hub-filter" aria-label="订单状态筛选">'+[['all','全部']].concat(Object.keys(M.orderStates).map(function(k){return[k,M.orderStates[k]];})).map(function(x){return '<button type="button" data-hub-order-filter="'+x[0]+'" aria-pressed="'+(filter===x[0])+'">'+x[1]+'</button>';}).join('')+'</div>'+
      M.orders(account).filter(function(o){return filter==='all'||o.status===filter;}).map(function(o){var people=M.managed(account).filter(function(p){return p.orderId===o.id;});return '<div class="hub-detail-box">'+entry(o.id,status(M.orderStates[o.status],o.status==='paid')+' · '+people.length+' 人 · ¥'+o.amount.toLocaleString(),link('orders?order='+o.id,'订单详情'))+'<p>'+people.map(function(p){return esc(p.name)+' · '+names[p.ticket];}).join('；')+'</p></div>';}).join('')+
      note('未支付、已取消和已退款的订单仍可查询。这里的金额与名单均为演示数据。');
  }
  function invoiceContent(){
    var id=routeParams.get('order'), order=id&&M.orders(account).find(function(o){return o.id===id;});
    if(!id)return box('选择经办订单',M.orders(account).map(function(o){return entry(o.id,M.orderStates[o.status],link('invoice?order='+o.id,'查看发票信息'));}).join(''));
    if(!order)return noData('无法查看这笔订单的发票','仅可查看当前账号所经办订单的开票信息。');
    return box('发票信息',fields([['关联订单',order.id],['订单状态',M.orderStates[order.status]],['开票状态',order.status==='paid'?'待申请（示例）':'当前无可申请开票金额'],['发票抬头','尚未填写'],['开票金额','以订单实际支付及退款状态为准']]))+note('正式接入后提供申请、查看与下载发票。预览不收集真实税号，也不提交开票申请。');
  }
  function proxyContent(forceTransfer){
    var p=M.person(account,targetId,true), picker=personPicker();
    if(!p)return picker+noData(targetId?'无法办理这位参会人的事项':'先选择一位参会人','可代办范围来自当前账号经办的订单。');
    var tabs=[['registration','参会资料'],['forum','分论坛'],['offsite','场外深研课'],['hotel','酒店'],['transfer','更换参会人']];
    var tab=forceTransfer?'transfer':proxyTab;
    var body='';
    if(tab==='registration')body=box('参会信息',fields([['参会人',esc(p.name)+' · '+esc(p.phone)],['参会方式',names[p.ticket]],['报名状态',M.orderStates[M.orderFor(account,p).status]],['座位信息',M.active(account,p)&&M.hasForum(p)?(stageOpen()?'A 区 · 示例座位，正式分配后公布':'待公布'):'当前没有主论坛座位'],['关联订单',link('orders?order='+p.orderId,p.orderId)]]));
    if(tab==='forum'||tab==='offsite')body=courseContent(p,tab,true);
    if(tab==='hotel')body=p.hotel&&M.active(account,p)?box('住宿安排（示例）',fields([['入住人',esc(p.name)],['酒店与房型','协议酒店 · 大床房'],['入住日期','12 月 1 日至 12 月 4 日'],['预订状态','已确认（示例）']])):noData('暂无住宿安排','该参会人当前没有有效的关联住宿预订。');
    if(tab==='transfer')body=M.active(account,p)?box('更换参会人',entry('当前参会人',esc(p.name)+' · '+esc(p.phone))+entry('对应报名',names[p.ticket]+' · '+p.orderId)+entry('可衔接的内容','对应的参会资格与允许转移的选课安排；住宿是否可转移以实际预订规则为准。')+entry('保持不变','下单人、订单号、支付及发票归属。')+entry('不会转移','原参会人的学习护照、个人学习报告、未来币余额与兑换记录。'))+note('最晚 11 月 30 日可申请更换，具体规则以正式系统为准。本页只展示办理范围，不收集新参会人的真实资料、不提交更换。'):noData('当前报名不能更换参会人','待支付、已取消或已退款的报名不提供此操作。');
    return picker+targetBanner(p)+'<nav class="hub-proxy-tabs" aria-label="代办事项">'+tabs.map(function(t){return '<button type="button" data-hub-proxy-tab="'+t[0]+'" aria-pressed="'+(tab===t[0])+'">'+t[1]+'</button>';}).join('')+'</nav>'+body+note('代办范围仅含报名与参会安排。对方的个人学习护照、报告和钱包由其本人账号查看。');
  }
  // 服务信息同步自飞书参会指南 revision 549；保留原文，统一文字配色。
  function serviceInformation(){
    return `<div class="hub-service-information">
<section class="hub-detail-box"><h2>签到信息  </h2>
<p><b>一、签到时间及地点</b></p>
<p>签到时间：12月1日 9:00-19:30</p>
<p>签到地点：广州空港博览中心</p>
<p><b>二、如何签到</b></p>
<p>1.前往签到处的任一通道，告知工作人员参会人的姓名或学校即可。工作人员将为您进行电子签到。</p>
<p>2.签到时工作人员将为您发放参会资料袋与入场标签，标签上将标注参会人的姓名、座位区域及入场二维码，请将标签粘至参会牌上。</p>
<p>3.入场时请在闸机处扫描二维码，有序入场。</p>
<p>4.同一学校的参会者可由任一参会代表代为集体签到。</p>
<p><b>三、注意事项</b></p>
<p>1.会议期间请妥善保管您的参会资料袋与参会牌，遗失不补。</p>
<p>2.参会期间请全程佩戴您的参会牌。</p>
<p>3.如有需要行李寄存的参会者，可在签到处办理行李寄存服务，离开时请携带好您的行李及随身物品。</p>
<p>4. 入场与活动安排：</p>
<p><b>12月1日的入场时间为</b><b>13:30，下午16:45将举行艺术展开幕式</b><b>。</b>    </p>
<p>对于提前抵达的老师，我们建议您前往酒店办理入住手续并稍作休息。</p>
<p>入场时间开始后，老师们可按照指示有序入场。</p>
<p>5.会议期间，会场签到处设有常驻工作人员，为您解答各类问题。</p>
<p><b>四、天气提示</b></p>
<p>会议期间广州天气温暖舒适，气温约在14-22℃左右（会场气温约24℃），建议各位参会嘉宾内着短袖、衬衫，携带薄外套、针织衫即可。</p>
<p>广州市白云区每日天气播报：</p>
<p>12月1日：14-22℃</p>
<p>12月2日：13-21℃</p>
<p>12月3日：14-21℃</p>
<p>12月4日：14-21℃</p>
<p>12月5日：13-21℃</p>
</section>
<section class="hub-detail-box"><h2>会场信息 </h2>
<p>第十三届中国教育创新年会将在广州空港博览中心1.2号场馆内举行。</p>
<p>广州空港博览中心位于<b>广州市白云区迎宾大道1108号</b>，地处广州空港经济区核心，距广州白云国际机场约3公里。 该中心是广州规划建设的国际性专业展贸平台，总建筑面积约25.35万平方米，规划建设12个展厅，室内展览面积超过10万平方米，具有单层无柱、大跨度、荷载能力强等特点，是可举办大型工业展的展馆。</p>
<a href="assets/service-venue.png" target="_blank" rel="noopener" aria-label="查看原图：广州空港博览中心"><img src="assets/service-venue.png" alt="广州空港博览中心" width="828" height="533" loading="lazy"></a></section>
<section class="hub-detail-box"><h2>住宿信息</h2>
<a href="assets/service-hotels.png" target="_blank" rel="noopener" aria-label="查看原图：年会合作酒店信息"><img src="assets/service-hotels.png" alt="年会合作酒店信息" width="3680" height="2360" loading="lazy"></a><p><b>预定须知：</b></p>
<p><b>一、预定方式：</b></p>
<p>酒店预定均通过网上进行，不接受线下预定。</p>
<p>方式1：会议报名时可同时预定酒店 或 在年会报名直接点击 “酒店预定”</p>
<p>方式2：通过“新师途”平台预定（扫描上图二维码）</p>
<p><b>二、订单有效期：</b></p>
<p>酒店预定以订单支付成功为准，未能在有效期内支付的订单，预定无效。如仍需预定，请重新下单支付。</p>
<p><b>三、订单取消/修改：</b></p>
<p>住宿订单支付完成后，如需取消或修改订单，请于2026年11月23日24:00前登录第十三届中国教育创新年会官网-个人中心-我的订单，提交房间调整申请。因酒店已预留房间，订单逾期后将不能取消或修改，已缴纳的住宿费（含住宿定金）酒店将无法退还。</p>
<p><b>四、发票事宜：</b></p>
<p>住宿费用由重庆市蒲公英未来科技有限公司代收，住宿发票由入住酒店提供，离店前请在酒店前台开取。</p>
<p><b>五、入住方式：</b></p>
<p>预定成功后，凭预定人姓名和电话在酒店前台办理入住，具体入住流程按酒店要求执行。</p>
<div class="hub-service-qr"><div><a href="assets/service-hotel-booking.png" target="_blank" rel="noopener" aria-label="查看原图：预定酒店"><img src="assets/service-hotel-booking.png" alt="预定酒店" width="1091" height="1089" loading="lazy"></a><p>预定酒店</p>
</div><div><a href="assets/service-travel-assistant.jpg" target="_blank" rel="noopener" aria-label="查看原图：差旅助手二维码"><img src="assets/service-travel-assistant.jpg" alt="差旅助手二维码" width="2048" height="2048" loading="lazy"></a><p>差旅助手19122810591</p>
</div><div><a href="assets/service-hotel-assistant.jpg" target="_blank" rel="noopener" aria-label="查看原图：酒店助手二维码"><img src="assets/service-hotel-assistant.jpg" alt="酒店助手二维码" width="2048" height="2048" loading="lazy"></a><p>酒店助手19946967625</p>
</div></div></section>
<section class="hub-detail-box"><h2>餐饮信息</h2>
<p>第十三届中国教育创新年会主体活动期间，组委会将为所有参会人员提供12.1日晚餐，以及12.2-4日午餐。</p>
<p>餐饮将送至您的座位，请您享用完毕后，将餐盒自觉放置于指定的回收区域，共同维护会场的整洁与舒适环境。</p>
</section>
<section class="hub-detail-box"><h2><b>交通信息</b></h2>
<p>广州空港博览中心位于广州市白云区迎宾大道1108号，交通便利。</p>
<p>出行提示：请按机票所示航站楼选择对应路线。以下步行距离、总用时及打车费用为出行参考，实际以会场开放入口、实时路况、导航及平台报价或出租车计价器为准。</p>
<p><b><em>广州白云国际机场T2航站楼</em></b></p>
<p><b>方式一：乘坐地铁3号线</b></p>
<p>从3号线机场北2号航站楼站进站，搭乘体育西路方向，高增站B口出站，共计2站，步行1.6公里至广州空港博览中心，总计约32分钟。</p>
<p><b>方式二：乘坐出租车或网约车</b></p>
<p>提前网约车或在出租车点打车，约5.3公里，预计9分钟，约18元。</p>
<p><b><em>广州白云国际机场T3航站楼</em></b></p>
<p><b>方式一：乘坐免费接驳公交（空港2线支线）</b></p>
<p>抵达T3航站楼后，按现场指引前往一楼交通中心，在空港2线支线乘车点上车，乘至高增地铁站。该线路免费，单程约15分钟，高峰时段约5分钟一班，平峰时段约10分钟一班。T3航站楼往高增地铁站运营时间为6:35—22:40。抵达高增站后，无需再乘地铁，可按导航步行前往广州空港博览中心；</p>
<p><b>方式二：乘坐出租车或网约车</b></p>
<p>按T3航站楼现场标识前往出租车候车区，或在网约车平台选择T3对应上车点，目的地设置为“广州空港博览中心（广州市白云区迎宾大道1108号）”。上车前核对会场入口；实际里程、车程和费用以实时导航、平台报价或出租车计价器为准。</p>
<p><b><em>广州北站</em></b></p>
<p><b>方式一：乘坐地铁9号线</b></p>
<p>从9号线广州北站进站，搭乘高增方向，高增站B口出站，共计8站，步行1.6公里至广州空港博览中心，总计约52分钟。</p>
<p><b>方式二：打车</b></p>
<p>提前网约车或在出租车点打车，11.8公里，预计23分钟，约35元。</p>
<p><b><em>广州白云站</em></b></p>
<p><b>方式一：打车</b></p>
<p>推荐提前网约车或在出租车点打车，25.5公里，预计30分钟，约76元。</p>
<p><b><em>广州东站</em></b></p>
<p><b>方式一：乘坐地铁3号线</b></p>
<p>从3号线广州东站进站，搭乘机场北 （2号航站楼）方向，高增站B口出站，共计10站，步行1.6公里至广州空港博览中心，总计约58分钟。</p>
<p><b>方式二：打车</b></p>
<p>提前网约车或在出租车点打车，36公里，预计41分钟，约109元</p>
<p><b><em>广州南站</em></b></p>
<p><b>方式一：打车</b></p>
<p>推荐提前网约车或在出租车点打车，51.8公里，预计57分钟，约159元</p>
</section>
</div>`;
  }
  function details(key){
    if(!M.canOpen(account,key)){
      if(!account.loggedIn)return noData('请先登录','登录后按当前账号与报名记录查询。',button('预览登录后状态','data-hub-login'));
      var buyerPage=['orders','managed','proxy','invoice','transfer'].indexOf(key)!==-1;
      return noData(buyerPage?'当前账号没有经办的报名':'当前账号没有本人的有效参会报名',buyerPage?'由其他人代为下单的订单、支付与发票信息，请联系对应下单人办理。':'经办他人的报名不会生成本人的参会资格。学习护照与个人报告由实际参会者本人查看。',action('#account','返回一键查询',true));
    }
    switch(key){
      case 'orders': return orderContent();
      case 'recharge':
        return box('前往一体化平台充值',fields([['充值账号','请在一体化平台核对当前登录账号'],['币种','未来币'],['充值与支付','金额、兑换规则及支付结果以平台页面为准']]))+
          note('平台充值页的准确链接待确认。当前可先打开平台会员中心；此预览不会创建充值订单，也不会改变这里的示例余额。')+
          '<div class="hub-detail-actions">'+action(platformRechargeUrl||platformMemberCenterUrl,platformRechargeUrl?'前往充值':'打开一体化平台会员中心',false,'target="_blank" rel="noopener noreferrer"')+action('#account/coins','返回未来币收支',true)+'</div>';
      case 'managed': return managedList();
      case 'proxy': return proxyContent(false);
      case 'registration': return box('我的参会权益',fields([['参会人','我本人 · 138****6666（示例）'],['参会方式',names[state.identity]],['报名状态','有效报名（示例）'],['参会权益',state.identity==='online'?'主论坛直播及回看、分论坛及场外深研课录播回看':state.identity==='expo'?'方案展通行、学习护照与学习报告':'主论坛、每日分论坛选课、方案展、学习护照'+(state.identity==='combo'?'、1 场场外深研课':'')]]))+'<div class="hub-detail-actions">'+action('#account/forum','查看本人选课',true)+action('#account/hotel','查看本人住宿',true)+'</div>';
      case 'seat':
        if(!onsite()) return noData('线上参会无需现场座位','可通过线上入口查看直播与回放。',action('#account/replay','查看线上参会'));
        return box('入场信息',fields([['参会方式',names[state.identity]],['主论坛座位',forumRight()?(stageOpen()?'A 区 · 08 排 · 16 座（示例）':'待公布，分配后在此查看'):'当前参会权益不含主论坛座位'],['签到状态',state.checkin?'已签到（示例）':'未签到'],['现场通行',forumRight()?'主论坛与方案展':'方案展']]))+note('实际座位、会场及入场凭证以正式报名系统发布为准。此预览不生成可核验的入场码。')+'<div class="hub-detail-actions">'+action('#account/guide','查看服务信息',true)+'</div>';
      case 'forum': return courseContent(M.self(account),'forum',false);
      case 'offsite': return courseContent(M.self(account),'offsite',false);
      case 'hotel': return onsite()&&stageOpen()?box('协议酒店 · 大床房（示例）',fields([['入住日期','2026 年 12 月 1 日'],['离店日期','2026 年 12 月 4 日 · 共 3 晚'],['预订状态','已确认（示例）'],['酒店地址','正式订单中展示所订酒店地址'],['入住凭证','正式预订成功后查看']]))+note('当前为住宿订单展示样例，酒店名称、地址及联系方式以实际预订为准。'):noData('暂无酒店订单','已预订的酒店、入住日期、房型和酒店联系方式将在这里显示。');
      case 'path': case 'passport': case 'organization': case 'outcomes':
        return '<div data-passport-mount></div>';
      case 'coins': return box('可用余额 · '+coins()+' 枚',entry('学习任务累计奖励（示例）','示例账户期初收入','<small>+240</small>')+tasks.filter(function(t){return claimed[t.id];}).map(function(t){return entry(t.title,'本次演示已领取','<small>+'+t.coins+'</small>');}).join('')+products.filter(function(p){return redeemed[p.id];}).map(function(p){return entry(p.title,'本次演示已兑换','<small>−'+p.coins+'</small>');}).join(''))+'<div class="hub-detail-actions">'+rechargeButton()+action('#account/tasks','做任务赚币',true)+action('#account/redemptions','查看兑换记录',true)+'</div>';
      case 'tasks':
        if(!registered())return noData('当前没有本人的年会学习任务','年会学习任务与实际参会资格关联。经办他人的报名不会获得对方的任务奖励；现有余额与兑换记录仍属于当前登录账号。',action('#account/coins','查看我的未来币',true));
        return box('完成任务，积累未来币',tasks.map(function(t){var done=window.EICCPassport.status().tasks[t.id];return entry(t.title,t.copy+' · 示例奖励 '+t.coins+' 枚',done?'<button class="hub-button'+(claimed[t.id]?' secondary':'')+'" type="button" data-hub-claim="'+t.id+'" '+(claimed[t.id]?'disabled':'')+'>'+(claimed[t.id]?'已领取':'模拟领取')+'</button>':learningLink(t.id==='assessment'?'path':t.id==='relay'?'organization':'records','去完成'));}).join(''))+note('完成状态来自这份学习护照的自评、记录与主动分享。奖励数值仅为旧版交互样例，不是正式规则；真实贡献核验、奖励发放和共创排名待接入。本页领奖与兑换记录刷新后重置。')+'<div class="hub-detail-actions">'+action('#account/exchange','用未来币去兑换',true)+'</div>';
      case 'exchange': return box('可用未来币 · '+coins()+' 枚',products.map(function(p){var done = redeemed[p.id], enough = coins()>=p.coins;return entry(p.title,p.copy+' · '+p.coins+' 枚','<button type="button" class="hub-button" data-hub-redeem="'+p.id+'" '+(done||!enough?'disabled':'')+'>'+(done?'已兑换':enough?'模拟兑换':'余额不足')+'</button>');}).join(''))+note('商品与兑换价格均为示例，不会产生真实订单。兑换后可在“我的兑换”查看记录。')+'<div class="hub-detail-actions">'+rechargeButton()+action('#account/redemptions','查看我的兑换',true)+'</div>';
      case 'redemptions':
        var items = products.filter(function(p){return redeemed[p.id];});
        return items.length?box('我的兑换记录',items.map(function(p){return entry(p.title,'已使用 '+p.coins+' 枚未来币 · '+(p.id==='resource'?'待领取电子资料':'待现场领取'),status('兑换成功',true));}).join(''))+note('正式兑换记录会展示电子资料入口、领取凭证或物流信息。此处为本次演示记录。'):noData('还没有兑换记录','兑换的方案、产品和领取进度都会保存在这里。',action('#account/exchange','去看看可兑换内容'));
      case 'favorites': return box('我的方案收藏',entry('学校空间创新方案（示例）','收藏的方案资料、交流记录及后续联系入口',status('已收藏',true)))+'<div class="hub-detail-actions">'+action('#expo','查看方案展',true)+'</div>';
      case 'invoice': return invoiceContent();
      case 'replay': return state.identity==='expo'?noData('当前参会权益不含直播与回放','查看线上参会方式，可获得对应直播和回看内容。',action('#tickets','查看线上参会权益')):box('我的观看权益',fields([['主论坛',state.phase==='live'?'直播期间（预览）':state.phase==='post'?'回放开放阶段':'等待直播开放'],['分论坛与场外深研课','录播及回看'],['回看截止','2027 年 12 月 4 日'],['观看入口','正式开通后提供播放器入口']]))+'<div class="hub-detail-actions">'+action('#agenda','查看主论坛内容',true)+'</div>';
      case 'notices': return box('参会提醒',entry('选课提醒','分论坛每人每天最多选择 1 场；场外深研课最多选择 1 场。')+entry('出行提醒','会场、座位与集合信息以个人报名和选课通知为准。'));
      case 'guide': return serviceInformation();
      case 'profile': return box('参会人资料',fields([['姓名','参会老师（示例）'],['手机号','138****6666（示例）'],['学校','报名学校（示例）'],['参会方式',names[state.identity]]]))+note('正式登录后查看本人报名资料。本预览不保存个人信息。');
      case 'transfer': return proxyContent(true);
      case 'help': return box('现场参会报名咨询',
        entry('罗老师','19196310527（微信同号）',action('tel:19196310527','拨打电话',true))+
        entry('胡老师','17784040799（微信同号）',action('tel:17784040799','拨打电话',true))+
        entry('赵老师','19923944023（微信同号）',action('tel:19923944023','拨打电话',true)))+
        box('差旅与酒店咨询',
        entry('周老师 · 差旅助手','19122810591（微信同号）',action('tel:19122810591','拨打电话',true))+
        entry('赵老师 · 酒店助手','19946967625（微信同号）',action('tel:19946967625','拨打电话',true)));
    }
    return '';
  }
  function render(focus){
    var parts=location.hash.slice('#account/'.length).split('?');
    var key=location.hash.startsWith('#account/')&&Object.prototype.hasOwnProperty.call(titles,parts[0])?parts[0]:'';
    routeParams=new URLSearchParams(parts[1]||'');
    if(key==='proxy'||key==='transfer')targetId=routeParams.get('person')||'';
    var own=registered();
    root.innerHTML=key?'<div class="hub-detail"><a href="#account" class="hub-back">← 返回一键查询</a><div class="hub-head"><h1 tabindex="-1">'+titles[key]+'</h1><span class="hub-preview">示例数据</span></div><p class="hub-detail-intro">'+(account.loggedIn?'当前登录账号 · 138****6666 · '+M.roles[M.role(account)]:'未登录')+'</p>'+details(key)+'<p class="hub-feedback" role="status" aria-live="polite">'+esc(notice)+'</p></div>':overview();
    window.EICCPassport.mount(root.querySelector('[data-passport-mount]'),passportRoute!==key?{path:'path',passport:'records',organization:'organization',outcomes:'outcomes'}[key]:null);
    passportRoute=key;
    if(focus&&location.hash.indexOf('#account')===0){var h=root.querySelector('h1');h.setAttribute('tabindex','-1');h.focus({preventScroll:true});}
  }
  function syncAccess(){
    account.phase=state.phase;
    window.dispatchEvent(new CustomEvent('eicc:query-role',{detail:{canAttend:registered(),role:account.loggedIn?M.role(account):'anonymous'}}));
  }
  function setRole(next){
    if(!M.roles[next])return;
    explicitRole=true; role=next;
    if(!names[state.identity])state.identity='combo';
    account=M.create(role,state.identity,state.course);
    area=role==='buyer'?'managed':'personal';
    pendingChoice=null;targetId='';proxyTab='registration';notice='';
    var url=new URL(location.href);url.searchParams.set('queryRole',role);url.hash='account';
    history.replaceState(null,'',url);
    window.dispatchEvent(new CustomEvent('eicc:account-preview',{detail:{identity:state.identity}}));
    syncAccess();render(true);
  }
  function feedback(){
    render(false);
    var el=root.querySelector('.hub-feedback');
    if(el){el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}
  }
  window.addEventListener('hashchange',function(){pendingChoice=null;notice='';render(true);});
  window.addEventListener('eicc:passport-change',function(){render(false);});
  window.addEventListener('eicc:demo-state',function(event){
    var next=event.detail, previous=state.identity, previousCourse=state.course;
    state=Object.assign({},next);
    if(!explicitRole)role=names[state.identity]?'both':'none';
    if(previous!==state.identity||M.role(account)!==role){
      account=M.create(role,state.identity,state.course);
      area=role==='buyer'?'managed':'personal';
    }
    account.loggedIn=state.identity!=='anonymous';
    if(registered()&&!names[state.identity])state.identity=M.self(account).ticket;
    if(registered()&&previousCourse!==state.course){
      account.selections.self=M.create(role,state.identity,state.course).selections.self||{};
    }
    pendingChoice=null;notice='';syncAccess();render(false);
  });
  window.addEventListener('eicc:registration-preview',function(event){
    state={identity:event.detail.identity,phase:'prep',course:false,assessment:false,checkin:false};
    role='both';explicitRole=true;account=M.create(role,state.identity,false);area='personal';
    var url=new URL(location.href);url.searchParams.set('queryRole',role);history.replaceState(null,'',url);
    pendingChoice=null;notice='';syncAccess();render(false);
  });
  root.addEventListener('change',function(event){
    if(event.target.hasAttribute('data-hub-target')){
      pendingChoice=null;targetId=event.target.value;notice='';
      location.hash='account/proxy'+(targetId?'?person='+encodeURIComponent(targetId):'');
    }
  });
  root.addEventListener('submit',function(event){
    var form=event.target.closest('[data-hub-course]');
    if(!form)return;
    event.preventDefault();
    var personId=form.dataset.person,date=form.dataset.hubCourse,courseId=new FormData(form).get('course'),proxy=form.dataset.proxy==='true';
    var result=M.choose(structuredClone(account),personId,date,courseId,proxy);
    if(!result.ok){notice=result.error;feedback();return;}
    pendingChoice={personId:personId,date:date,courseId:courseId,proxy:proxy};
    render(false);
    var confirm=root.querySelector('.hub-selection-confirm');
    if(confirm){confirm.setAttribute('tabindex','-1');confirm.focus();}
  });
  root.addEventListener('click',function(event){
    var b=event.target.closest('button');
    if(!b||b.disabled)return;
    if(b.hasAttribute('data-order-action')){openOrderDialog(b);return;}
    if(b.hasAttribute('data-hub-role')){setRole(b.dataset.hubRole);return;}
    if(b.hasAttribute('data-hub-area')){area=b.dataset.hubArea;pendingChoice=null;render(false);root.querySelector('[data-hub-area="'+area+'"]').focus({preventScroll:true});return;}
    if(b.hasAttribute('data-hub-order-filter')){
      orderFilter=b.dataset.hubOrderFilter;location.hash='account/orders?status='+orderFilter;return;
    }
    if(b.hasAttribute('data-hub-proxy-tab')){
      proxyTab=b.dataset.hubProxyTab;pendingChoice=null;
      if(location.hash.startsWith('#account/transfer'))location.hash='account/proxy?person='+targetId;
      else {render(false);root.querySelector('[data-hub-proxy-tab="'+proxyTab+'"]').focus({preventScroll:true});}
      return;
    }
    if(b.hasAttribute('data-hub-cancel')){pendingChoice=null;render(false);return;}
    if(b.hasAttribute('data-hub-confirm')&&pendingChoice){
      var c=pendingChoice;
      if(c.proxy&&c.personId!==targetId){pendingChoice=null;notice='参会人已切换，请重新选择场次。';feedback();return;}
      var result=M.choose(account,c.personId,c.date,c.courseId,c.proxy);
      pendingChoice=null;notice=result.ok?'已为'+result.person.name+'模拟选择：'+result.course.name+'。未提交真实选课。':result.error;
      feedback();return;
    }
    if(b.hasAttribute('data-hub-login')){setRole('none');return;}
    if(!account.loggedIn)return;
    var claim=tasks.find(function(t){return t.id===b.dataset.hubClaim;});
    var product=products.find(function(p){return p.id===b.dataset.hubRedeem;});
    if(claim&&registered()&&!claimed[claim.id]&&window.EICCPassport.status().tasks[claim.id]){
      claimed[claim.id]=true;notice='已模拟领取 '+claim.coins+' 枚未来币，可用余额 '+coins()+' 枚。';
    }
    if(product&&!redeemed[product.id]&&coins()>=product.coins){
      redeemed[product.id]=true;notice='已模拟兑换“'+product.title+'”，可在“我的兑换”查看。剩余 '+coins()+' 枚。';
    }
    if(claim||product)feedback();
  });
  syncAccess();
  render(false);
}());
