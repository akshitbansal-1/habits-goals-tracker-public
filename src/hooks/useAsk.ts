import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { askQuestion } from '../lib/api'
import type { AskResponse, AskProvider } from '../types'

export interface AskHistoryEntry {
  question: string
  response: AskResponse
  provider: AskProvider
  timestamp: Date
}

export function useAsk() {
  const [history, setHistory] = useState<AskHistoryEntry[]>([])

  const mutation = useMutation({
    mutationFn: ({ question, provider }: { question: string; provider: AskProvider }) =>
      askQuestion(question, provider),
    onSuccess: (data, { question, provider }) => {
      setHistory((prev) => [{ question, response: data, provider, timestamp: new Date() }, ...prev])
    },
  })

  return {
    ask: (question: string, provider: AskProvider) => mutation.mutate({ question, provider }),
    isPending: mutation.isPending,
    error: mutation.error,
    latestResponse: mutation.data,
    history,
  }
}
