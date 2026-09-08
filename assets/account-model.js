/* One-click query demo policy. Production permissions must be checked by the server. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EICCAccountModel = factory();
}(typeof window !== 'undefined' ? window : this, function() {
  'use strict';
  var roles = {none:'已登录未报名', buyer:'下单人', attendee:'仅参会人', both:'下单人＋参会人'};
  var tickets = {main:'主论坛', combo:'主论坛＋深研课', online:'线上参会', expo:'独立方案展'};
  var orderStates = {paid:'已支付', pending:'待支付', cancelled:'已取消', refunded:'已退款'};
  var dates = ['12-02','12-03'];
  var courses = {
    '12-02': [{id:'forum-2-a', name:'12 月 2 日 · 分论坛 A（示例）'}, {id:'forum-2-b', name:'12 月 2 日 · 分论坛 B（示例）'}],
    '12-03': [{id:'forum-3-a', name:'12 月 3 日 · 分论坛 A（示例）'}, {id:'forum-3-b', name:'12 月 3 日 · 分论坛 B（示例）'}],
    offsite: [{id:'offsite-a',name:'场外深研课 A（示例）'}, {id:'offsite-b',name:'场外深研课 B（示例）'}]
  };
  function create(role, identity, selected) {
    role = roles[role] ? role : 'both';
    identity = tickets[identity] ? identity : 'combo';
    var buyer = role === 'buyer' || role === 'both';
    var attendee = role === 'attendee' || role === 'both';
    var session = {userId:'demo-login', loggedIn:true, phase:'prep', orders:[], people:[], selections:{}};
    if (buyer) {
      session.orders = [
        {id:'DEMO-001', buyerId:session.userId, status:'paid', amount:role==='both'?5700+({main:2800,combo:2900,online:1560,expo:300}[identity]):5700},
        {id:'DEMO-002', buyerId:session.userId, status:'pending', amount:1560},
        {id:'DEMO-003', buyerId:session.userId, status:'refunded', amount:300},
        {id:'DEMO-004', buyerId:session.userId, status:'cancelled', amount:2800}
      ];
      session.people = [
        {id:'lin', name:'林老师', phone:'139****1001', ticket:'combo', orderId:'DEMO-001', hotel:true, userId:'demo-lin'},
        {id:'li', name:'李老师', phone:'139****1002', ticket:'main', orderId:'DEMO-001', hotel:false, userId:'demo-li'},
        {id:'chen', name:'陈老师', phone:'139****1003', ticket:'online', orderId:'DEMO-002', hotel:false, userId:'demo-chen'},
        {id:'zhou', name:'周老师', phone:'139****1004', ticket:'expo', orderId:'DEMO-003', hotel:false, userId:'demo-zhou'},
        {id:'wang', name:'王老师', phone:'139****1005', ticket:'main', orderId:'DEMO-004', hotel:false, userId:'demo-wang'}
      ];
    }
    if (attendee) {
      if (!buyer) session.orders.push({id:'DEMO-SELF',buyerId:'demo-other-buyer',status:'paid',amount:0});
      session.people.unshift({id:'self',name:'我本人',phone:'138****6666',ticket:identity,orderId:buyer?'DEMO-001':'DEMO-SELF',hotel:identity!=='online',userId:session.userId});
    }
    session.people.forEach(function(p) {
      session.selections[p.id] = {};
      if (selected && active(session,p)) {
        if (hasForum(p)) session.selections[p.id] = {'12-02':'forum-2-a','12-03':'forum-3-a'};
        if (p.ticket==='combo') session.selections[p.id].offsite='offsite-a';
      }
    });
    return session;
  }
  function orders(session) {return session.loggedIn ? session.orders.filter(function(o){return o.buyerId===session.userId;}) : [];}
  function orderFor(session, person) {return person && session.orders.find(function(o){return o.id===person.orderId;});}
  function active(session, person) {var order=orderFor(session,person);return !!order&&order.status==='paid';}
  function self(session) {return session.loggedIn ? session.people.find(function(p){return p.userId===session.userId&&active(session,p);}) : undefined;}
  function role(session) {return orders(session).length ? (self(session)?'both':'buyer') : (self(session)?'attendee':'none');}
  function managed(session) {var ids=orders(session).map(function(o){return o.id;});return session.people.filter(function(p){return ids.indexOf(p.orderId)!==-1;});}
  function person(session, id, proxy) {return proxy ? managed(session).find(function(p){return p.id===id;}) : (self(session)&&self(session).id===id ? self(session) : undefined);}
  function hasForum(person) {return !!person&&(person.ticket==='main'||person.ticket==='combo');}
  var personal=['registration','seat','forum','offsite','hotel','path','passport','organization','outcomes','replay','profile'];
  var buyerOnly=['orders','managed','proxy','invoice','transfer'];
  var accountOnly=['coins','recharge','tasks','exchange','redemptions','favorites'];
  var publicPages=['guide','help','notices'];
  function canOpen(session, page) {
    if (publicPages.indexOf(page)!==-1) return true;
    if (!session.loggedIn) return false;
    if (buyerOnly.indexOf(page)!==-1) return orders(session).length>0;
    if (personal.indexOf(page)!==-1) return !!self(session);
    return accountOnly.indexOf(page)!==-1;
  }
  function choose(session, id, date, courseId, proxy) {
    var p=person(session,id,proxy);
    if (!session.loggedIn||!p) return {ok:false,error:'当前账号无权为这位参会人选课。'};
    if (!active(session,p)) return {ok:false,error:'此报名当前没有有效参会权益，不能选课。'};
    if (session.phase==='post') return {ok:false,error:'会后仅可查看已选场次，不能再选课。'};
    if (date==='offsite' ? p.ticket!=='combo' : dates.indexOf(date)===-1||!hasForum(p)) return {ok:false,error:'当前参会权益不包含这项选课资格。'};
    var course=(courses[date]||[]).find(function(c){return c.id===courseId;});
    if (!course) return {ok:false,error:'请选择对应日期的有效场次。'};
    session.selections[p.id][date]=course.id;
    return {ok:true,person:p,course:course};
  }
  function courseName(session,id,date) {var selection=session.selections[id]||{};var course=(courses[date]||[]).find(function(c){return c.id===selection[date];});return course ? course.name : '尚未选择';}
  return {roles:roles,tickets:tickets,orderStates:orderStates,dates:dates,courses:courses,create:create,orders:orders,orderFor:orderFor,active:active,self:self,role:role,managed:managed,person:person,hasForum:hasForum,canOpen:canOpen,choose:choose,courseName:courseName};
}));
