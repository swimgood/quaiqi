export default async function handler(req, res) {
  const rpcRes = await fetch('https://rpc.quai.network/cyprus1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "quai_qiToQuai",
      params: ["0x1", "latest"]
    })
  });

  const data = await rpcRes.json();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json(data);
}
