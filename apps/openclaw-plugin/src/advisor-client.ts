export class AdvisorClient {
  constructor(private baseUrl: string) {}

  async getStrategy(address?: string): Promise<unknown> {
    const url = address
      ? `${this.baseUrl}/api/strategy?address=${address}`
      : `${this.baseUrl}/api/strategy`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Advisor ${res.status}: ${url}`);
    return res.json();
  }

  async getMarket(): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/api/market`);
    if (!res.ok) throw new Error(`Advisor ${res.status}: /api/market`);
    return res.json();
  }

  async sendMessage(content: string, type: string = "recommendation"): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/api/messages/inbound`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, role: "assistant", content }),
    });
    if (!res.ok) throw new Error(`Advisor ${res.status}: /api/messages/inbound`);
    return res.json();
  }

  async executeTrade(params: {
    pool_id: string;
    action_type: string;
    direction?: string;
    amount?: string;
    token_in?: string;
    token_out?: string;
    confirm?: boolean;
  }): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Advisor ${res.status}: /api/execute`);
    return res.json();
  }

  async getBehavior(): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}/api/behavior`);
    if (!res.ok) throw new Error(`Advisor ${res.status}: /api/behavior`);
    return res.json();
  }

  async getPrices(tokens?: string[]): Promise<unknown> {
    const query = tokens?.length ? `?tokens=${tokens.join(",")}` : "";
    const res = await fetch(`${this.baseUrl}/api/prices${query}`);
    if (!res.ok) throw new Error(`Advisor ${res.status}: /api/prices`);
    return res.json();
  }

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}
