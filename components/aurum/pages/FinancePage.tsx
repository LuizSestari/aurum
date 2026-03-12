"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PageHeader from "../shared/PageHeader";
import StatCards from "../shared/StatCards";
import Modal from "../shared/Modal";
import { loadData, addTransaction, deleteTransaction, type Transaction } from "@/lib/aurum-store";
import { useAuth } from "@/lib/aurum-auth";
import { UpgradeModal } from "../UpgradeModal";

const CATEGORIES = ["Salário", "Freelance", "Investimentos", "Alimentação", "Transporte", "Moradia", "Saúde", "Educação", "Lazer", "Outros"];

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function FinancePage() {
  const auth = useAuth();
  const [tab, setTab] = useState("finance");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<"all" | "receita" | "despesa">("all");
  const [showModal, setShowModal] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fType, setFType] = useState<Transaction["type"]>("despesa");
  const [fCategory, setFCategory] = useState("Outros");
  const [fDate, setFDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if financeAnalysis feature is available
  const hasFinanceAnalysisAccess = auth.canUseFeature("financeAnalysis");

  const reload = useCallback(() => { setTransactions(loadData().transactions); }, []);
  useEffect(() => { reload(); }, [reload]);

  const openCreate = (type?: Transaction["type"]) => {
    setFTitle(""); setFAmount(""); setFType(type ?? "despesa"); setFCategory("Outros");
    setFDate(new Date().toISOString().slice(0, 10)); setShowModal(true);
  };
  const handleSave = () => {
    if (!fTitle.trim() || !fAmount) return;
    addTransaction({ title: fTitle.trim(), amount: parseFloat(fAmount), type: fType, category: fCategory, date: fDate });
    setShowModal(false); reload();
  };
  const handleDelete = (id: string) => { deleteTransaction(id); reload(); };

  const income = transactions.filter((t) => t.type === "receita").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === "despesa").reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  let displayed = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);
  displayed = [...displayed].sort((a, b) => b.date.localeCompare(a.date));

  // Simple bar chart data — last 6 months
  const monthLabels: string[] = [];
  const monthIncome: number[] = [];
  const monthExpense: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    monthLabels.push(d.toLocaleDateString("pt-BR", { month: "short" }));
    monthIncome.push(transactions.filter((t) => t.type === "receita" && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0));
    monthExpense.push(transactions.filter((t) => t.type === "despesa" && t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0));
  }
  const maxBar = Math.max(...monthIncome, ...monthExpense, 1);

  // Analysis: spending by category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "despesa").forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);
  const maxCat = categoryBreakdown.length > 0 ? categoryBreakdown[0][1] : 1;

  // Show upgrade modal if feature is not available
  if (!hasFinanceAnalysisAccess) {
    return (
      <div className="relative h-full w-full">
        {/* Blurred background content */}
        <div className="absolute inset-0 blur-md opacity-50 overflow-hidden pointer-events-none">
          <div className="h-full overflow-y-auto px-6 pb-24">
            <div className="text-2xl font-bold text-white/20 mt-10">Finanças — Bloqueado</div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <UpgradeModal
            isOpen={true}
            onClose={() => { window.history.back(); }}
            feature="Análise Financeira é um recurso Pro"
            requiredPlan="pro"
            onUpgrade={() => {
              console.log("Upgrade to Pro or Max plan");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 pb-24">
      <PageHeader icon="💲" iconBg="#22c55e" title="Finanças" subtitle="Controle suas receitas e despesas"
        tabs={[{ id: "finance", label: "Finanças" }, { id: "recurring", label: "Recorrentes" }, { id: "budget", label: "Orçamento" }, { id: "analysis", label: "Análise" }]}
        activeTab={tab} onTabChange={setTab} />

      <StatCards cards={[
        { icon: "📈", label: "Receitas", value: formatBRL(income), color: "#22c55e" },
        { icon: "📉", label: "Despesas", value: formatBRL(expenses), color: "#ef4444" },
        { icon: "💰", label: "Saldo", value: formatBRL(balance), color: balance >= 0 ? "#3b82f6" : "#ef4444" },
        { icon: "🔄", label: "Transações", value: transactions.length, color: "#6b7280" },
      ]} />

      {/* ═══ FINANCE TAB ═══ */}
      {tab === "finance" && (
        <>
          <div className="mt-4 flex items-center gap-2">
            {(["all", "receita", "despesa"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"}`}>
                {f === "all" ? "Todos" : f === "receita" ? "📈 Receitas" : "📉 Despesas"}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Transações</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]">{displayed.length}</span>
              </div>
              {displayed.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/30">Nenhuma transação. Use o + para adicionar.</div>
              ) : (
                <div className="max-h-[400px] space-y-2 overflow-y-auto">
                  {displayed.map((t) => (
                    <div key={t.id} className="group flex items-center gap-3 rounded-lg border border-white/6 bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${t.type === "receita" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
                        {t.type === "receita" ? "📈" : "📉"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <span>{t.category}</span>
                          <span>📅 {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${t.type === "receita" ? "text-emerald-400" : "text-red-400"}`}>
                        {t.type === "receita" ? "+" : "-"}{formatBRL(t.amount)}
                      </span>
                      <button onClick={() => handleDelete(t.id)}
                        className="rounded p-1 text-xs text-white/20 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100">🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 text-sm font-semibold">Resumo Mensal</div>
              <div className="flex items-end gap-1" style={{ height: 120 }}>
                {monthLabels.map((label, i) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-0.5">
                    <div className="flex w-full gap-0.5" style={{ height: 100, alignItems: "flex-end" }}>
                      <div className="flex-1 rounded-t bg-emerald-500/40" style={{ height: `${(monthIncome[i] / maxBar) * 100}%`, minHeight: 2 }} />
                      <div className="flex-1 rounded-t bg-red-500/40" style={{ height: `${(monthExpense[i] / maxBar) * 100}%`, minHeight: 2 }} />
                    </div>
                    <span className="text-[9px] text-white/30">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-4 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-emerald-500/60" />Receitas</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-500/60" />Despesas</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══ RECURRING TAB ═══ */}
      {tab === "recurring" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/8 px-4 py-3">
            <span className="text-lg">🔄</span>
            <div>
              <div className="text-sm font-medium">Transações Recorrentes</div>
              <div className="text-xs text-white/50">Configure receitas e despesas que se repetem mensalmente</div>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
            <div className="text-4xl mb-4">🔄</div>
            <div className="text-sm font-medium text-white/60 mb-2">Transações Recorrentes</div>
            <div className="text-xs text-white/30 max-w-sm mx-auto mb-6">
              Em breve você poderá configurar assinaturas, salários e contas fixas que se repetem automaticamente a cada mês.
            </div>
            <button onClick={() => setTab("finance")} className="rounded-lg bg-white/10 px-4 py-2 text-xs text-white/60 hover:bg-white/15">
              ← Voltar para Finanças
            </button>
          </div>
        </div>
      )}

      {/* ═══ BUDGET TAB ═══ */}
      {tab === "budget" && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/8 px-4 py-3">
            <span className="text-lg">🎯</span>
            <div>
              <div className="text-sm font-medium">Orçamento Mensal</div>
              <div className="text-xs text-white/50">Defina limites de gastos por categoria</div>
            </div>
          </div>

          {/* Category spending overview as a budget tracker */}
          {categoryBreakdown.length === 0 ? (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] py-16 text-center">
              <div className="text-4xl mb-4">💰</div>
              <div className="text-sm text-white/40">Adicione despesas para acompanhar o orçamento</div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Gastos por Categoria</div>
              <div className="space-y-3">
                {categoryBreakdown.map(([cat, amount]) => {
                  const pct = Math.round((amount / maxCat) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white/70">{cat}</span>
                        <span className="text-xs text-red-400">{formatBRL(amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full bg-red-500/50 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-white/6 flex justify-between">
                <span className="text-xs text-white/40">Total Despesas</span>
                <span className="text-sm font-semibold text-red-400">{formatBRL(expenses)}</span>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-white/8 bg-white/[0.03] py-12 text-center">
            <div className="text-xs text-white/30 max-w-sm mx-auto">
              Em breve: defina limites de orçamento por categoria e receba alertas quando estiver próximo do limite.
            </div>
          </div>
        </div>
      )}

      {/* ═══ ANALYSIS TAB ═══ */}
      {tab === "analysis" && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Monthly chart */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Receitas vs Despesas — 6 Meses</div>
              <div className="flex items-end gap-2" style={{ height: 140 }}>
                {monthLabels.map((label, i) => (
                  <div key={label} className="flex flex-1 flex-col items-center gap-0.5">
                    <div className="flex w-full gap-1" style={{ height: 110, alignItems: "flex-end" }}>
                      <div className="flex-1 rounded-t bg-emerald-500/50" style={{ height: `${(monthIncome[i] / maxBar) * 100}%`, minHeight: 2 }} />
                      <div className="flex-1 rounded-t bg-red-500/50" style={{ height: `${(monthExpense[i] / maxBar) * 100}%`, minHeight: 2 }} />
                    </div>
                    <span className="text-[9px] text-white/30">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-center gap-4 text-[10px] text-white/40">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-emerald-500/60" />Receitas</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded bg-red-500/60" />Despesas</span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Top Categorias (Despesas)</div>
              {categoryBreakdown.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/30">Sem despesas registradas</div>
              ) : (
                <div className="space-y-3">
                  {categoryBreakdown.slice(0, 6).map(([cat, amount]) => {
                    const pct = expenses > 0 ? Math.round((amount / expenses) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs">{cat}</span>
                            <span className="text-[10px] text-white/40">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full bg-orange-500/60" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-red-400 shrink-0">{formatBRL(amount)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary cards */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Resumo</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Total Receitas</span>
                  <span className="text-sm font-semibold text-emerald-400">{formatBRL(income)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Total Despesas</span>
                  <span className="text-sm font-semibold text-red-400">{formatBRL(expenses)}</span>
                </div>
                <div className="border-t border-white/6 pt-2 flex items-center justify-between">
                  <span className="text-xs font-medium">Saldo</span>
                  <span className={`text-sm font-bold ${balance >= 0 ? "text-blue-400" : "text-red-400"}`}>{formatBRL(balance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Taxa de Economia</span>
                  <span className="text-sm font-medium text-purple-400">{income > 0 ? Math.round(((income - expenses) / income) * 100) : 0}%</span>
                </div>
              </div>
            </div>

            {/* Monthly balance trend */}
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <div className="text-sm font-semibold mb-4">Saldo Mensal</div>
              <div className="flex items-end gap-2" style={{ height: 100 }}>
                {monthLabels.map((label, i) => {
                  const bal = monthIncome[i] - monthExpense[i];
                  const maxAbs = Math.max(...monthIncome.map((inc, j) => Math.abs(inc - monthExpense[j])), 1);
                  const height = Math.abs(bal) / maxAbs * 80;
                  return (
                    <div key={label} className="flex flex-1 flex-col items-center gap-1">
                      <span className={`text-[9px] font-medium ${bal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {bal >= 0 ? "+" : ""}{formatBRL(bal)}
                      </span>
                      <div className={`w-full rounded-t ${bal >= 0 ? "bg-emerald-500/40" : "bg-red-500/40"}`} style={{ height: Math.max(height, 4) }} />
                      <span className="text-[9px] text-white/30">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB with dropdown */}
      <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        <button onClick={() => openCreate("receita")} className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-lg hover:bg-emerald-400">📈 Receita</button>
        <button onClick={() => openCreate("despesa")} className="flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-medium text-white shadow-lg hover:bg-red-400">📉 Despesa</button>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Transação">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-white/50">Título *</label>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} autoFocus
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" placeholder="Ex: Salário, Almoço..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Valor (R$) *</label>
              <input type="number" step="0.01" value={fAmount} onChange={(e) => setFAmount(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" placeholder="0,00" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Tipo</label>
              <select value={fType} onChange={(e) => setFType(e.target.value as Transaction["type"])}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                <option value="receita">Receita</option><option value="despesa">Despesa</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-white/50">Categoria</label>
              <select value={fCategory} onChange={(e) => setFCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Data</label>
              <input type="date" value={fDate} onChange={(e) => setFDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs text-white/50 hover:bg-white/5">Cancelar</button>
            <button onClick={handleSave} className={`rounded-lg px-4 py-2 text-xs font-medium text-white ${fType === "receita" ? "bg-emerald-500 hover:bg-emerald-400" : "bg-red-500 hover:bg-red-400"}`}>
              Adicionar {fType === "receita" ? "Receita" : "Despesa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
