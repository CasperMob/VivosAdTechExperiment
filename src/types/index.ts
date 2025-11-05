export interface Message {
  role: 'user' | 'assistant' | 'ad'
  content: string
  timestamp: Date
  ad?: AdResult
}

export interface AdResult {
  title: string
  link: string
  snippet: string
  thumbnail?: string
  source?: string
  bid_value?: number
  relevance_score?: number
  combined_score?: number
  matching_keywords?: number
  format?: string
  ad_creative_id?: string
  recommendations?: AdResult[] // Additional ad recommendations
}

export interface ChatRequest {
  messages: Message[]
  currentMessage: string
}

export interface ChatResponse {
  response: string
  ad?: AdResult
}

