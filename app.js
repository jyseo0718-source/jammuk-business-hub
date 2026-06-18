const SUPABASE_URL = "https://xdjnbjgjydvhllyzalpx.supabase.co";
const SUPABASE_KEY = "sb_publishable_OutO4MsrAC6cAs2n1brQwg_L2y3jv4B";
const STATE_ID = "tokyo-trip-v1";
let supa = null;
let saveTimer = null;
let activeDay = "6/24";

function id(){return Math.random().toString(36).slice(2,9)}
function esc(v){return String(v||"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]))}
function won(n){return "₩"+Math.round(Number(n)||0).toLocaleString("ko-KR")}

const defaultState = () => ({
  schedule:[
    {id:id(),day:"6/24",time:"07:30",title:"김해 → 나리타",place:"비행 2시간",done:false},
    {id:id(),day:"6/24",time:"10:18",title:"나리타 → 긴자",place:"NEX 왕복권 / 웰컴스이카",done:false},
    {id:id(),day:"6/24",time:"11:30",title:"호텔 몬토레 긴자",place:"짐 보관",done:false},
    {id:id(),day:"6/24",time:"13:30",title:"아카짱혼포 긴시초",place:"유아용품 조사",done:false},
    {id:id(),day:"6/24",time:"17:50",title:"베이비저러스 이케부쿠로",place:"선샤인시티 B1",done:false},
    {id:id(),day:"6/25",time:"09:40",title:"도쿄 빅사이트",place:"LIFESTYLE Week 10:00~17:00",done:false},
    {id:id(),day:"6/25",time:"19:30",title:"긴자 리테일 조사",place:"무인양품/핸즈/로프트/메디야",done:false},
    {id:id(),day:"6/26",time:"09:00",title:"에토와루 카이토",place:"도매상 / 회원가입 확인",done:false},
    {id:id(),day:"6/26",time:"17:10",title:"나리타 → 김해",place:"19:15 김해 도착",done:false}
  ],
  companies:[
    {id:id(),name:"Miniware",cat:"베이비&키즈",booth:"",rating:5,oem:false,moq:"",price:"",memo:"이유식 식기 라인 확장 검토",done:false},
    {id:id(),name:"Pigeon",cat:"베이비&키즈",booth:"",rating:4,oem:false,moq:"",price:"",memo:"",done:false},
    {id:id(),name:"Combi",cat:"베이비&키즈",booth:"",rating:4,oem:false,moq:"",price:"",memo:"",done:false},
    {id:id(),name:"HABA",cat:"베이비&키즈",booth:"",rating:3,oem:false,moq:"",price:"",memo:"",done:false}
  ],
  checks:[
    {id:id(),text:"여권",done:false},{id:id(),text:"명함",done:false},{id:id(),text:"보조배터리",done:false},{id:id(),text:"엔화/스이카",done:false},{id:id(),text:"업체 명함 받기",done:false},{id:id(),text:"MOQ 확인",done:false},{id:id(),text:"단가 확인",done:false},{id:id(),text:"사진 촬영",done:false}
  ],
  expenses:[
    {id:id(),name:"항공권",cat:"항공",amt:380000},{id:id(),name:"호텔 2박",cat:"숙박",amt:610000}
  ]
});
let state = defaultState();

async function init(){
  const badge=document.getElementById("syncBadge");
  try{
    supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    badge.textContent="팀 공유 연결중";
    badge.className="badge";
    const {data,error}=await supa.from("app_state").select("data").eq("id",STATE_ID).maybeSingle();
    if(error) throw error;
    if(data?.data) state=data.data; else await saveNow();
    supa.channel("app_state_tokyo").on("postgres_changes",{event:"*",schema:"public",table:"app_state",filter:"id=eq."+STATE_ID},payload=>{
      if(payload.new?.data){state=payload.new.data; renderAll();}
    }).subscribe();
    badge.textContent="팀 공유 ON"; badge.className="badge on";
  }catch(e){
    console.warn(e); badge.textContent="내 기기 저장"; badge.className="badge err";
    const local=localStorage.getItem("jammuk-"+STATE_ID); if(local) state=JSON.parse(local);
  }
  renderAll();
}
async function saveNow(){
  if(supa){await supa.from("app_state").upsert({id:STATE_ID,data:state,updated_at:new Date().toISOString()});}
  else localStorage.setItem("jammuk-"+STATE_ID,JSON.stringify(state));
}
function save(){clearTimeout(saveTimer); saveTimer=setTimeout(saveNow,350)}

function go(page,btn){document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));document.getElementById(page).classList.add('on');document.querySelectorAll('nav button').forEach(b=>b.classList.remove('on'));btn.classList.add('on');renderAll();window.scrollTo(0,0)}
function renderAll(){renderHome();renderSchedule();renderCompanies();renderCheck();renderBudget();renderReport()}
function renderHome(){
  const trip=new Date(2026,5,24); const d=Math.ceil((trip-new Date())/86400000);
  document.getElementById('dday').textContent=d>0?`D-${d}`:(d===0?'D-DAY':'출장 완료');
  const today=state.schedule.filter(s=>s.day===activeDay);
  document.getElementById('todayCount').textContent=today.length;
  document.getElementById('companyCount').textContent=state.companies.length;
  document.getElementById('memoCount').textContent=state.companies.filter(c=>c.memo).length;
  document.getElementById('doneCount').textContent=state.companies.filter(c=>c.done).length;
  document.getElementById('todayList').innerHTML=today.map(s=>rowSchedule(s)).join('')||'<div class="card2">일정 없음</div>';
}
function renderSchedule(){
  document.getElementById('dayTabs').innerHTML=['6/24','6/25','6/26'].map(d=>`<button class="${d===activeDay?'on':''}" onclick="activeDay='${d}';renderAll()">${d}</button>`).join('');
  document.getElementById('scheduleList').innerHTML=state.schedule.filter(s=>s.day===activeDay).sort((a,b)=>a.time.localeCompare(b.time)).map(s=>rowSchedule(s,true)).join('')||'<div class="card2">일정 없음</div>';
}
function rowSchedule(s,del=false){return `<div class="row"><div class="rowTop"><span class="pill">${esc(s.time)}</span><div class="rowTitle ${s.done?'done':''}">${esc(s.title)}</div><button class="mini" onclick="toggleSchedule('${s.id}')">${s.done?'✓':'완료'}</button></div><div class="meta">${esc(s.place)}</div>${del?`<div class="actions"><button class="mini danger" onclick="delSchedule('${s.id}')">삭제</button></div>`:''}</div>`}
function addSchedule(){const title=schTitle.value.trim(); if(!title)return; state.schedule.push({id:id(),day:activeDay,time:schTime.value||'',title,place:schPlace.value||'',done:false}); schTime.value=schTitle.value=schPlace.value=''; renderAll(); save()}
function toggleSchedule(i){const x=state.schedule.find(s=>s.id===i); if(x){x.done=!x.done;renderAll();save()}}
function delSchedule(i){state.schedule=state.schedule.filter(s=>s.id!==i);renderAll();save()}

function renderCompanies(){
  const q=(document.getElementById('search')?.value||'').toLowerCase();
  document.getElementById('companyList').innerHTML=state.companies.filter(c=>c.name.toLowerCase().includes(q)||c.cat.toLowerCase().includes(q)).map(c=>`<div class="row"><div class="rowTop"><div class="rowTitle">${esc(c.name)}</div><span class="pill">${esc(c.cat)}</span></div><div class="meta">부스 ${esc(c.booth||'-')} · 관심도 <span class="star">${'★'.repeat(c.rating||0)}</span> · OEM ${c.oem?'가능':'미확인'}</div><textarea placeholder="상담 메모 / MOQ / 단가" oninput="updateCompany('${c.id}','memo',this.value)">${esc(c.memo)}</textarea><input placeholder="MOQ" value="${esc(c.moq)}" oninput="updateCompany('${c.id}','moq',this.value)"><input placeholder="단가" value="${esc(c.price)}" oninput="updateCompany('${c.id}','price',this.value)"><div class="actions"><button class="mini" onclick="toggleCompany('${c.id}','done')">${c.done?'방문완료 ✓':'방문완료'}</button><button class="mini" onclick="toggleCompany('${c.id}','oem')">OEM ${c.oem?'✓':''}</button><button class="mini" onclick="rateCompany('${c.id}')">★ 변경</button><button class="mini danger" onclick="delCompany('${c.id}')">삭제</button></div></div>`).join('')||'<div class="card2">업체 없음</div>';
}
function addCompany(){const name=coName.value.trim(); if(!name)return; state.companies.push({id:id(),name,cat:coCat.value,booth:coBooth.value,rating:3,oem:false,moq:'',price:'',memo:'',done:false}); coName.value=coBooth.value=''; renderAll(); save()}
function updateCompany(i,k,v){const c=state.companies.find(x=>x.id===i); if(c){c[k]=v;save()}}
function toggleCompany(i,k){const c=state.companies.find(x=>x.id===i); if(c){c[k]=!c[k];renderAll();save()}}
function rateCompany(i){const c=state.companies.find(x=>x.id===i); if(c){c.rating=(c.rating||0)%5+1;renderAll();save()}}
function delCompany(i){state.companies=state.companies.filter(c=>c.id!==i);renderAll();save()}

function renderCheck(){document.getElementById('checkList').innerHTML=state.checks.map(c=>`<div class="row chk"><div class="box ${c.done?'on':''}" onclick="toggleCheck('${c.id}')">${c.done?'✓':''}</div><div class="rowTitle ${c.done?'done':''}">${esc(c.text)}</div><button class="mini danger" onclick="delCheck('${c.id}')">삭제</button></div>`).join('')}
function addCheck(){const text=checkText.value.trim(); if(!text)return; state.checks.push({id:id(),text,done:false}); checkText.value='';renderAll();save()}
function toggleCheck(i){const c=state.checks.find(x=>x.id===i); if(c){c.done=!c.done;renderAll();save()}}
function delCheck(i){state.checks=state.checks.filter(c=>c.id!==i);renderAll();save()}

function renderBudget(){const total=state.expenses.reduce((s,e)=>s+Number(e.amt||0),0);budgetTotal.textContent=won(total);expenseList.innerHTML=state.expenses.map(e=>`<div class="row"><div class="rowTop"><div class="rowTitle">${esc(e.name)}</div><b>${won(e.amt)}</b></div><div class="meta">${esc(e.cat)}</div><div class="actions"><button class="mini danger" onclick="delExpense('${e.id}')">삭제</button></div></div>`).join('')}
function addExpense(){const name=exName.value.trim(); if(!name)return; state.expenses.push({id:id(),name,amt:Number(exAmt.value)||0,cat:exCat.value}); exName.value=exAmt.value='';renderAll();save()}
function delExpense(i){state.expenses=state.expenses.filter(e=>e.id!==i);renderAll();save()}

function renderReport(){
  const done=state.companies.filter(c=>c.done).length, memo=state.companies.filter(c=>c.memo).length, oem=state.companies.filter(c=>c.oem).length;
  const budget=state.expenses.reduce((s,e)=>s+Number(e.amt||0),0);
  reportBox.innerHTML=`<p>방문 완료 업체: <b>${done}</b> / ${state.companies.length}</p><p>메모 작성 업체: <b>${memo}</b></p><p>OEM 가능/후보: <b>${oem}</b></p><p>체크 완료: <b>${state.checks.filter(c=>c.done).length}</b> / ${state.checks.length}</p><p>총 지출: <b>${won(budget)}</b></p>`;
}
init();
