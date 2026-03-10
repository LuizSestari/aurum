// ─────────────────────────────────────────────
// Aurum Data Store
// Central localStorage-based data persistence
// for Tasks, Habits, Projects, Reminders, Finance, Knowledge
// ─────────────────────────────────────────────

// ── Types ──

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "alta" | "média" | "baixa";
  status: "pendente" | "em_andamento" | "concluída";
  tags: string[];
  dueDate: string | null; // ISO
  createdAt: string;
  completedAt: string | null;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  frequency: "diário" | "semanal" | "mensal";
  color: string;
  streak: number;
  bestStreak: number;
  completedDates: string[]; // ISO date strings
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "planejamento" | "ativo" | "em_andamento" | "pausado" | "concluído";
  color: string;
  progress: number; // 0-100
  dueDate: string | null;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dateTime: string; // ISO
  priority: "alta" | "média" | "baixa";
  recurring: "nunca" | "diário" | "semanal" | "mensal";
  done: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "receita" | "despesa";
  category: string;
  date: string; // ISO
  createdAt: string;
}

export interface Notebook {
  id: string;
  title: string;
  area: string;
  content: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AurumData {
  tasks: Task[];
  habits: Habit[];
  projects: Project[];
  reminders: Reminder[];
  transactions: Transaction[];
  notebooks: Notebook[];
}

// ── Storage ──

const STORE_KEY = "aurum_data";

function getDefault(): AurumData {
  return {
    tasks: [],
    habits: [],
    projects: [],
    reminders: [],
    transactions: [],
    notebooks: [],
  };
}

export function loadData(): AurumData {
  if (typeof window === "undefined") return getDefault();
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return getDefault();
    return { ...getDefault(), ...JSON.parse(raw) };
  } catch {
    return getDefault();
  }
}

export function saveData(data: AurumData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  } catch {
    // storage full
  }
}

// ── Helpers ──

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── CRUD for each entity ──

// Tasks
export function addTask(task: Omit<Task, "id" | "createdAt" | "completedAt">): Task {
  const data = loadData();
  const t: Task = { ...task, id: genId(), createdAt: new Date().toISOString(), completedAt: null };
  data.tasks.unshift(t);
  saveData(data);
  return t;
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const data = loadData();
  const idx = data.tasks.findIndex((t) => t.id === id);
  if (idx >= 0) {
    data.tasks[idx] = { ...data.tasks[idx], ...updates };
    if (updates.status === "concluída" && !data.tasks[idx].completedAt) {
      data.tasks[idx].completedAt = new Date().toISOString();
    }
    saveData(data);
  }
}

export function deleteTask(id: string): void {
  const data = loadData();
  data.tasks = data.tasks.filter((t) => t.id !== id);
  saveData(data);
}

// Habits
export function addHabit(habit: Omit<Habit, "id" | "createdAt" | "streak" | "bestStreak" | "completedDates">): Habit {
  const data = loadData();
  const h: Habit = { ...habit, id: genId(), createdAt: new Date().toISOString(), streak: 0, bestStreak: 0, completedDates: [] };
  data.habits.unshift(h);
  saveData(data);
  return h;
}

export function toggleHabitDay(id: string, date: string): void {
  const data = loadData();
  const idx = data.habits.findIndex((h) => h.id === id);
  if (idx >= 0) {
    const h = data.habits[idx];
    if (h.completedDates.includes(date)) {
      h.completedDates = h.completedDates.filter((d) => d !== date);
    } else {
      h.completedDates.push(date);
    }
    // Recalculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      if (h.completedDates.includes(iso)) {
        streak++;
      } else {
        break;
      }
    }
    h.streak = streak;
    if (streak > h.bestStreak) h.bestStreak = streak;
    saveData(data);
  }
}

export function deleteHabit(id: string): void {
  const data = loadData();
  data.habits = data.habits.filter((h) => h.id !== id);
  saveData(data);
}

// Projects
export function addProject(project: Omit<Project, "id" | "createdAt">): Project {
  const data = loadData();
  const p: Project = { ...project, id: genId(), createdAt: new Date().toISOString() };
  data.projects.unshift(p);
  saveData(data);
  return p;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const data = loadData();
  const idx = data.projects.findIndex((p) => p.id === id);
  if (idx >= 0) {
    data.projects[idx] = { ...data.projects[idx], ...updates };
    saveData(data);
  }
}

export function deleteProject(id: string): void {
  const data = loadData();
  data.projects = data.projects.filter((p) => p.id !== id);
  saveData(data);
}

// Reminders
export function addReminder(reminder: Omit<Reminder, "id" | "createdAt" | "done">): Reminder {
  const data = loadData();
  const r: Reminder = { ...reminder, id: genId(), createdAt: new Date().toISOString(), done: false };
  data.reminders.unshift(r);
  saveData(data);
  return r;
}

export function updateReminder(id: string, updates: Partial<Reminder>): void {
  const data = loadData();
  const idx = data.reminders.findIndex((r) => r.id === id);
  if (idx >= 0) {
    data.reminders[idx] = { ...data.reminders[idx], ...updates };
    saveData(data);
  }
}

export function deleteReminder(id: string): void {
  const data = loadData();
  data.reminders = data.reminders.filter((r) => r.id !== id);
  saveData(data);
}

// Transactions
export function addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Transaction {
  const data = loadData();
  const t: Transaction = { ...tx, id: genId(), createdAt: new Date().toISOString() };
  data.transactions.unshift(t);
  saveData(data);
  return t;
}

export function deleteTransaction(id: string): void {
  const data = loadData();
  data.transactions = data.transactions.filter((t) => t.id !== id);
  saveData(data);
}

// Notebooks
export function addNotebook(nb: Omit<Notebook, "id" | "createdAt" | "updatedAt">): Notebook {
  const data = loadData();
  const n: Notebook = { ...nb, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  data.notebooks.unshift(n);
  saveData(data);
  return n;
}

export function updateNotebook(id: string, updates: Partial<Notebook>): void {
  const data = loadData();
  const idx = data.notebooks.findIndex((n) => n.id === id);
  if (idx >= 0) {
    data.notebooks[idx] = { ...data.notebooks[idx], ...updates, updatedAt: new Date().toISOString() };
    saveData(data);
  }
}

export function deleteNotebook(id: string): void {
  const data = loadData();
  data.notebooks = data.notebooks.filter((n) => n.id !== id);
  saveData(data);
}
