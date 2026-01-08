const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// CONFIGURAÇÃO (Substitua depois!)
const CLIENT_ID = process.env.CLIENT_ID || '1458610656595935493';
const CLIENT_SECRET = process.env.CLIENT_SECRET; // Vem da Vertra Cloud
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://site-virid-nine.vercel.app/';
const BOT_TOKEN = process.env.BOT_TOKEN; // Vem da Vertra Cloud
const DISCORD_API = 'https://discord.com/api/v10';

// Rota de Login
app.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const discordUrl = `${DISCORD_API}/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify%20guilds.join&state=${state}`;
  res.redirect(discordUrl);
});

// Rota de Callback (Onde a mágica acontece)
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Código não recebido.');

  try {
    // 1. Trocar código por Access Token
    const tokenData = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    }).then(r => r.json());

    // 2. Pegar dados do usuário
    const userData = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }).then(r => r.json());

    // 3. SUA LÓGICA AQUI (Exemplo: dar um cargo)
    // Você pode usar o BOT_TOKEN para conceder um cargo ao userData.id
    // Isso é o que torna o bot "útil" para qualquer servidor.

    res.send(`Auth OK! Olá, ${userData.username}. ID: ${userData.id}`);

  } catch (error) {
    console.error('Erro no callback:', error);
    res.status(500).send('Erro interno.');
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
