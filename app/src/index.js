import { Client, GatewayIntentBits, Partials, Events, ShardEvents } from 'discord.js'
import 'dotenv/config'
import { Chat } from './ollama.js'

// ==== env ====
const {
  DISCORD_BOT_TOKEN,
  COMMAND_PREFIX = '!',
  OPENAI_API_KEY,
  ALLOWED_CHANNEL_IDS
} = process.env

if (!DISCORD_BOT_TOKEN) {
  console.error('ERROR: DISCORD_BOT_TOKEN are required.')
  process.exit(1)
}

// ==== clients ====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
})

const AllowedChannels = (ALLOWED_CHANNEL_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
;

// ==== events ====
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return
    if (AllowedChannels.length && !AllowedChannels.includes(message.channel.id)) {
        return
    }
    if (!message.content.startsWith(COMMAND_PREFIX)) return

    const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift()?.toLowerCase();
    switch (cmd) {
        case 'ping':
            await message.channel.send('ピングはポング');
            break;
        case 'chat':
            try {
                await Chat(message, args);
            } catch(err) {
                console.error('message handler error:', err)
                await message.channel.send('エラーが発生しました。少し待ってからもう一度お試しください。')
            }
            break;
        default:
            break;
    }
})

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, logging out...')
    client.destroy()
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('SIGINT received, logging out...')
    client.destroy()
    process.exit(0)
})

// ==== login ====
client.login(DISCORD_BOT_TOKEN)