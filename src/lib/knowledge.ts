import type { KnowledgeChunk } from '../types'

/** Bangladesh SME + apparel seasonal knowledge for RAG (embedded in app; Supabase can mirror) */
export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'kb-1',
    category: 'seasonal',
    content: 'Eid-ul-Fitr drives 40-70% spike in panjabi, saree, and kids wear in Bangladesh apparel retail.',
    contentBn:
      'ঈদুল ফিতরে পাঞ্জাবি, শাড়ি ও শিশুদের পোশাকের চাহিদা ৪০-৭০% বৃদ্ধি পায়। ঈদের ২-৩ সপ্তাহ আগে স্টক বাড়ান।',
  },
  {
    id: 'kb-2',
    category: 'seasonal',
    content: 'Durga Puja increases demand for sarees and traditional wear in Oct-Nov.',
    contentBn: 'দুর্গা পূজায় অক্টোবর-নভেম্বরে শাড়ি ও ঐতিহ্যবাহী পোশাকের চাহিদা বাড়ে।',
  },
  {
    id: 'kb-3',
    category: 'weather',
    content: 'Heavy monsoon rain reduces footfall 15-25%; promote indoor-friendly categories online.',
    contentBn: 'ভারী বর্ষায় দোকানে ক্রেতা ১৫-২৫% কমে; অনলাইন ও ছাড়ে ধীর চলাচল পণ্য বিক্রি করুন।',
  },
  {
    id: 'kb-4',
    category: 'inventory',
    content: 'Reorder when days-of-cover falls below 14 days before major festivals.',
    contentBn: 'বড় উৎসবের আগে স্টক ১৪ দিনের নিচে গেলে অর্ডার দিন।',
  },
  {
    id: 'kb-5',
    category: 'inventory',
    content: 'Slow movers over 90 days tie up cash; discount 10-15% or bundle with fast movers.',
    contentBn: '৯০ দিনে ধীর বিক্রয় হয় এমন পণ্যে নগদ আটকে থাকে; ১০-১৫% ছাড় বা ফাস্ট মুভারের সাথে বান্ডল করুন।',
  },
  {
    id: 'kb-6',
    category: 'winter',
    content: 'Nov-Jan increases hoodie, sweater, and shawl sales in urban Bangladesh.',
    contentBn: 'নভেম্বর-জানুয়ারিতে হুডি, সোয়েটার ও শালের বিক্রয় বাড়ে।',
  },
]

export function retrieveKnowledge(query: string, limit = 3): KnowledgeChunk[] {
  const q = query.toLowerCase()
  const scored = KNOWLEDGE_BASE.map((chunk) => {
    const text = `${chunk.content} ${chunk.contentBn} ${chunk.category}`.toLowerCase()
    let score = 0
    const terms = ['eid', 'ঈদ', 'puja', 'পূজা', 'rain', 'বর্ষা', 'stock', 'স্টক', 'reorder', 'অর্ডার', 'winter', 'শীত']
    for (const t of terms) {
      if (q.includes(t) || text.includes(t)) score += 2
    }
    if (text.includes('festival') || text.includes('উৎসব')) score += 1
    return { chunk, score }
  })
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.chunk)
}

export function retrieveForAlerts(alertTypes: string[]): KnowledgeChunk[] {
  const query = alertTypes.join(' ') + ' eid stock reorder bangladesh apparel'
  return retrieveKnowledge(query, 4)
}
