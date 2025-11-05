/**
 * Extract relevant keywords from user message for ad targeting
 * Uses simple NLP techniques: remove stop words, identify key terms
 */

const stopWords = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
  'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will',
  'just', 'don', 'should', 'now', 'want', 'need', 'looking', 'get', 'help',
])

// Keywords that indicate shopping/purchase intent
const commercialIntentKeywords = new Set([
  'buy', 'purchase', 'shop', 'order', 'price', 'cost', 'deal', 'discount',
  'sale', 'cheap', 'best', 'review', 'recommend', 'store', 'online',
])

export function extractKeywords(text: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ')
  
  // Split into words
  const words = cleaned.split(/\s+/).filter(word => word.length > 2)
  
  // Filter out stop words
  const keywords = words.filter(word => !stopWords.has(word))
  
  // Identify phrases (bigrams) for better context
  const phrases: string[] = []
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      phrases.push(`${words[i]} ${words[i + 1]}`)
    }
  }
  
  return [...new Set([...keywords, ...phrases])]
}

/**
 * Extract keywords from conversation history with recency weighting
 * More recent messages have higher weight
 */
export function extractConversationKeywords(messages: Array<{role: string, content: string}>, maxMessages = 5): string[] {
  // Take last N messages (excluding system messages)
  const recentMessages = messages
    .filter(msg => msg.role === 'user' || msg.role === 'assistant')
    .slice(-maxMessages)
  
  if (recentMessages.length === 0) return []
  
  // Count keyword frequency with recency weighting
  const keywordScores = new Map<string, number>()
  
  recentMessages.forEach((msg, index) => {
    const keywords = extractKeywords(msg.content)
    // More recent messages get higher weight (exponential)
    const weight = Math.pow(2, index)
    
    keywords.forEach(keyword => {
      const currentScore = keywordScores.get(keyword) || 0
      keywordScores.set(keyword, currentScore + weight)
    })
  })
  
  // Sort by score and take top keywords
  const sortedKeywords = Array.from(keywordScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword)
  
  // Return top 5-7 keywords
  return sortedKeywords.slice(0, 7)
}

/**
 * Build a search query from conversation context
 * Combines current message with conversation history
 */
export function buildConversationQuery(currentMessage: string, conversationKeywords: string[]): string {
  const currentKeywords = extractKeywords(currentMessage)
  
  // Combine current message keywords with conversation context
  // Prioritize conversation context (first 3-4 keywords) then current message
  const combined = [
    ...conversationKeywords.slice(0, 4),
    ...currentKeywords.slice(0, 2)
  ]
  
  // Remove duplicates while preserving order
  const unique = [...new Set(combined)]
  
  return unique.slice(0, 5).join(' ')
}

export function calculateCommercialIntent(text: string): number {
  const words = text.toLowerCase().split(/\s+/)
  let score = 0
  
  words.forEach(word => {
    if (commercialIntentKeywords.has(word)) {
      score += 0.2
    }
  })
  
  // Check for product-related patterns
  if (/\b(laptop|phone|shoes|camera|headphone|watch|tv|book|game|computer)\b/i.test(text)) {
    score += 0.3
  }
  
  return Math.min(score, 1.0)
}

export function buildSearchQuery(keywords: string[]): string {
  // Take top 3-5 most relevant keywords
  const topKeywords = keywords.slice(0, 5)
  return topKeywords.join(' ')
}

