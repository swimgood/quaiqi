export default async function handler(req, res) {
  try {
    const rpcUrl = "https://rpc.quai.network/cyprus1";
    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: "quai_qiToQuai",
      params: ["0x3e8", "latest"]
    };

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch conversion rate" });
  }
}