import http from './http'

export const chat = (messages) =>
  http.post('/api/llm/', { order: 'chat', args: { messages } })

export const getPrompt = (type) =>
  http.post('/api/llm/', { order: 'get_prompt', args: { type } })

export const chatStream = async (messages, onChunk) => {
  const response = await fetch('http://localhost:18081/api/llm/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: 'chat_stream', args: { messages } }),
  })

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    if (onChunk) onChunk(chunk)
  }
}
