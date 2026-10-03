'use client'

import { useRef, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import { useI18n } from '@/lib/i18n/client'
import type { CoachMessage } from '@/features/ai/types'

export interface AIChatProps {
  initialMessages?: CoachMessage[]
  placeholder?: string
  className?: string
}

/** Streaming chat surface. Reads the response body directly, token by token. */
export function AIChat({ initialMessages = [], placeholder, className }: AIChatProps) {
  const { t } = useI18n()
  const [messages, setMessages] = useState<CoachMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const question = input.trim()
    if (!question || streaming) return

    const next: CoachMessage[] = [...messages, { role: 'user', content: question }]
    setMessages(next)
    setInput('')
    setStreaming(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })

      if (!response.body) throw new Error('No response')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''

      setMessages([...next, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        reply += decoder.decode(value, { stream: true })
        setMessages([...next, { role: 'assistant', content: reply }])
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
      }
    } catch {
      setMessages([...next, { role: 'assistant', content: t.ai.chatError }])
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t.ai.chatEmpty} {t.ai.disclaimer}
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              {message.content || '…'}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder ?? t.ai.chatPlaceholder}
          disabled={streaming}
          aria-label={t.ai.yourQuestion}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || streaming}
          aria-label={t.ai.send}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
