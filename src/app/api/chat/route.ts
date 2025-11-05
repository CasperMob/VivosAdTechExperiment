import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractKeywords, extractConversationKeywords, buildConversationQuery, calculateCommercialIntent, buildSearchQuery } from '@/utils/keywordExtractor'
import { ChatRequest } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Track message count for ad frequency
let messageCount = 0
const AD_FREQUENCY = 3 // Show ad every N messages
const COMMERCIAL_INTENT_THRESHOLD = 0.3

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, currentMessage } = body

    if (!currentMessage) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Check if OpenAI key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Get AI response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages.map(msg => ({
        role: msg.role === 'ad' ? 'assistant' : msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 500,
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    // Analyze message for ad relevance using CONVERSATION CONTEXT
    messageCount++
    
    // Extract keywords from the entire conversation (last 5 messages)
    const conversationKeywords = extractConversationKeywords(messages, 5)
    
    // Build search query that considers conversation context
    const searchQuery = buildConversationQuery(currentMessage, conversationKeywords)
    
    // Also check commercial intent from current message
    const commercialIntent = calculateCommercialIntent(currentMessage)
    
    console.log(`\n💬 Conversation Context Analysis:`)
    console.log(`   Current message: "${currentMessage}"`)
    console.log(`   Conversation keywords: [${conversationKeywords.join(', ')}]`)
    console.log(`   Search query: "${searchQuery}"`)
    console.log(`   Commercial intent: ${commercialIntent}`)
    console.log('')

    let ad = null

    // Decide whether to show an ad
    const shouldShowAd = 
      messageCount % AD_FREQUENCY === 0 || 
      commercialIntent > COMMERCIAL_INTENT_THRESHOLD

    if (shouldShowAd && conversationKeywords.length > 0) {
      try {
        // Fetch ad from our ads endpoint with conversation-aware keywords
        const adResponse = await fetch(`${request.nextUrl.origin}/api/ads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: searchQuery,
            keywords: conversationKeywords, // Pass conversation keywords for relevance scoring
          }),
        })

        if (adResponse.ok) {
          const adData = await adResponse.json()
          ad = adData.ad
          
          // Store recommendations if available
          if (adData.recommendations && adData.recommendations.length > 1) {
            ad.recommendations = adData.recommendations.slice(1) // Exclude primary ad
          }
          
          // Log bid info
          if (ad && ad.bid_value) {
            console.log(`💰 Ad Selected: ${ad.title}`)
            console.log(`   Bid: $${ad.bid_value} | Relevance: ${ad.relevance_score || 0} | Score: ${ad.combined_score || 0}`)
            if (ad.recommendations) {
              console.log(`   📋 Plus ${ad.recommendations.length} additional recommendations`)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching ad:', error)
        // Continue without ad if there's an error
      }
    }

    return NextResponse.json({
      response: aiResponse,
      ad,
    })
  } catch (error: any) {
    console.error('Error in chat API:', error)
    
    // Handle specific OpenAI errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

