const DB_NAME="BarisFinansDB",DB_VERSION=1,STORE="transactions";
const EDENRED_START=12500;
let data=[];
const $=s=>document.querySelector(s);
const money=n=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const today=new Date();
$("#monthPicker").value=today.toISOString().slice(0,7);
$("#date").value=today.toISOString().slice(0,10);

function openDB(){
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,DB_VERSION);
  req.onupgradeneeded=e=>{if(!e.target.result.objectStoreNames.contains(STORE))e.target.result.createObjectStore(STORE,{keyPath:"id"})};
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
 });
}
async function load(){
 try{
  const db=await openDB();
  data=await new Promise((resolve,reject)=>{
   const r=db.transaction(STORE,"readonly").objectStore(STORE).getAll();
   r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);
  });
  $("#storageStatus").textContent="✓ Veriler bu cihazda kalıcı olarak saklanıyor";
  render();
 }catch(e){$("#storageStatus").textContent="⚠ Veri depolama hatası";console.error(e)}
}
async function saveTx(tx){
 const db=await openDB();
 await new Promise((resolve,reject)=>{
  const r=db.transaction(STORE,"readwrite").objectStore(STORE).put(tx);
  r.onsuccess=resolve;r.onerror=()=>reject(r.error);
 });
}
async function deleteTx(id){
 const db=await openDB();
 await new Promise((resolve,reject)=>{
  const r=db.transaction(STORE,"readwrite").objectStore(STORE).delete(id);
  r.onsuccess=resolve;r.onerror=()=>reject(r.error);
 });
 data=data.filter(t=>t.id!==id);render();
}
window.removeTx=deleteTx;

function setCategories(){
 const type=$("#type").value,cat=$("#category");
 if(type==="income")cat.innerHTML='<option>Maaş</option><option>Kazanç</option><option>Ek Gelir</option><option>Diğer Gelir</option>';
 else if(type==="saving"||type==="saving_withdraw")cat.innerHTML='<option>Acil Durum Fonu</option><option>Genel Birikim</option><option>Hedef Birikim</option>';
 else cat.innerHTML='<option>Market</option><option>Yakıt</option><option>Dışarıda Yemek</option><option>Fatura</option><option>Kira</option><option>Aidat</option><option>Motor</option><option>Eğlence</option><option>Kişisel</option><option>Diğer Gider</option>';
}
function current(){return data.filter(t=>t.date.slice(0,7)===$("#monthPicker").value)}
function render(){
 const tx=current();
 const income=tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0);
 const expense=tx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0);
 const saved=tx.filter(t=>t.type==="saving").reduce((a,t)=>a+t.amount,0);
 const withdrawn=tx.filter(t=>t.type==="saving_withdraw").reduce((a,t)=>a+t.amount,0);
 const savings=Math.max(0,saved-withdrawn);
 const spendable=income-expense-saved+withdrawn;
 $("#income").textContent=money(income);$("#expense").textContent=money(expense);$("#spendable").textContent=money(spendable);
 $("#savingRate").textContent=(income?(saved/income*100):0).toFixed(1)+"%";$("#savings").textContent=money(savings);
 const eden=tx.filter(t=>t.type==="expense"&&t.payment==="Edenred").reduce((a,t)=>a+t.amount,0);
 $("#edenredUsed").textContent=money(eden);$("#edenredLeft").textContent=money(Math.max(0,EDENRED_START-eden));

 const funds={};data.filter(t=>t.type==="saving"||t.type==="saving_withdraw").forEach(t=>funds[t.category]=(funds[t.category]||0)+(t.type==="saving"?t.amount:-t.amount));
 $("#fundSummary").innerHTML=Object.keys(funds).length?Object.entries(funds).map(([k,v])=>`<div class="fund-item"><div><span>${esc(k)}</span><strong>${money(Math.max(0,v))}</strong></div></div>`).join(""):'<p class="muted">Henüz birikim yok.</p>';

 const cats={};tx.filter(t=>t.type==="expense").forEach(t=>cats[t.category]=(cats[t.category]||0)+t.amount);
 $("#categorySummary").innerHTML=Object.keys(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="summary-item"><div><span>${esc(k)}</span><strong>${money(v)}</strong></div></div>`).join(""):'<p class="muted">Bu ay gider kaydı yok.</p>';

 $("#transactions").innerHTML=tx.length?tx.slice().reverse().map(t=>{
  const sign=t.type==="income"?"+":t.type==="expense"?"-":t.type==="saving"?"↗":"↙";
  const label=t.type==="saving"?"Birikime aktarıldı":t.type==="saving_withdraw"?"Birikimden çekildi":t.type==="income"?"Gelir":"Gider";
  return `<div class="transaction"><div><strong>${label}: ${esc(t.category)}</strong><div class="meta">${esc(t.person)} · ${esc(t.payment)} · ${esc(t.date)} · ${esc(t.note||"Açıklama yok")}</div></div><div><strong class="${t.type}">${sign}${money(t.amount)}</strong> <button class="delete" onclick="removeTx('${t.id}')">Sil</button></div></div>`;
 }).join(""):'<p class="muted">Bu ay kayıt yok.</p>';
}
$("#type").addEventListener("change",setCategories);$("#monthPicker").addEventListener("change",render);
$("#transactionForm").addEventListener("submit",async e=>{
 e.preventDefault();const amount=Number($("#amount").value);if(!amount||amount<=0)return;
 const tx={id:crypto.randomUUID(),amount,type:$("#type").value,category:$("#category").value,person:$("#person").value,payment:$("#payment").value,date:$("#date").value,note:$("#note").value.trim()};
 try{await saveTx(tx);data.push(tx);e.target.reset();$("#date").value=today.toISOString().slice(0,10);setCategories();render()}catch(err){alert("Kayıt yapılamadı.");console.error(err)}
});
$("#clear").addEventListener("click",async()=>{
 if(!confirm("Bu cihazdaki tüm Barış Finans kayıtları silinsin mi?"))return;
 const db=await openDB();await new Promise((resolve,reject)=>{const r=db.transaction(STORE,"readwrite").objectStore(STORE).clear();r.onsuccess=resolve;r.onerror=()=>reject(r.error)});
 data=[];render();
});
setCategories();load();