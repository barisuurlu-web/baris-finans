const KEY = "barisFinansTransactions";
let transactions = JSON.parse(localStorage.getItem(KEY) || "[]");

const money = n => new Intl.NumberFormat("tr-TR", {style:"currency", currency:"TRY", maximumFractionDigits:2}).format(n);

function render(){
  const income = transactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expense = transactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  document.querySelector("#income").textContent = money(income);
  document.querySelector("#expense").textContent = money(expense);
  document.querySelector("#balance").textContent = money(income-expense);

  const box = document.querySelector("#transactions");
  if(!transactions.length){
    box.innerHTML = '<p class="muted">Henüz kayıt yok.</p>';
    return;
  }
  box.innerHTML = transactions.slice().reverse().map(t => `
    <div class="transaction">
      <div>
        <strong>${escapeHtml(t.category)}</strong>
        <div class="meta">${escapeHtml(t.person)} · ${escapeHtml(t.note || "Not yok")} · ${escapeHtml(t.date)}</div>
      </div>
      <div class="${t.type==="income" ? "amount-income" : "amount-expense"}">
        ${t.type==="income" ? "+" : "-"}${money(t.amount)}
      </div>
    </div>`).join("");
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

document.querySelector("#transactionForm").addEventListener("submit", e=>{
  e.preventDefault();
  const amount = Number(document.querySelector("#amount").value);
  if(!amount || amount <= 0) return;
  transactions.push({
    amount,
    type: document.querySelector("#type").value,
    category: document.querySelector("#category").value,
    person: document.querySelector("#person").value,
    note: document.querySelector("#note").value.trim(),
    date: new Date().toLocaleDateString("tr-TR")
  });
  localStorage.setItem(KEY, JSON.stringify(transactions));
  e.target.reset();
  render();
});

document.querySelector("#clear").addEventListener("click", ()=>{
  if(confirm("Tüm kayıtlar silinsin mi?")){
    transactions = [];
    localStorage.setItem(KEY, "[]");
    render();
  }
});

render();
