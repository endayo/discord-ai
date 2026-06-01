import fs from 'node:fs/promises'
import path from 'node:path'

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://host.docker.internal:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma3:12b'

// 性格を読み込む　path
const PERSONALITY_PATH =
  process.env.PERSONALITY_PATH ||
  path.resolve('prompts/personality.txt')

// 性格を読み込み
async function loadPersonality() {
  try {
    return await fs.readFile(PERSONALITY_PATH, 'utf-8')
  } catch (err) {
    console.error('personality file read error:', err)

    return 'あなたは日本語で簡潔に答えるDiscord Botです。'
  }
}

// 画像をbase64に変換
async function imageUrlToBase64(url) {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Image fetch error: ${res.status}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  return buffer.toString('base64')
}

// 画像データを取得
function getImageAttachments(message) {
  return [...message.attachments.values()].filter((attachment) => {
    return attachment.contentType?.startsWith('image/')
  })
}

export async function Chat(message, args) {
  const prompt = args.join(' ').trim()

  const images = getImageAttachments(message)

  if (!prompt && images.length === 0) {
    await message.channel.send('質問内容、または画像を添付してください。例: `!chat この画像を説明して`')
    return
  }

  await message.channel.sendTyping()

  const imageBase64List = []

  for (const image of images) {
    imageBase64List.push(await imageUrlToBase64(image.url))
  }

  const userMessage = {
    role: 'user',
    content: prompt || 'この画像を説明してください。'
  }

  if (imageBase64List.length > 0) {
    userMessage.images = imageBase64List
  }

  const personality = await loadPersonality()

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
          content: personality
        },
        userMessage
      ],
      stream: false
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Ollama API error: ${res.status} ${errorText}`)
  }

  const data = await res.json()
  const reply = data.message?.content || '返答を生成できませんでした。'

  const chunks = reply.match(/[\s\S]{1,1900}/g) || []

  for (const chunk of chunks) {
    await message.channel.send(chunk)
  }
}