const KEY="barisFinansV2_1";
const EDENRED_START=12500;
let data=JSON.parse(localStorage.getItem(KEY)||"[]");
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format(n);
const month=()=>$("#monthPicker").value;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
$("#date").value=new Date().toISOString().slice(0,10);

function setCategories(){
  const type=$("#type").value;
  const cat=$("#category");
  if(type==="income"){
    cat.innerHTML='<option>Maaş</option><option>Kazanç</option><option>Ek Gelir</option><option>Diğer Gelir</option>';
  } else if(type==="saving" || type==="saving_withdraw"){
    cat.innerHTML='<option>Acil Durum Fonu</option><option>Genel Birikim</option><option>Hedef Birikim</option>';
  } else {
    cat.innerHTML='<option>Market</option><option>Yakıt</option><option>Dışarıda Yemek</option><option>Fatura</option><option>Kira</option><option>Aidat</option><option>Motor</option><option>Eğlence</option><option>Kişisel</option><option>Diğer Gider</option>';
  }
}
$("#type").addEventListener("change",setCategories);

function current(){return data.filter(t=>t.date.slice(0,7)===month())}
function render(){
  const tx=current();
  const income=tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
  const expense=tx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);
  const saved=tx.filter(t=>t.type==="saving").reduce((a,t)=>a+t.amount,0);
  const withdrawn=tx.filter(t=>t.type==="saving_withdraw").reduce((a,t)=>a+t.amount,0);
  const savings=Math.max(0,saved-withdrawn);
  const spendable=Math.max(0,income-expense-saved+withdrawn);
  $("#income").textContent=money(income);
  $("#expense").textContent=money(expense);
  $("#spendable").textContent=money(spendable);
  $("#savingRate").textContent=(income?((saved/income)*100):0).toFixed(1)+"%";
  $("#savings").textContent=money(savings);

  const eden=tx.filter(t=>t.type==="expense"&&t.payment==="Edenred").reduce((a,t)=>a+t.amount,0);
  $("#edenredUsed").textContent=money(eden);
  $("#edenredLeft").textContent=money(Math.max(0,EDENRED_START-eden));

  const cats={}; tx.filter(t=>t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+t.amount);
  $("#categorySummary").innerHTML=Object.keys(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="summary-item"><div><span>${esc(k)}</span><strong>${money(v)}</strong></div></div>`).join(""):'<p class="muted">Bu ay gider kaydı yok.</p>';

  $("#transactions").innerHTML=tx.length?tx.slice().reverse().map(t=>{
    const sign=t.type==="income"?"+":t.type==="expense"?"-":t.type==="saving"?"↗":"↙";
    const label=t.type==="saving"?"Birikime aktarıldı":t.type==="saving_withdraw"?"Birikimden çekildi":t.type==="income"?"Gelir":"Gider";
    return `<div class="transaction"><div><strong>${label}: ${esc(t.category)}</strong><div class="meta">${esc(t.person)} · ${esc(t.payment)} · ${esc(t.date)} · ${esc(t.note||"Açıklama yok")}</div></div><div><strong class="${t.type}">${sign}${money(t.amount)}</strong><button class="delete" onclick="removeTx('${t.id}')">Sil</button></div></div>`
  }).join(""):'<p class="muted">Bu ay kayıt yok.</p>';
}
window.removeTx=id=>{data=data.filter(t=>t.id!==id);save();render()};
function save(){localStorage.setItem(KEY,JSON.stringify(data))}
$("#monthPicker").addEventListener("change",render);
$("#transactionForm").addEventListener("submit",e=>{
 e.preventDefault();
 const amount=Number($("#amount").value); if(!amount||amount<=0)return;
 data.push({id:crypto.randomUUID(),amount,type:$("#type").value,category:$("#category").value,person:$("#person").value,payment:$("#payment").value,date:$("#date").value,note:$("#note").value.trim()});
 save();e.target.reset();$("#date").value=new Date().toISOString().slice(0,10);setCategories();render();
});
$("#clear").addEventListener("click",()=>{if(confirm("Tüm V2.1 kayıtları silinsin mi?")){data=[];save();render()}});
setCategories();render();