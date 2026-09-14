(function(){
var dialog=document.createElement('dialog');
dialog.setAttribute('aria-label','会议学习方式前置诊断');
dialog.className='diagnosis-dialog';
dialog.innerHTML='<button type="button" class="diagnosis-close" aria-label="关闭前置诊断">×</button><iframe title="会议学习方式前置诊断问卷"></iframe>';
document.body.appendChild(dialog);
var style=document.createElement('style');
style.textContent='.diagnosis-dialog{position:fixed;inset:0;margin:auto;width:min(640px,calc(100vw - 32px));height:min(680px,90dvh);max-width:none;max-height:none;padding:0;border:1px solid #dcd3c8;border-radius:10px;background:#f7f4ed;overflow:hidden}.diagnosis-dialog::backdrop{background:rgba(26,31,34,.55)}.diagnosis-dialog iframe{width:100%;height:100%;border:0}.diagnosis-close{position:absolute;right:7px;top:5px;border:0;background:#f7f4ed;color:#716b64;font-size:22px;width:28px;height:28px;cursor:pointer}@media(max-width:760px){.diagnosis-dialog{width:calc(100vw - 24px);height:min(680px,92dvh);margin:auto;border:1px solid #dcd3c8;border-radius:10px}}';
document.head.appendChild(style);
function completed(){try{return localStorage.getItem('eicc-diagnosis-completed-20260914')==='true';}catch(e){return false;}}
function open(){if(completed())return;dialog.querySelector('iframe').src='diagnosis.html?v=20260914-query-entry';if(!dialog.open)dialog.showModal();}
dialog.querySelector('button').addEventListener('click',function(){dialog.close();});
window.addEventListener('message',function(e){if(e.origin!==location.origin||e.source!==dialog.querySelector('iframe').contentWindow||!e.data)return;if(e.data.type==='eicc:diagnosis-close')dialog.close();if(e.data.type==='eicc:diagnosis-start'){dialog.close();location.href='diagnosis.html?step=questions&from=account';}});
document.addEventListener('click',function(e){
  var entry=e.target.closest('a.nav-cta.acct,a.mm-cta');
  if(!entry||entry.getAttribute('href')!=='#account'||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  setTimeout(open,0);
});
}());
