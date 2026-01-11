'use client'

import { useEffect, useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getFAQs, type FAQ } from '@/lib/faqs'

interface FAQSectionProps {
  communityId: string
}

export function FAQSection({ communityId }: FAQSectionProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFAQs = async () => {
      const data = await getFAQs(communityId)
      setFaqs(data)
      setLoading(false)
    }

    fetchFAQs()
  }, [communityId])

  if (loading || faqs.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <HelpCircle className="w-5 h-5" />
        Ofte stilte spørsmål
      </h3>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 whitespace-pre-wrap">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
