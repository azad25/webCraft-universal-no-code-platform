'use client'

import { m } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
    {
        question: "Do I need coding skills to use WebCraft?",
        answer: "Not at all! WebCraft is built primarily for non-technical users. Our visual drag-and-drop editor allows you to build anything without writing a single line of code. However, if you are a developer, you can inject custom code freely."
    },
    {
        question: "Can I export my code?",
        answer: "Yes, our Enterprise plan allows full code export. You own what you build."
    },
    {
        question: "Is hosting included?",
        answer: "Yes, all plans include secure, high-performance hosting on our global CDN."
    },
    {
        question: "Can I use my own domain?",
        answer: "Absolutely. You can connect any custom domain to your WebCraft projects in just a few clicks."
    },
    {
        question: "What happens if I cancel?",
        answer: "There are no lock-in contracts. You can cancel anytime. Your site will remain active until the end of your billing period."
    }
]

function FaqItem({ item, isOpen, onClick }: { item: typeof faqs[0], isOpen: boolean, onClick: () => void }) {
    return (
        <div className="border border-white/5 rounded-xl bg-white/5 overflow-hidden mb-4">
            <button
                onClick={onClick}
                className="flex items-center justify-between w-full p-6 text-left"
            >
                <span className="text-lg font-medium text-white">{item.question}</span>
                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            <m.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0 }}
                className="overflow-hidden"
            >
                <div className="p-6 pt-0 text-slate-400 leading-relaxed">
                    {item.answer}
                </div>
            </m.div>
        </div>
    )
}

export function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    return (
        <section className="py-24 bg-[#0a0f1e]">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-400">Everything you need to know about the product and billing.</p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FaqItem
                            key={index}
                            item={faq}
                            isOpen={openIndex === index}
                            onClick={() => setOpenIndex(index === openIndex ? null : index)}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}
