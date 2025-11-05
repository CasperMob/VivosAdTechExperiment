import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { AdResult } from '@/types'
import { adCache } from '@/utils/adCache'

const SERPAPI_KEY = process.env.SERPAPI_KEY || '5a39ccd8904d085c80caea4ef69876752c4ed03f4719fb97b548e64d7d90bc4d'

interface ScoredAd extends AdResult {
  bid_value: number
  relevance_score: number
  combined_score: number
  matching_keywords: number
}

/**
 * Score and rank ads by contextual relevance + bid value
 * Scoring formula: 70% relevance + 30% bid value (normalized)
 * 
 * Set RANK_BY_HIGHEST_BID to true to rank by bid only (highest bid wins)
 */
const RANK_BY_HIGHEST_BID = false // Set to true to rank by highest bid only

function scoreAds(ads: AdResult[], keywords: string[]): ScoredAd[] {
  if (!keywords.length) {
    keywords = ['shopping']
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
    // OR use bid only if RANK_BY_HIGHEST_BID is true
    const score = RANK_BY_HIGHEST_BID 
      ? bidNormalized // Pure bid ranking
      : (0.7 * relevance) + (0.3 * bidNormalized) // Combined ranking

    return {
      ...ad,
      relevance_score: Math.round(relevance * 1000) / 1000,
      combined_score: Math.round(score * 1000) / 1000,
      matching_keywords: matches,
      bid_value: ad.bid_value || 0,
    }
  })

  // Sort by combined score (highest first)
  // If RANK_BY_HIGHEST_BID is true, this sorts by bid value
  scoredAds.sort((a, b) => b.combined_score - a.combined_score)

  return scoredAds
}

/**
 * Fetch ads from Google Ads Transparency Center
 * This API provides ACTUAL ads with real advertiser data
 */
async function fetchTransparencyAds(query: string, keywords: string[]): Promise<ScoredAd[]> {
  try {
    console.log(`\n🔍 Fetching ads from Google Ads Transparency Center for: "${query}"`)
    
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_ads_transparency_center',
        q: query,
        api_key: SERPAPI_KEY,
      },
      timeout: 10000,
    })

    const data = response.data
    const rawAds = data.ad_creatives || []

    if (!rawAds.length) {
      console.log('⚠️  No ads found in Transparency Center')
      return []
    }

    console.log(`✅ Found ${rawAds.length} ads from Transparency Center`)

    // Process ads and assign random bid values for RTB simulation
    const processedAds: AdResult[] = rawAds.slice(0, 8).map((ad: any) => {
      // Generate realistic bid value based on ad quality
      const hasImage = !!ad.image
      const baseBid = Math.random() * 5 + 0.5 // $0.50 - $5.50
      const imageBidBoost = hasImage ? Math.random() * 3 : 0 // Up to $3 extra for image ads
      const bidValue = Math.round((baseBid + imageBidBoost) * 100) / 100

      return {
        title: ad.advertiser || 'Sponsored Ad',
        link: ad.link || '#',
        snippet: ad.format === 'text' 
          ? 'Click to view this sponsored advertisement' 
          : `${ad.format.charAt(0).toUpperCase() + ad.format.slice(1)} advertisement`,
        thumbnail: ad.image,
        source: ad.advertiser || 'Sponsored',
        bid_value: bidValue,
        format: ad.format,
        ad_creative_id: ad.ad_creative_id,
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
    console.log(`⚠️  Transparency Center failed: ${error.message}`)
    return []
  }
}

/**
 * Fetch shopping ads as fallback
 */
async function fetchShoppingAds(query: string, keywords: string[]): Promise<ScoredAd[]> {
  try {
    console.log(`\n🛒 Fetching shopping ads for: "${query}"`)
    
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: SERPAPI_KEY,
        engine: 'google_shopping',
        num: 10,
      },
      timeout: 10000,
    })

    const data = response.data
    const shoppingResults = data.shopping_results || []

    if (!shoppingResults.length) {
      console.log('⚠️  No shopping results found')
      return []
    }

    console.log(`✅ Found ${shoppingResults.length} shopping results`)

    // Process shopping results as ads
    const processedAds: AdResult[] = shoppingResults.slice(0, 8).map((product: any) => {
      // Calculate bid based on price and rating
      const price = parseFloat(product.extracted_price || product.price?.replace(/[^0-9.]/g, '') || '0')
      const rating = parseFloat(product.rating || '0')
      const baseBid = Math.min(price * 0.05, 10) // 5% of price, max $10
      const ratingBoost = rating > 4 ? 2 : rating > 3 ? 1 : 0
      const bidValue = Math.round((baseBid + ratingBoost + Math.random() * 2) * 100) / 100

      return {
        title: product.title || 'Product',
        link: product.link || product.product_link || '#',
        snippet: `${product.price || ''} ${product.rating ? `⭐ ${product.rating}/5` : ''} - ${product.source || 'Shop now'}`.trim(),
        thumbnail: product.thumbnail,
        source: product.source || 'Shopping',
        bid_value: Math.max(0.5, bidValue),
      }
    })

    return scoreAds(processedAds, keywords)
  } catch (error: any) {
    console.log(`⚠️  Shopping API failed: ${error.message}`)
    return []
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

    console.log(`\n${'='.repeat(80)}`)
    console.log(`🎯 AD REQUEST: "${query}"`)
    console.log(`📝 Keywords: [${keywords.join(', ')}]`)
    console.log('='.repeat(80))

    // Check cache first
    const cachedAd = adCache.get(query)
    if (cachedAd && !adCache.wasRecentlyShown(cachedAd.title)) {
      console.log('✅ Returning cached ad')
      adCache.markAsShown(cachedAd.title)
      return NextResponse.json({ ad: cachedAd })
    }

    let scoredAds: ScoredAd[] = []

    // Strategy 1: Try Google Ads Transparency Center (REAL ADS with bids)
    scoredAds = await fetchTransparencyAds(query, keywords)

    // Strategy 2: Fallback to Shopping API
    if (scoredAds.length === 0) {
      scoredAds = await fetchShoppingAds(query, keywords)
    }

    // Strategy 3: Last resort - regular search
    if (scoredAds.length === 0) {
      console.log('\n⚠️  All ad sources failed, using fallback search')
      try {
        const response = await axios.get('https://serpapi.com/search', {
          params: {
            q: query,
            api_key: SERPAPI_KEY,
            engine: 'google',
            num: 5,
          },
        })

        const searchData = response.data
        
        if (searchData.shopping_results?.length > 0) {
          const product = searchData.shopping_results[0]
          scoredAds = [{
            title: product.title || 'Featured Product',
            link: product.link || '#',
            snippet: `${product.price || ''} - Shop now`,
            thumbnail: product.thumbnail,
            source: product.source || 'Recommended',
            bid_value: 1.0,
            relevance_score: 0.5,
            combined_score: 0.5,
            matching_keywords: 0,
          }]
        }
      } catch (error) {
        console.log('❌ All ad fetching strategies failed')
      }
    }

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
      ad: winningAd, // Primary ad (for backward compatibility)
      recommendations: topAds, // All recommendations
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

