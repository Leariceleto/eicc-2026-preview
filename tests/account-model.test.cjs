const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../assets/account-model.js');

test('四种身份由本人的报名与经办订单两个关系独立确定', () => {
  for (const role of Object.keys(M.roles)) {
    const s=M.create(role);
    assert.equal(M.role(s),role);
    assert.equal(!!M.self(s),role==='attendee'||role==='both');
    assert.equal(M.orders(s).length>0,role==='buyer'||role==='both');
  }
});
test('未登录和已登录未报名不同，后者仍有当前账号钱包', () => {
  const s=M.create('none');
  assert.equal(M.canOpen(s,'coins'),true);
  assert.equal(M.canOpen(s,'passport'),false);
  s.loggedIn=false;
  for (const route of ['coins','orders','passport','proxy'])assert.equal(M.canOpen(s,route),false);
  assert.equal(M.canOpen(s,'guide'),true);
});
test('四种已登录身份均可使用未来币充值入口，不依赖本人是否报名', () => {
  for(const role of Object.keys(M.roles)){
    const s=M.create(role);
    assert.equal(M.canOpen(s,'recharge'),true,role);
    s.loggedIn=false;
    assert.equal(M.canOpen(s,'recharge'),false,role);
  }
});
test('仅下单人无法进入他人的学习与入场页面，仅参会人无法进入经办与发票页面', () => {
  const buyer=M.create('buyer'), attendee=M.create('attendee');
  for (const route of ['registration','seat','forum','offsite','path','passport','organization','outcomes','profile'])assert.equal(M.canOpen(buyer,route),false,route);
  for (const route of ['orders','managed','proxy','invoice','transfer'])assert.equal(M.canOpen(attendee,route),false,route);
  for (const route of ['coins','tasks','exchange','redemptions'])assert.equal(M.canOpen(buyer,route),true,route);
});
test('仅参会人可查询本人权益，不会获得代报名订单的支付和发票权限', () => {
  const s=M.create('attendee');
  assert.equal(M.self(s).id,'self');
  assert.deepEqual(M.orders(s),[]);
  assert.deepEqual(M.managed(s),[]);
  assert.equal(M.person(s,'self',true),undefined);
});
test('下单人的未支付、已取消、已退款订单都保留，记录不等于有效参会资格', () => {
  const s=M.create('buyer');
  assert.deepEqual(M.orders(s).map(o=>o.status),['paid','pending','refunded','cancelled']);
  for(const id of ['chen','zhou','wang'])assert.equal(M.active(s,M.person(s,id,true)),false);
  s.orders.forEach(o=>o.status='refunded');
  assert.equal(M.role(s),'buyer');
  assert.equal(M.managed(s).length,5);
});
test('票种与身份正交：四种票种只改变本人权益，不赋予经办身份', () => {
  for(const ticket of Object.keys(M.tickets)) {
    const s=M.create('attendee',ticket);
    assert.equal(M.role(s),'attendee');
    assert.equal(M.self(s).ticket,ticket);
    assert.equal(M.canOpen(s,'orders'),false);
  }
});
test('代选以经办订单限定人员范围，未知参会人不能操作', () => {
  const s=M.create('buyer');
  assert.equal(M.choose(s,'outsider','12-02','forum-2-a',true).ok,false);
  assert.equal(M.choose(s,'lin','12-02','forum-2-a',false).ok,false);
  assert.equal(M.choose(s,'self','12-02','forum-2-a',true).ok,false);
});
test('分论坛每天一场、不同日期独立；更改某人某天不影响其他人或日期', () => {
  const s=M.create('both','combo',false);
  assert.equal(M.choose(s,'lin','12-02','forum-2-a',true).ok,true);
  assert.equal(M.choose(s,'lin','12-03','forum-3-a',true).ok,true);
  assert.equal(M.choose(s,'li','12-02','forum-2-a',true).ok,true);
  assert.equal(M.choose(s,'lin','12-02','forum-2-b',true).ok,true);
  assert.deepEqual(s.selections.lin,{'12-02':'forum-2-b','12-03':'forum-3-a'});
  assert.deepEqual(s.selections.li,{'12-02':'forum-2-a'});
  assert.deepEqual(s.selections.self,{});
});
test('场外深研课最多一场，主论坛单独购买者未选购不能直接选课', () => {
  const s=M.create('buyer','combo',false);
  assert.equal(M.choose(s,'lin','offsite','offsite-a',true).ok,true);
  assert.equal(M.choose(s,'lin','offsite','offsite-b',true).ok,true);
  assert.equal(s.selections.lin.offsite,'offsite-b');
  assert.equal(M.choose(s,'li','offsite','offsite-a',true).ok,false);
});
test('票种、日期、订单状态与会后阶段的选课约束不可绕过', () => {
  const s=M.create('both','online',false);
  assert.equal(M.choose(s,'self','12-02','forum-2-a',false).ok,false);
  assert.equal(M.choose(s,'lin','12-03','forum-2-a',true).ok,false);
  assert.equal(M.choose(s,'lin','12-04','forum-2-a',true).ok,false);
  assert.equal(M.choose(s,'chen','12-02','forum-2-a',true).ok,false);
  s.phase='post';
  assert.equal(M.choose(s,'lin','offsite','offsite-a',true).ok,false);
});
test('本人选课与代办本人是同一条记录，选课不改变登录账号或持有数据', () => {
  const s=M.create('both','combo',false);
  const login=s.userId, orders=JSON.stringify(s.orders);
  assert.equal(M.choose(s,'self','12-02','forum-2-a',false).ok,true);
  assert.equal(M.choose(s,'self','12-02','forum-2-b',true).ok,true);
  assert.equal(M.courseName(s,'self','12-02'),'12 月 2 日 · 分论坛 B（示例）');
  assert.equal(s.userId,login);
  assert.equal(JSON.stringify(s.orders),orders);
});
test('非法参数不会获得访问权限', () => {
  const s=M.create('buyer');
  assert.equal(M.canOpen(s,'unknown'),false);
  assert.equal(M.canOpen(s,'__proto__'),false);
  assert.equal(M.person(s,'__proto__',true),undefined);
});
