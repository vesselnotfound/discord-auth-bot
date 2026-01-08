const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// A URL do seu servidor de auth na Vertra (a mesma raiz do REDIRECT_URI)
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'https://SEU_APP.vertra.app';

client.once('ready', () => {
  console.log(`🤖 Bot ${client.user.tag} está online!`);
  // O comando slash /auth precisa ser registrado globalmente ou para um servidor.
  // Para simplificar, o bot vai responder a uma mensagem.
});

// Responde quando alguém envia "!auth" em um canal
client.on('messageCreate', async message => {
  if (message.author.bot) return; // Ignora outros bots
  if (message.content.toLowerCase() === '!auth') {
    // Responde apenas para quem enviou o comando (ephemeral-like)
    try {
      await message.author.send(`🔑 Clique aqui para se autenticar e entrar no servidor: ${AUTH_SERVER_URL}/login`);
      await message.react('✅'); // Reage à mensagem no canal
    } catch (err) {
      console.error('Erro ao enviar DM:', err);
      message.reply('Não consegui te enviar uma mensagem privada. Verifique suas configurações de privacidade.');
    }
  }
});

client.login(process.env.BOT_TOKEN);
