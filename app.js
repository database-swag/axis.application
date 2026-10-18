(()=>{
const form=document.getElementById('registrationForm');if(!form)return;
const msg=document.getElementById('formMessage'),btn=form.querySelector('button[type=submit]');
const say=(t,ok)=>{msg.textContent=t;msg.style.color=ok?'#197048':'#b63a30'};
const normPhone=v=>{let d=String(v).replace(/\D/g,'');if(d.startsWith('996'))return d;if(d.startsWith('0')&&d.length===10)return'996'+d.slice(1);if(d.length===9)return'996'+d;return d};
form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  if(CFG.url.includes('PROJECT_ID')){say('Сайт ещё не подключён к базе данных.');return}
  const fd=new FormData(form),phone=normPhone(fd.get('phone'));
  if(phone.length<9){say('Проверьте номер телефона.');return}
  const row={name:fd.get('name').trim(),phone,email:fd.get('email').trim().toLowerCase(),city:fd.get('city').trim(),grade:fd.get('grade').trim(),country:fd.get('country')};
  btn.disabled=true;say('Отправляем…',true);
  try{
    const r=await fetch(CFG.url+'/rest/v1/applications',{method:'POST',headers:{apikey:CFG.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(row)});
    if(r.ok){form.reset();say('Спасибо! Ваша заявка принята.',true)}
    else{const t=JSON.stringify(await r.json().catch(()=>({})));
      if(t.includes('LIMIT_REACHED')){say('Регистрация завершена: все места заняты.');[...form.elements].forEach(x=>x.disabled=true)}
      else if(t.includes('23505')&&t.includes('phone'))say('Этот номер телефона уже зарегистрирован.');
      else if(t.includes('23505'))say('Этот email уже зарегистрирован.');
      else say('Не удалось отправить заявку. Попробуйте ещё раз.')}
  }catch{say('Нет связи с сервером. Проверьте интернет и попробуйте снова.')}
  if(!form.elements[0].disabled)btn.disabled=false;
});
})();
