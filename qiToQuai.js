const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const url = 'https://rpc.quai.network/cyprus1';
  const body = {
    id: 1,
    jsonrpc: '2.0',
    method: 'quai_qiToQuai',
    params: ['0x3e8', 'latest']
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Qi to Quai conversion data' });
  }
};
