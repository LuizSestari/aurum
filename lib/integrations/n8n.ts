export async function executeN8nWorkflow(
  action: string,
  params: any
): Promise<any> {
  const workflows: Record<string, string> = {
    'schedule_meeting': 'webhook-schedule-meeting',
    'send_email': 'webhook-send-email',
    'fetch_market_data': 'webhook-market-data',
  };

  try {
    const response = await fetch(
      `http://localhost:5678/webhook/${workflows[action]}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params ),
      }
    );

    return response.json();
  } catch (error) {
    console.error('n8n error:', error);
    throw error;
  }
}
