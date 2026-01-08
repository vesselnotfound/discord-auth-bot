const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'https://SEU_APP.vertra.app'; // Ajuste depois

client.once('ready', () => {
  console.log(`Bot ${client.user.tag} online!`);
  // Comando Slash (/auth)
  const command = new SlashCommandBuilder()
    .setName('auth')
    .setDescription('Iniciar autenticação no sistema');
  // Registrar o comando para um servidor específico
  client.application.commands.create(command);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'auth') {
    await interaction.reply({ content: `Clique aqui para autenticar: ${AUTH_SERVER_URL}/login`, ephemeral: true });
  }
});

client.login(process.env.BOT_TOKEN);
