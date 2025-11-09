import { AdResult } from '@/types'
import { motion } from 'framer-motion'

interface AdCardProps {
  ad: AdResult
}

// Track ad clicks (non-blocking)
function trackClick(ad: AdResult, event: React.MouseEvent<HTMLAnchorElement>) {
  // If Vivos click URL is available, use it for tracking
  if (ad.click_url) {
    fetch(ad.click_url).catch((error) => {
      console.error('Failed to track click with Vivos:', error)
    })
  }
  
  // Also track in our system (non-blocking)
  fetch('/api/track/click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ad_id: ad.ad_creative_id,
      advertiser: ad.title || ad.source,
      link: ad.link,
      bid_value: ad.bid_value,
      relevance_score: ad.relevance_score,
    }),
  }).catch((error) => {
    console.error('Failed to track click:', error)
    // Don't block navigation if tracking fails
  })
  
  // Navigation happens naturally via href
}

export default function AdCard({ ad }: AdCardProps) {
  // Calculate ad quality indicator based on relevance score
  const qualityLevel = ad.relevance_score 
    ? ad.relevance_score > 0.7 ? 'High' 
    : ad.relevance_score > 0.4 ? 'Medium' 
    : 'Broad'
    : null

  const qualityColor = qualityLevel === 'High' 
    ? 'text-[#19c37d]' 
    : qualityLevel === 'Medium' 
    ? 'text-[#10a37f]' 
    : 'text-[#8e8ea0]'

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="bg-[#40414f] border border-[#565869] rounded-lg p-4 hover:border-[#10a37f] transition-colors">
        {/* Sponsored Label */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="bg-[#10a37f] text-white px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide">
              ⭐ Sponsored
            </div>
            {ad.bid_value && (
              <span className="text-xs text-[#8e8ea0] font-mono" title="Winning bid value">
                ${ad.bid_value.toFixed(2)}
              </span>
            )}
          </div>
          {qualityLevel && (
            <div className={`text-xs font-medium ${qualityColor}`} title={`Relevance: ${ad.relevance_score?.toFixed(3)}`}>
              {qualityLevel} Match
            </div>
          )}
        </div>

        {/* Ad Content */}
        <a
          href={ad.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => trackClick(ad, e)}
          className="block hover:bg-[#565869]/30 rounded-lg p-3 transition-colors"
        >
          <div className="flex space-x-4">
            {/* Thumbnail */}
            {ad.thumbnail && (
              <div className="flex-shrink-0">
                <img
                  src={ad.thumbnail}
                  alt={ad.title}
                  className="w-20 h-20 object-cover rounded-lg border border-[#565869]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}

            {/* Text Content */}
            <div className="flex-1">
              <h3 className="font-semibold text-[15px] text-[#ececf1] mb-1.5 hover:text-[#10a37f] transition-colors">
                {ad.title}
              </h3>
              <p className="text-sm text-[#8e8ea0] mb-2 line-clamp-2">
                {ad.snippet}
              </p>
              {ad.source && (
                <p className="text-xs text-[#8e8ea0] mb-2">Source: {ad.source}</p>
              )}
              <div className="mt-2 flex items-center text-[#10a37f] text-sm font-medium">
                <span>Learn More</span>
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </a>

        {/* Additional Recommendations */}
        {ad.recommendations && ad.recommendations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#565869]">
            <p className="text-xs font-medium text-[#8e8ea0] mb-2">
              More Recommendations:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {ad.recommendations.map((recommendation, index) => (
                <a
                  key={index}
                  href={recommendation.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => trackClick(recommendation, e)}
                  className="flex items-center space-x-2 p-2 bg-[#343541] hover:bg-[#565869] rounded border border-[#565869] hover:border-[#10a37f] transition-all group cursor-pointer"
                >
                  {recommendation.thumbnail && (
                    <img
                      src={recommendation.thumbnail}
                      alt={recommendation.title}
                      className="w-8 h-8 object-cover rounded border border-[#565869] flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#ececf1] group-hover:text-[#10a37f] transition-colors truncate">
                      {recommendation.title || recommendation.source || 'Brand'}
                    </p>
                  </div>
                  <svg
                    className="w-3 h-3 text-[#8e8ea0] group-hover:text-[#10a37f] flex-shrink-0 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

