// Контакты менеджеров: заполнить перед запуском (номер WhatsApp цифрами, ник Telegram, ссылка MAX)
const CONTACTS={whatsapp:'',telegram:'',max:''};

const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const rub=n=>Math.round(n).toLocaleString('ru-RU')+' ₽';

// панель выбора мессенджера: одна логика для конструктора и калькулятора
function openSend(panel,text){
  const note=panel.querySelector('.msg-note'),t=encodeURIComponent(text);
  const links={
    whatsapp:CONTACTS.whatsapp&&'https://wa.me/'+CONTACTS.whatsapp+'?text='+t,
    telegram:CONTACTS.telegram&&'https://t.me/'+CONTACTS.telegram,
    max:CONTACTS.max
  };
  panel.querySelectorAll('a[data-m]').forEach(a=>{
    const url=links[a.dataset.m];
    a.href=url||'#';
    a.onclick=ev=>{
      if(!url){ev.preventDefault();note.textContent='Контакты мессенджеров добавим перед запуском сайта.';return}
      if(a.dataset.m!=='whatsapp'&&navigator.clipboard){try{navigator.clipboard.writeText(text)}catch(e){}note.textContent='Текст заявки скопирован, вставьте его в чат.'}
    };
  });
  note.textContent='';
  panel.classList.add('on');
}

// конструктор заявки на первом экране
const form=document.getElementById('trip');
if(form){
  const send=form.querySelector('.send');
  form.date.min=new Date().toISOString().slice(0,10);
  // пустая дата серая, как остальные подсказки
  const dt=()=>form.date.classList.toggle('has',!!form.date.value);form.date.addEventListener('input',dt);dt();
  const message=()=>{
    const d=new FormData(form),f=k=>(d.get(k)||'').toString().trim();
    const date=f('date')?new Date(f('date')).toLocaleDateString('ru-RU'):'';
    const shifts=d.getAll('shift').join(' и ');
    return ['Здравствуйте! Хочу рассчитать перевозку сотрудников.',f('service')&&'Объект: '+f('service'),shifts&&'Смены: '+shifts,
      f('from')&&'Откуда: '+f('from'),f('to')&&'Куда: '+f('to'),date&&'С какого числа: '+date,f('people')&&'Человек в смене: '+f('people')]
      .filter(Boolean).join('\n');
  };
  form.addEventListener('submit',e=>{e.preventDefault();openSend(send,message())});

}

// калькулятор
const calc=document.getElementById('calc-form');
if(calc){
  const VEH=[{n:'микроавтобус',seats:20,rate:3000},{n:'средний автобус',seats:31,rate:4000},{n:'туристический автобус',seats:55,rate:4200}];
  const out=k=>calc.querySelector('[data-o="'+k+'"]');
  // самый дешёвый набор машин, который вмещает смену
  const pick=people=>{
    let best=null;
    for(let c=0;c<=Math.ceil(people/55);c++)for(let b=0;b<=3;b++)for(let a=0;a<=3;a++){
      if(a*20+b*31+c*55<people)continue;
      const cost=a*3000+b*4000+c*4200,cnt=a+b+c;
      if(!best||cost<best.cost||(cost===best.cost&&cnt<best.cnt))best={a,b,c,cost,cnt};
    }
    return best;
  };
  const plural=(n,f)=>f[(n%10===1&&n%100!==11)?0:(n%10>=2&&n%10<=4&&(n%100<10||n%100>=20))?1:2];
  // сумма как вокзальное табло: меняются только те цифры, что изменились
  const board=(el,s)=>{
    let tiles=el.querySelector('.tiles');
    if(!tiles){el.innerHTML='<span class="tiles"></span><small>₽ в месяц</small>';tiles=el.firstChild}
    const chars=[...s.replace(/\s/g,' ')],old=[...tiles.children];
    while(tiles.children.length>chars.length)tiles.lastChild.remove();
    chars.forEach((c,i)=>{
      let d=tiles.children[i];
      if(!d){d=document.createElement('span');tiles.append(d)}
      if(d.textContent===c)return;
      d.textContent=c;d.className='d'+(c===' '?' sp':'');
      if(!reduce&&old[i]){d.offsetWidth;d.classList.add('flip')}
    });
    el.setAttribute('aria-label',s+' рублей в месяц');
  };
  let last='';
  const run=()=>{
    const v=k=>+calc.elements[k].value;
    const people=v('people'),hours=v('hours'),days=v('days'),shifts=+calc.querySelector('input[name=shifts]:checked').value;
    calc.querySelectorAll('input[type=range]').forEach(r=>r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100)+'%'));
    out('people').value=people;out('hours').value=hours+' ч';out('days').value=days;
    const p=pick(people),day=p.cost*hours*shifts,month=day*days;
    const cars=[[p.c,2],[p.b,1],[p.a,0]].filter(x=>x[0]).map(([n,i])=>n+' × '+VEH[i].n);
    board(out('month'),rub(month).replace(' ₽',''));
    out('day').textContent=rub(day);
    out('seat').textContent=rub(month/(people*days*shifts*2));
    out('cars').textContent=cars.join(' + ');
    out('cnt').textContent=p.cnt+' '+plural(p.cnt,['машина','машины','машин'])+' на смену';
    const svc=calc.elements.service.value;
    last=['Здравствуйте! Посчитал перевозку сотрудников на сайте.',...(svc?['Интересует: '+svc]:[]),'Человек в смене: '+people,'Смен в сутки: '+shifts,
      'Часов работы машин на смену: '+hours,'Рабочих дней в месяц: '+days,'Машины: '+cars.join(' + '),'Примерно: '+rub(month)+' в месяц'].join('\n');
  };
  calc.addEventListener('input',run);calc.addEventListener('change',run);run();
  calc.addEventListener('submit',e=>{e.preventDefault();openSend(calc.querySelector('.send'),last)});
  // кнопки «Рассчитать» на карточках: запоминаем выбор и ведём в калькулятор
  document.querySelectorAll('button.svc-go').forEach(b=>b.addEventListener('click',()=>{
    calc.elements.service.value=b.dataset.service;run();
    calc.querySelector('.send').classList.remove('on');
    document.getElementById('calc').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
    setTimeout(()=>calc.elements.people.focus({preventScroll:true}),700);
  }));
}

// страница контактов: кнопки мессенджеров с текстом по умолчанию
document.querySelectorAll('[data-send]').forEach(p=>openSend(p,'Здравствуйте! Хочу рассчитать перевозку сотрудников.'));

// меню на телефоне
const drawer=document.querySelector('.drawer');
if(drawer){
  const toggle=on=>{drawer.classList.toggle('on',on);document.body.classList.toggle('lock',on);drawer.setAttribute('aria-hidden',!on)};
  document.querySelector('.burger').addEventListener('click',()=>toggle(true));
  drawer.querySelector('.close').addEventListener('click',()=>toggle(false));
  drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>toggle(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')toggle(false)});
}

// плавное появление блоков при прокрутке
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.head,.grid,.reveal').forEach(el=>io.observe(el));

// активный пункт меню
document.querySelectorAll('.menu a,.drawer nav a').forEach(a=>{
  const h=a.getAttribute('href');
  if(!h.includes('#')&&location.pathname.endsWith(h.replace(/^(\.\.\/)+/,'')))a.setAttribute('aria-current','page');
});

// крупные цифры: считают до своего значения, когда показались
const count=b=>{
  const m=b.textContent.match(/(\d+)(.*)/);if(!m||reduce)return;
  const end=+m[1],tail=m[2],t0=performance.now(),dur=1400;
  const tick=t=>{const k=Math.min(1,Math.max(0,(t-t0)/dur)),e=1-Math.pow(1-k,3);b.textContent=Math.round(end*e)+tail;if(k<1)requestAnimationFrame(tick)};
  requestAnimationFrame(tick);
};
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){count(e.target);cio.unobserve(e.target)}}),{threshold:.5});
document.querySelectorAll('.bn b').forEach(b=>cio.observe(b));

// сцена: автобус проезжает через экран, фразы сменяются
const drive=document.querySelector('.drive');
// лента автопарка: на компьютере едет вбок при прокрутке, на телефоне листается пальцем
const rail=document.querySelector('.rail');
if(!reduce&&(drive||rail)){
  const words=drive?[...drive.querySelectorAll('.drive-words li')]:[];
  const lines=drive?[...drive.querySelectorAll('.drive-lines i')]:[];
  const track=rail&&rail.querySelector('.track');
  const wide=matchMedia('(min-width:901px) and (min-height:600px)');
  if(drive)drive.classList.add('live');
  let lastY=scrollY,speed=0,dist=0;
  const setRail=()=>{
    if(!rail)return;
    rail.classList.toggle('live',wide.matches);
    const s=track.children,pad=parseFloat(getComputedStyle(track).paddingLeft);
    // насколько сдвинуть ленту, чтобы последняя машина встала по правому краю сетки
    dist=Math.max(0,s[s.length-1].offsetLeft+s[s.length-1].offsetWidth-s[0].offsetLeft-(document.documentElement.clientWidth-2*pad));
    rail.style.height=wide.matches?(innerHeight+dist)+'px':'';
    if(!wide.matches)track.style.removeProperty('--tx');
  };
  const prog=el=>{const r=el.getBoundingClientRect(),h=r.height-innerHeight;return h>0?Math.min(1,Math.max(0,-r.top/h)):0};
  // положение считаем прямо при прокрутке; скорость линий плавно гаснет отдельным кадром
  const update=()=>{
    speed=Math.min(60,speed*.6+Math.abs(scrollY-lastY));lastY=scrollY;
    if(drive){
      const p=prog(drive);
      drive.style.setProperty('--bx',(-75+150*p).toFixed(2)+'vw');
      const k=Math.min(2,Math.floor(p*3));
      words.forEach((w,i)=>w.classList.toggle('on',i===k));
      lines.forEach((l,i)=>l.style.setProperty('--lx',(((1-p)*(140+i*30))-40).toFixed(1)+'vw'));
    }
    if(rail&&rail.classList.contains('live'))track.style.setProperty('--tx',(-prog(rail)*dist).toFixed(1)+'px');
  };
  let fading=false;
  const fade=()=>{
    speed*=.9;if(drive)drive.style.setProperty('--lv',Math.min(.9,speed/25).toFixed(2));
    if(speed>.5)requestAnimationFrame(fade);else{fading=false;if(drive)drive.style.setProperty('--lv',0)}
  };
  addEventListener('scroll',()=>{update();if(!fading){fading=true;requestAnimationFrame(fade)}},{passive:true});
  const setAll=()=>{setRail();update()};
  setAll();addEventListener('resize',setAll);addEventListener('load',setAll);
}

// кнопки слегка притягиваются к курсору
if(!reduce&&matchMedia('(hover:hover) and (pointer:fine)').matches)document.querySelectorAll('.pill,.round').forEach(b=>{
  b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.translate=((e.clientX-r.left-r.width/2)*.18).toFixed(1)+'px '+((e.clientY-r.top-r.height/2)*.3).toFixed(1)+'px'});
  b.addEventListener('pointerleave',()=>{b.style.translate=''});
});

// свет и обводка за курсором на плашках
if(matchMedia('(hover:hover)').matches)document.querySelectorAll('.glass,.svc,.car,.final,.slide').forEach(el=>{
  if(el.closest('.hero'))return;
  el.classList.add('spot');
  el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--x',(e.clientX-r.left)+'px');el.style.setProperty('--y',(e.clientY-r.top)+'px')});
});
