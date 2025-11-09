import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { AdResult } from '@/types'
import { adCache } from '@/utils/adCache'

// Import prisma conditionally to avoid errors if not set up
let prisma: any = null
try {
  const prismaModule = require('@/lib/prisma')
  prisma = prismaModule.prisma
} catch (error) {
  // Prisma not available, continue without tracking
  console.log('Prisma not available - publisher tracking disabled')
}

const VIVOS_API_URL = 'https://vivos-ad-network.vercel.app/api/ads'
const DEFAULT_PUBLISHER_KEY = process.env.VIVOS_PUBLISHER_KEY || 'pub_30b766e0bb88c72a144b7c3c4c998eb5ea7910c9dcd57169d5ecbdfed1624467'

interface ScoredAd extends AdResult {
  bid_value: number
  relevance_score: number
  combined_score: number
  matching_keywords: number
  impression_url?: string
  click_url?: string
}

/**
 * Score and rank ads by contextual relevance + bid value
 * Scoring formula: 70% relevance + 30% bid value (normalized)
 */
function scoreAds(ads: AdResult[], keywords: string[]): ScoredAd[] {
  if (!keywords.length) {
    keywords = ['general']
  }

  const keywordsSet = new Set(keywords.map(k => k.toLowerCase()))

  const scoredAds: ScoredAd[] = ads.map(ad => {
    // Combine ad text for matching
    const adText = [
      ad.title || '',
      ad.snippet || '',
      ad.source || '',
    ].join(' ').toLowerCase()

    // Count matching keywords
    let matches = 0
    keywordsSet.forEach(kw => {
      if (adText.includes(kw)) matches++
    })

    const relevance = matches / keywordsSet.size

    // Normalize bid value (0-1 range, assuming max bid of $10)
    const bidNormalized = Math.min((ad.bid_value || 0) / 10.0, 1.0)

    // Combined score: 70% relevance, 30% bid
    const score = (0.7 * relevance) + (0.3 * bidNormalized)

    return {
      ...ad,
      relevance_score: Math.round(relevance * 1000) / 1000,
      combined_score: Math.round(score * 1000) / 1000,
      matching_keywords: matches,
      bid_value: ad.bid_value || 0,
    }
  })

  // Sort by combined score (highest first)
  scoredAds.sort((a, b) => b.combined_score - a.combined_score)

  return scoredAds
}

/**
 * Fetch ads from Vivos Ad Network
 * This is the ONLY ad source
 */
async function fetchVivosAds(keywords: string[], publisherKey?: string): Promise<ScoredAd[]> {
  try {
    // Join keywords into a single string (space separated)
    const keywordsString = keywords.join(' ')
    
    console.log(`\n🔍 Fetching ads from Vivos Ad Network`)
    console.log(`   Keywords: "${keywordsString}"`)
    console.log(`   Publisher Key: ${publisherKey || DEFAULT_PUBLISHER_KEY}`)
    
    const response = await axios.get(VIVOS_API_URL, {
      params: {
        keywords: keywordsString,
        publisher_key: publisherKey || DEFAULT_PUBLISHER_KEY,
      },
      timeout: 10000,
    })

    const data = response.data
    const ads = data.ads || []

    if (!ads.length) {
      console.log('⚠️  No ads found in Vivos Ad Network')
      return []
    }

    console.log(`✅ Found ${ads.length} ads from Vivos Ad Network`)

    // Transform Vivos API format to our AdResult format
    const processedAds: AdResult[] = ads.map((ad: any) => {
      return {
        title: ad.title || 'Sponsored Ad',
        link: ad.target_url || '#',
        snippet: ad.message || ad.title || 'Click to learn more',
        thumbnail: ad.image_url || undefined,
        source: ad.title || 'Sponsored',
        bid_value: ad.cpc_bid || 0,
        ad_creative_id: ad.id,
        // Store tracking URLs for later use
        impression_url: ad.impression_url,
        click_url: ad.click_url,
      }
    })

    // Score ads by relevance + bid
    const scoredAds = scoreAds(processedAds, keywords)

    // Log scoring results
    console.log('\n📊 AD SCORING RESULTS:')
    console.log('Rank | Score | Relv | Bid    | Advertiser')
    console.log('-----|-------|------|--------|------------------')
    scoredAds.forEach((ad, idx) => {
      console.log(
        `#${idx + 1}   | ${ad.combined_score.toFixed(3)} | ${ad.relevance_score.toFixed(3)} | $${ad.bid_value.toFixed(2)} | ${ad.title}`
      )
    })
    console.log('')

    return scoredAds
  } catch (error: any) {
    console.error(`❌ Vivos Ad Network failed: ${error.message}`)
    return []
  }
}

// Support both GET (publisher API) and POST (chatbot API)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const context = searchParams.get('context') || ''
    const publisherKey = searchParams.get('publisher_key')

    if (!context) {
      return NextResponse.json(
        { error: 'context is required' },
        { status: 400 }
      )
    }

    // If publisher_key is provided, validate and track
    let publisher = null
    if (publisherKey && prisma) {
      try {
        publisher = await prisma.publisher.findUnique({
          where: { apiKey: publisherKey },
        })
      } catch (error) {
        // Prisma not available, continue without tracking
      }
    }

    // Extract keywords from context
    const keywords = context.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)

    // Fetch ads from Vivos Ad Network
    let scoredAds: ScoredAd[] = []
    scoredAds = await fetchVivosAds(keywords, publisherKey || undefined)

    if (scoredAds.length === 0) {
      return NextResponse.json(
        { error: 'No ads found' },
        { status: 404 }
      )
    }

    const topAds = scoredAds.slice(0, 5)
    const winningAd = topAds[0]

    // Track impression - use Vivos tracking URL if available
    if (winningAd.impression_url) {
      // Fire and forget - track impression with Vivos
      fetch(winningAd.impression_url).catch(err => {
        console.error('Failed to track impression with Vivos:', err)
      })
    }
    
    // Also log impression if publisher exists and prisma is available
    if (publisher && prisma) {
      try {
        await prisma.adEvent.create({
          data: {
            publisherId: publisher.id,
            eventType: 'impression',
            adId: winningAd.ad_creative_id || undefined,
            advertiser: winningAd.title,
            bidValue: winningAd.bid_value,
            context: context,
            revenue: 0,
          },
        })
      } catch (error) {
        // Ignore tracking errors
      }
    }

    const recommendations = topAds.slice(1, 5).map(ad => ({
      title: ad.title,
      link: ad.link,
      snippet: ad.snippet,
      thumbnail: ad.thumbnail,
      source: ad.source,
      bid_value: ad.bid_value,
      relevance_score: ad.relevance_score,
      impression_url: ad.impression_url,
      click_url: ad.click_url,
    }))

    return NextResponse.json({
      ad: {
        title: winningAd.title,
        link: winningAd.link,
        snippet: winningAd.snippet,
        thumbnail: winningAd.thumbnail,
        source: winningAd.source,
        bid_value: winningAd.bid_value,
        relevance_score: winningAd.relevance_score,
        combined_score: winningAd.combined_score,
        matching_keywords: winningAd.matching_keywords,
        ad_creative_id: winningAd.ad_creative_id,
        impression_url: winningAd.impression_url,
        click_url: winningAd.click_url,
        recommendations: recommendations,
      },
      recommendations: recommendations,
    })
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query, keywords = [] } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Extract keywords from context if needed
    const contextKeywords = keywords.length > 0 ? keywords : query.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)

    console.log(`\n${'='.repeat(80)}`)
    console.log(`🎯 AD REQUEST: "${query}"`)
    console.log(`📝 Keywords: [${contextKeywords.join(', ')}]`)
    console.log('='.repeat(80))

    // Check cache first
    const cachedAd = adCache.get(query)
    if (cachedAd && !adCache.wasRecentlyShown(cachedAd.title)) {
      console.log('✅ Returning cached ad')
      adCache.markAsShown(cachedAd.title)
      return NextResponse.json({ ad: cachedAd })
    }

    // Fetch ads from Vivos Ad Network
    let scoredAds: ScoredAd[] = []
    scoredAds = await fetchVivosAds(contextKeywords)

    if (scoredAds.length === 0) {
      return NextResponse.json(
        { error: 'No ads found' },
        { status: 404 }
      )
    }

    // Return top 3-5 ads for recommendations
    const topAds = scoredAds.slice(0, 5)
    const winningAd = topAds[0]

    console.log(`\n🏆 WINNING AD: ${winningAd.title}`)
    console.log(`   Bid: $${winningAd.bid_value} | Score: ${winningAd.combined_score} | Relevance: ${winningAd.relevance_score}`)
    console.log(`📋 Also showing ${topAds.length - 1} additional recommendations`)
    console.log('='.repeat(80) + '\n')

    // Cache the winning ad
    adCache.set(query, winningAd)
    adCache.markAsShown(winningAd.title)

    return NextResponse.json({ 
      ad: {
        ...winningAd,
        impression_url: winningAd.impression_url,
        click_url: winningAd.click_url,
      }, // Primary ad (for backward compatibility)
      recommendations: topAds.map(ad => ({
        ...ad,
        impression_url: ad.impression_url,
        click_url: ad.click_url,
      })), // All recommendations
      total_ads: scoredAds.length,
      bid_value: winningAd.bid_value,
    })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}
