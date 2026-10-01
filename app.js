const KEY="barisFinansV2";
const EDENRED_START=12500;
const GOAL=100000;
let data=JSON.parse(localStorage.getItem(KEY)||"[]");

const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format(n);
const month=()=>$("#monthPicker").value;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

$("#date").value=new Date().toISOString().slice(0,10);

function current(){return data.filter(t=>t.date.slice(0,7)===month())}
function render(){
  const tx=current();
  const income=tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
  const expense=tx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);
  const balance=income-expense;
  $("#income").textContent=money(income); $("#expense").textContent=money(expense); $("#balance").textContent=money(balance);
  $("#savingRate").textContent=(income?((balance/income)*100).toFixed(1):"0")+"%";

  const eden=tx.filter(t=>t.type==="expense"&&t.payment==="Edenred").reduce((a,t)=>a+t.amount,0);
  $("#edenredUsed").textContent=money(eden); $("#edenredLeft").textContent=money(Math.max(0,EDENRED_START-eden));

  const cats={}; tx.filter(t=>t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+t.amount);
  $("#categorySummary").innerHTML=Object.keys(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="summary-item"><div><span>${esc(k)}</span><strong>${money(v)}</strong></div></div>`).join(""):'<p class="muted">Bu ay gider kaydı yok.</p>';

  const goal=Math.max(0,data.filter(t=>t.type==="income"&&t.category==="Birikim").reduce((a,t)=>a+t.amount,0)-data.filter(t=>t.type==="expense"&&t.category==="Birikim").reduce((a,t)=>a+t.amount,0));
  $("#goalText").textContent=`${money(goal)} / ${money(GOAL)}`;
  $("#goalBar").style.width=Math.min(100,(goal/GOAL)*100)+"%";

  $("#transactions").innerHTML=tx.length?tx.slice().reverse().map(t=>`<div class="transaction"><div><strong>${esc(t.category)}</strong><div class="meta">${esc(t.person)} · ${esc(t.payment)} · ${esc(t.date)} · ${esc(t.note||"Not yok")}</div></div><div><strong class="${t.type}">${t.type==="income"?"+":"-"}${money(t.amount)}</strong><button class="delete" onclick="removeTx('${t.id}')">Sil</button></div></div>`).join(""):'<p class="muted">Bu ay kayıt yok.</p>';
}
window.removeTx=id=>{data=data.filter(t=>t.id!==id);save();render()};
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
$("#monthPicker").addEventListener("change",render);
$("#transactionForm").addEventListener("submit",e=>{
 e.preventDefault();
 const amount=Number($("#amount").value); if(!amount||amount<=0)return;
 data.push({id:crypto.randomUUID(),amount,type:$("#type").value,category:$("#category").value,person:$("#person").value,payment:$("#payment").value,date:$("#date").value,note:$("#note").value.trim()});
 save();e.target.reset();$("#date").value=new Date().toISOString().slice(0,10);render();
});
$("#clear").addEventListener("click",()=>{if(confirm("Tüm kayıtlar silinsin mi?")){data=[];save();render()}});
render();