import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for click tracking (in production, use a database)
interface ClickEvent {
  ad_id?: string
  advertiser: string
  link: string
  bid_value?: number
  relevance_score?: number
  timestamp: string
  session_id?: string
}

// Simple in-memory storage (use a database in production)
const clickEvents: ClickEvent[] = []
const maxEvents = 1000 // Limit to prevent memory issues

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ad_id, advertiser, link, bid_value, relevance_score } = body

    if (!link || !advertiser) {
      return NextResponse.json(
        { error: 'Link and advertiser are required' },
        { status: 400 }
      )
    }

    // Create click event
    const clickEvent: ClickEvent = {
      ad_id: ad_id || undefined,
      advertiser,
      link,
      bid_value,
      relevance_score,
      timestamp: new Date().toISOString(),
      session_id: request.headers.get('x-session-id') || undefined,
    }

    // Store click event
    clickEvents.push(clickEvent)

    // Keep only last N events
    if (clickEvents.length > maxEvents) {
      clickEvents.shift()
    }

    console.log(`\n🖱️  CLICK TRACKED:`)
    console.log(`   Advertiser: ${advertiser}`)
    console.log(`   Link: ${link}`)
    console.log(`   Bid: ${bid_value ? `$${bid_value.toFixed(2)}` : 'N/A'}`)
    console.log(`   Relevance: ${relevance_score ? relevance_score.toFixed(3) : 'N/A'}`)
    console.log('')

    return NextResponse.json({ 
      status: 'success',
      message: 'Click tracked successfully',
    })
  } catch (error) {
    console.error('Error tracking click:', error)
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve click analytics
export async function GET(request: NextRequest) {
  try {
    const totalClicks = clickEvents.length
    
    // Calculate CTR (Click-Through Rate) if we had impression data
    // For now, just return click data
    const clicksByAdvertiser = clickEvents.reduce((acc, event) => {
      acc[event.advertiser] = (acc[event.advertiser] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      total_clicks: totalClicks,
      clicks_by_advertiser: clicksByAdvertiser,
      recent_clicks: clickEvents.slice(-20), // Last 20 clicks
    })
  } catch (error) {
    console.error('Error retrieving analytics:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics' },
      { status: 500 }
    )
  }
}

