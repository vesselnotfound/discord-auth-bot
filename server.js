// ====================
// 1. IMPORTAÇÕES
// ====================
const express = require('express');
const fetch = require('node-fetch'); // Para fazer requisições HTTP
const app = express();
const PORT = process.env.PORT || 3000; // A Vertra define a porta

// ====================
// 2. CONFIGURAÇÕES (Vindas das Variáveis de Ambiente da VERTRA)
// ====================
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const REDIRECT_URI = process.env.REDIRECT_URI; // Ex: https://meu-bot.vertra.app/callback
const GUILD_ID = process.env.GUILD_ID; // ID DO SEU SERVIDOR DISCORD
const ROLE_ID = process.env.ROLE_ID; // ID DO CARGO A SER CONCEDIDO

const DISCORD_API = 'https://discord.com/api/v10';

// ====================
// 3. ROTAS DO SERVIDOR WEB
// ====================

// Rota de Saúde (Para testar se está online)
app.get('/', (req, res) => {
  res.send('✅ Servidor de autenticação está online. Use o comando /auth no Discord.');
});

// Rota 1: /login - Redireciona para o login do Discord
app.get('/login', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const discordAuthUrl = `${DISCORD_API}/oauth2/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20guilds.join` + // Pedimos permissão para IDENTIFICAR e ADICIONAR AO SERVIDOR
    `&state=${state}`;
  res.redirect(discordAuthUrl);
});

// Rota 2: /callback - ONDE A MÁGICA ACONTECE (Login + Servidor + Cargo)
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('<h1>Erro</h1><p>Código não recebido.</p>');
  }

  try {
    console.log('🔑 Iniciando troca de código por token...');

    // PASSO 1: Trocar o "código" pelo "token de acesso" do usuário
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(`Discord API Token Error: ${tokenData.error}`);

    const accessToken = tokenData.access_token;
    console.log('✅ Token de acesso obtido.');

    // PASSO 2: Usar o token para pegar os dados do usuário
    const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const userData = await userResponse.json();
    if (!userResponse.ok) throw new Error('Falha ao obter dados do usuário.');

    console.log(`👤 Usuário autenticado: ${userData.username} (ID: ${userData.id})`);

    // ==================== [PARTE NOVA - LÓGICA DO SERVIDOR/CARGO] ====================
    // PASSO 3: ADICIONAR O USUÁRIO AO SERVIDOR (GUILD) ESPECIFICADO
    console.log(`🔄 Adicionando usuário ao servidor (Guild ID: ${GUILD_ID})...`);
    const addToGuildResponse = await fetch(`${DISCORD_API}/guilds/${GUILD_ID}/members/${userData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }) // Token do usuário para autorizar a entrada
    });

    if (!addToGuildResponse.ok && addToGuildResponse.status !== 409) {
      // Código 409 significa que o usuário já está no servidor, o que é OK.
      const errorText = await addToGuildResponse.text();
      throw new Error(`Falha ao adicionar ao servidor: ${addToGuildResponse.status} - ${errorText}`);
    }
    console.log('✅ Usuário adicionado (ou já estava) no servidor.');

    // PASSO 4: CONCEDER O CARGO ESPECÍFICO AO USUÁRIO
    console.log(`🎖️  Concedendo cargo (Role ID: ${ROLE_ID})...`);
    const addRoleResponse = await fetch(`${DISCORD_API}/guilds/${GUILD_ID}/members/${userData.id}/roles/${ROLE_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!addRoleResponse.ok) {
      const errorText = await addRoleResponse.text();
      console.warn(`⚠️  Não foi possível conceder cargo: ${addRoleResponse.status} - ${errorText}`);
      // Não interrompe o fluxo, apenas avisa no log.
    } else {
      console.log('✅ Cargo concedido com sucesso!');
    }
    // ==================== [FIM DA PARTE NOVA] ====================

    // PASSO 5: Resposta final de sucesso para o usuário
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Autenticado!</title><meta charset="UTF-8"></head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #4CAF50;">✅ Autenticação Bem-Sucedida!</h1>
        <p>Olá, <strong>${userData.global_name || userData.username}</strong>!</p>
        <p>Você foi <strong>adicionado ao servidor</strong> e recebeu seu <strong>cargo de acesso</strong>.</p>
        <p>Volte para o Discord e aproveite!</p>
        <hr>
        <p><small>ID do Discord: ${userData.id}</small></p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('🔥 ERRO CRÍTICO NO CALLBACK:', error);
    res.status(500).send(`
      <h1>❌ Erro no Processo</h1>
      <p>Ocorreu um erro durante a autenticação. Contate o administrador.</p>
      <p><small>Detalhes: ${error.message}</small></p>
    `);
  }
});

// ====================
// 4. INICIAR O SERVIDOR
// ====================
app.listen(PORT, () => {
  console.log(`🚀 Servidor de autenticação rodando na porta ${PORT}`);
  console.log(`🔗 Ponto de entrada: ${REDIRECT_URI?.replace('/callback', '') || 'Configure REDIRECT_URI'}`);
});
