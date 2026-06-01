const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:12b'

export async function Chat(message, args) {
  const prompt = args.join(' ').trim()

  if (!prompt) {
    await message.channel.send('質問内容を入力してください。例: `!chat Laravelについて教えて`')
    return
  }

  await message.channel.sendTyping()

  const res = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: 'system',
          content: 'あなたは日本語で簡潔に答えるDiscord Botです。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    })
  })

  if (!res.ok) {
    throw new Error(`Ollama API error: ${res.status}`)
  }

  const data = await res.json()
  const reply = data.message?.content || '返答を生成できませんでした。'

  // Discordは2000文字制限
  const chunks = reply.match(/[\s\S]{1,1900}/g) || []

  for (const chunk of chunks) {
    await message.channel.send(chunk)
  }
}