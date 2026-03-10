// ─────────────────────────────────────────────
// Aurum Automation Service v3
// Real n8n REST API integration
// Calendar + Email + Market data + Reports
// ─────────────────────────────────────────────

// ── Types ──

export interface AutomationConfig {
  n8nBaseUrl: string;
  n8nApiKey: string;
  googleCalendarToken?: string;
  emailProvider?: "n8n-webhook" | "smtp" | "sendgrid" | "resend";
  emailApiKey?: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  tags?: { id: string; name: string }[];
  nodes?: N8nNode[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, unknown>;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt: string | null;
  workflowId: string;
  status: "success" | "error" | "running" | "waiting" | "canceled";
}

export interface AutomationLog {
  id: string;
  action: string;
  status: "success" | "error" | "running";
  message: string;
  timestamp: string;
  duration?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  location?: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

// ── State ──

const CONFIG_KEY = "aurum_automation_config";
const logs: AutomationLog[] = [];

function loadConfig(): AutomationConfig {
  if (typeof window === "undefined") return { n8nBaseUrl: "", n8nApiKey: "" };
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { n8nBaseUrl: "", n8nApiKey: "" };
}

let config: AutomationConfig = loadConfig();

export function setAutomationConfig(c: Partial<AutomationConfig>): void {
  config = { ...config, ...c };
  if (typeof window !== "undefined") {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }
}

export function getAutomationConfig(): AutomationConfig {
  return { ...config };
}

function isN8nConfigured(): boolean {
  return !!(config.n8nBaseUrl && config.n8nApiKey);
}

// ── n8n API helpers ──

async function n8nFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!isN8nConfigured()) {
    throw new Error("n8n não configurado. Adicione URL e API Key no Dashboard.");
  }

  const url = `${config.n8nBaseUrl.replace(/\/+$/, "")}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": config.n8nApiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`n8n API ${response.status}: ${errorText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ── n8n Workflows ──

export async function listWorkflows(): Promise<N8nWorkflow[]> {
  if (!isN8nConfigured()) return [];

  try {
    const data = await n8nFetch<{ data: N8nWorkflow[] }>("/api/v1/workflows");
    addLog("list-workflows", "success", `${data.data.length} workflows encontrados`);
    return data.data;
  } catch (err) {
    addLog("list-workflows", "error", errMsg(err));
    return [];
  }
}

export async function getWorkflow(id: string): Promise<N8nWorkflow | null> {
  try {
    return await n8nFetch<N8nWorkflow>(`/api/v1/workflows/${id}`);
  } catch (err) {
    addLog("get-workflow", "error", errMsg(err));
    return null;
  }
}

export async function createWorkflow(
  name: string,
  nodes: N8nNode[],
  connections: Record<string, unknown> = {},
  active = false,
): Promise<N8nWorkflow | null> {
  const startTime = Date.now();
  try {
    const wf = await n8nFetch<N8nWorkflow>("/api/v1/workflows", {
      method: "POST",
      body: JSON.stringify({ name, nodes, connections, active, settings: {} }),
    });
    addLog("create-workflow", "success", `Workflow "${name}" criado (id: ${wf.id})`, Date.now() - startTime);
    return wf;
  } catch (err) {
    addLog("create-workflow", "error", errMsg(err), Date.now() - startTime);
    return null;
  }
}

export async function updateWorkflow(
  id: string,
  updates: Partial<Pick<N8nWorkflow, "name" | "active" | "nodes"> & { connections: Record<string, unknown> }>,
): Promise<N8nWorkflow | null> {
  try {
    return await n8nFetch<N8nWorkflow>(`/api/v1/workflows/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } catch (err) {
    addLog("update-workflow", "error", errMsg(err));
    return null;
  }
}

export async function deleteWorkflow(id: string): Promise<boolean> {
  try {
    await n8nFetch<unknown>(`/api/v1/workflows/${id}`, { method: "DELETE" });
    addLog("delete-workflow", "success", `Workflow ${id} removido`);
    return true;
  } catch (err) {
    addLog("delete-workflow", "error", errMsg(err));
    return false;
  }
}

export async function activateWorkflow(id: string): Promise<boolean> {
  const result = await updateWorkflow(id, { active: true });
  if (result) addLog("activate-workflow", "success", `Workflow ${id} ativado`);
  return !!result;
}

export async function deactivateWorkflow(id: string): Promise<boolean> {
  const result = await updateWorkflow(id, { active: false });
  if (result) addLog("deactivate-workflow", "success", `Workflow ${id} desativado`);
  return !!result;
}

// ── n8n Executions ──

export async function executeWorkflow(
  id: string,
  data?: Record<string, unknown>,
): Promise<N8nExecution | null> {
  const startTime = Date.now();
  addLog("execute", "running", `Executando workflow ${id}...`);

  try {
    const result = await n8nFetch<{ data: N8nExecution }>(`/api/v1/executions`, {
      method: "POST",
      body: JSON.stringify({ workflowId: id, data }),
    });
    const duration = Date.now() - startTime;
    addLog("execute", "success", `Workflow ${id} executado em ${duration}ms`, duration);
    return result.data;
  } catch (err) {
    const duration = Date.now() - startTime;
    addLog("execute", "error", errMsg(err), duration);
    return null;
  }
}

export async function getExecutions(
  workflowId?: string,
  limit = 20,
): Promise<N8nExecution[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (workflowId) params.set("workflowId", workflowId);
    const data = await n8nFetch<{ data: N8nExecution[] }>(`/api/v1/executions?${params}`);
    return data.data;
  } catch {
    return [];
  }
}

// ── Workflow Templates (pre-built for Aurum) ──

export function getAurumWorkflowTemplates(): { name: string; description: string; build: () => { nodes: N8nNode[]; connections: Record<string, unknown> } }[] {
  return [
    {
      name: "Aurum - Resumo Diário por Email",
      description: "Envia um resumo diário das suas tarefas, hábitos e finanças por email",
      build: () => ({
        nodes: [
          { id: "1", name: "Cron", type: "n8n-nodes-base.cron", position: [250, 300], parameters: { rule: { interval: [{ field: "hours", hour: 8 }] } } },
          { id: "2", name: "HTTP Request", type: "n8n-nodes-base.httpRequest", position: [450, 300], parameters: { url: "http://localhost:3000/api/daily-summary", method: "GET" } },
          { id: "3", name: "Send Email", type: "n8n-nodes-base.emailSend", position: [650, 300], parameters: { subject: "Aurum - Resumo Diário", toEmail: "" } },
        ],
        connections: { Cron: { main: [[{ node: "HTTP Request", type: "main", index: 0 }]] }, "HTTP Request": { main: [[{ node: "Send Email", type: "main", index: 0 }]] } },
      }),
    },
    {
      name: "Aurum - Alerta de Lembrete",
      description: "Monitora lembretes próximos do vencimento e notifica",
      build: () => ({
        nodes: [
          { id: "1", name: "Interval", type: "n8n-nodes-base.interval", position: [250, 300], parameters: { interval: 15, unit: "minutes" } },
          { id: "2", name: "Check Reminders", type: "n8n-nodes-base.httpRequest", position: [450, 300], parameters: { url: "http://localhost:3000/api/reminders/upcoming", method: "GET" } },
          { id: "3", name: "Filter", type: "n8n-nodes-base.filter", position: [650, 300], parameters: {} },
          { id: "4", name: "Notify", type: "n8n-nodes-base.httpRequest", position: [850, 300], parameters: { url: "http://localhost:3000/api/notify", method: "POST" } },
        ],
        connections: { Interval: { main: [[{ node: "Check Reminders", type: "main", index: 0 }]] }, "Check Reminders": { main: [[{ node: "Filter", type: "main", index: 0 }]] }, Filter: { main: [[{ node: "Notify", type: "main", index: 0 }]] } },
      }),
    },
    {
      name: "Aurum - Backup Semanal",
      description: "Exporta todos os dados do Aurum para arquivo JSON semanalmente",
      build: () => ({
        nodes: [
          { id: "1", name: "Cron", type: "n8n-nodes-base.cron", position: [250, 300], parameters: { rule: { interval: [{ field: "weeks", dayOfWeek: 0, hour: 2 }] } } },
          { id: "2", name: "Export Data", type: "n8n-nodes-base.httpRequest", position: [450, 300], parameters: { url: "http://localhost:3000/api/export", method: "GET" } },
          { id: "3", name: "Write File", type: "n8n-nodes-base.writeFile", position: [650, 300], parameters: { fileName: "/tmp/aurum-backup-{{$now.toISODate()}}.json" } },
        ],
        connections: { Cron: { main: [[{ node: "Export Data", type: "main", index: 0 }]] }, "Export Data": { main: [[{ node: "Write File", type: "main", index: 0 }]] } },
      }),
    },
  ];
}

export async function installWorkflowTemplate(templateIndex: number): Promise<N8nWorkflow | null> {
  const templates = getAurumWorkflowTemplates();
  const template = templates[templateIndex];
  if (!template) return null;

  const { nodes, connections } = template.build();
  return createWorkflow(template.name, nodes, connections, false);
}

// ── Email via n8n Webhook ──

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<boolean> {
  if (!isN8nConfigured()) {
    throw new Error("n8n não configurado para envio de emails.");
  }

  try {
    const baseUrl = config.n8nBaseUrl.replace(/\/+$/, "").replace("/api/v1", "");
    await fetch(`${baseUrl}/webhook/aurum-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, body }),
    });
    addLog("email", "success", `Email enviado para ${to}`);
    return true;
  } catch (err) {
    addLog("email", "error", `Falha ao enviar email: ${errMsg(err)}`);
    return false;
  }
}

// ── Calendar ──

export async function createCalendarEvent(event: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
  const newEvent: CalendarEvent = { ...event, id: Date.now().toString(36) };

  if (config.googleCalendarToken) {
    try {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.googleCalendarToken}`,
          },
          body: JSON.stringify({
            summary: event.title,
            description: event.description,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
            location: event.location,
          }),
        },
      );
      if (response.ok) {
        const data = await response.json();
        newEvent.id = data.id;
        addLog("calendar", "success", `Evento criado: ${event.title}`);
      }
    } catch (err) {
      addLog("calendar", "error", `Falha ao criar evento: ${errMsg(err)}`);
    }
  } else {
    addLog("calendar", "success", `Evento salvo localmente: ${event.title}`);
  }

  return newEvent;
}

export async function getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  if (!config.googleCalendarToken) return [];

  try {
    const params = new URLSearchParams({
      timeMin: startDate,
      timeMax: endDate,
      singleEvents: "true",
      orderBy: "startTime",
    });
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${config.googleCalendarToken}` } },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return (data.items ?? []).map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: (item.summary as string) ?? "",
      description: (item.description as string) ?? "",
      start: ((item.start as Record<string, string>)?.dateTime) ?? "",
      end: ((item.end as Record<string, string>)?.dateTime) ?? "",
      location: (item.location as string) ?? "",
    }));
  } catch {
    return [];
  }
}

// ── Market Data ──

export async function getMarketData(symbols: string[]): Promise<MarketData[]> {
  const results: MarketData[] = [];

  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=demo`,
      );
      if (response.ok) {
        const data = await response.json();
        const quote = data["Global Quote"];
        if (quote) {
          results.push({
            symbol,
            price: parseFloat(quote["05. price"] ?? "0"),
            change: parseFloat(quote["09. change"] ?? "0"),
            changePercent: parseFloat((quote["10. change percent"] ?? "0").replace("%", "")),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch {
      results.push({
        symbol,
        price: 0,
        change: 0,
        changePercent: 0,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ── Report Generation ──

export async function generateReport(type: "daily" | "weekly" | "monthly"): Promise<string> {
  const now = new Date();
  const workflows = await listWorkflows();
  const executions = await getExecutions(undefined, 50);

  let report = `# Relatório ${type === "daily" ? "Diário" : type === "weekly" ? "Semanal" : "Mensal"}\n`;
  report += `_Gerado em ${now.toLocaleString("pt-BR")}_\n\n`;

  report += `## Workflows n8n\n`;
  report += `- Total: ${workflows.length}\n`;
  report += `- Ativos: ${workflows.filter((w) => w.active).length}\n`;
  report += `- Inativos: ${workflows.filter((w) => !w.active).length}\n\n`;

  if (workflows.length > 0) {
    report += `### Lista de Workflows\n`;
    for (const wf of workflows) {
      report += `- **${wf.name}** (${wf.active ? "ativo" : "inativo"}) — atualizado em ${new Date(wf.updatedAt).toLocaleString("pt-BR")}\n`;
    }
    report += "\n";
  }

  report += `## Execuções Recentes\n`;
  report += `- Total: ${executions.length}\n`;
  report += `- Sucesso: ${executions.filter((e) => e.status === "success").length}\n`;
  report += `- Erros: ${executions.filter((e) => e.status === "error").length}\n\n`;

  report += `## Logs Aurum\n`;
  for (const log of logs.slice(0, 15)) {
    const icon = log.status === "success" ? "✓" : log.status === "error" ? "✗" : "→";
    report += `- ${icon} [${log.action}] ${log.message} (${new Date(log.timestamp).toLocaleString("pt-BR")})\n`;
  }

  return report;
}

// ── Health Check ──

export async function checkN8nHealth(): Promise<{ connected: boolean; version?: string; workflows?: number }> {
  const baseUrl = config.n8nBaseUrl?.replace(/\/+$/, "");
  if (!baseUrl) return { connected: false };

  // Try with API key first (full access)
  if (config.n8nApiKey) {
    try {
      const workflows = await n8nFetch<{ data: unknown[] }>("/api/v1/workflows");
      return { connected: true, workflows: workflows.data.length };
    } catch {
      // Fall through to basic check
    }
  }

  // Try basic health check without API key (n8n has a healthz endpoint)
  try {
    const response = await fetch(`${baseUrl}/healthz`, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      return { connected: true, workflows: 0 };
    }
  } catch {
    // Try the root URL as a last resort
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
      if (response.ok || response.status === 401) {
        // 401 means n8n is running but needs auth — still "connected"
        return { connected: true, workflows: 0 };
      }
    } catch {
      // n8n is not running
    }
  }

  return { connected: false };
}

// ── Logging ──

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function addLog(action: string, status: AutomationLog["status"], message: string, duration?: number): void {
  logs.unshift({
    id: Date.now().toString(36),
    action,
    status,
    message,
    timestamp: new Date().toISOString(),
    duration,
  });
  if (logs.length > 100) logs.length = 100;
}

export function getAutomationLogs(limit = 50): AutomationLog[] {
  return logs.slice(0, limit);
}

// ── Retry helper ──

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}
