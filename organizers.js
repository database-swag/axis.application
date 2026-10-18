(()=>{
const $=id=>document.getElementById(id),TK='forumOrgToken';
const login=$('loginPanel'),dash=$('dashboard');let all=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const H=()=>({apikey:CFG.key,Authorization:'Bearer '+sessionStorage.getItem(TK)});
function out(){sessionStorage.removeItem(TK);dash.hidden=true;login.hidden=false;$('password').value=''}
async function load(){
  try{const r=await fetch(CFG.url+'/rest/v1/applications?select=*&order=created_at.desc',{headers:H()});
    if(r.status===401||r.status===403){out();$('loginMessage').textContent='Сессия истекла. Войдите снова.';return}
    all=await r.json();login.hidden=true;dash.hidden=false;render()}
  catch{$('loginMessage').textContent='Нет связи с сервером.'}
}
$('loginForm').addEventListener('submit',async e=>{
  e.preventDefault();const m=$('loginMessage');m.textContent='';
  if(CFG.url.includes('PROJECT_ID')){m.textContent='Сайт ещё не подключён к базе данных.';return}
  try{const r=await fetch(CFG.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json'},body:JSON.stringify({email:CFG.organizerEmail,password:$('password').value})});
    const j=await r.json();if(!r.ok||!j.access_token){m.textContent='Неверный пароль.';return}
    sessionStorage.setItem(TK,j.access_token);load()}
  catch{m.textContent='Нет связи с сервером.'}
});
$('logout').addEventListener('click',out);
const shown=()=>{const q=$('search').value.trim().toLowerCase(),c=$('filter').value;return all.filter(x=>(!c||x.country===c)&&(!q||[x.name,x.email,x.phone,x.city].some(v=>String(v||'').toLowerCase().includes(q))))};
function render(){
  const f=$('filter'),old=f.value,cs=[...new Set(all.map(x=>x.country).filter(Boolean))].sort();
  f.innerHTML='<option value="">Все страны</option>'+cs.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join('');f.value=cs.includes(old)?old:'';
  const s=shown();$('count').textContent='Заявок: '+all.length+' / '+CFG.seats+' · показано '+s.length;
  $('rows').innerHTML=s.length?s.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(new Date(x.created_at).toLocaleString('ru-RU'))+'</td><td>'+esc(x.name)+'</td><td>'+esc(x.phone)+'</td><td>'+esc(x.email)+'</td><td>'+esc(x.city)+'</td><td>'+esc(x.grade)+'</td><td>'+esc(x.country)+'</td><td><button class="del" data-id="'+x.id+'" title="Удалить">✕</button></td></tr>').join(''):'<tr><td class="empty-row" colspan="9">Заявок пока нет.</td></tr>';
}
$('rows').addEventListener('click',async e=>{
  const b=e.target.closest('.del');if(!b)return;
  const x=all.find(a=>String(a.id)===b.dataset.id);if(!x||!confirm('Удалить заявку: '+x.name+'?'))return;
  const r=await fetch(CFG.url+'/rest/v1/applications?id=eq.'+encodeURIComponent(x.id),{method:'DELETE',headers:H()});
  if(r.ok){all=all.filter(a=>a.id!==x.id);render()}else alert('Не удалось удалить заявку.');
});
$('search').addEventListener('input',render);$('filter').addEventListener('change',render);
$('export').addEventListener('click',()=>{
  const cols=['Имя','Телефон','Email','Город','Класс/курс','Страна','Дата заявки'],cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  const lines=[cols,...shown().map(x=>[x.name,x.phone,x.email,x.city,x.grade,x.country,x.created_at])].map(r=>r.map(cell).join(';'));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));a.download='forum-applications.csv';a.click();URL.revokeObjectURL(a.href);
});
if(sessionStorage.getItem(TK))load();
})();
