import { useState } from 'react'
import { getRandomQuote } from '../../lib/quotes'

export default function QuoteBar() {
  const [quote] = useState(getRandomQuote)

  return (
    <div className="border border-bg-border rounded-xl px-5 py-4 bg-bg-card">
      <p className="text-sm italic text-text-muted leading-relaxed">
        "{quote.text}"
      </p>
      <p className="font-mono text-xs text-text-muted mt-2">— {quote.author}</p>
    </div>
  )
}
