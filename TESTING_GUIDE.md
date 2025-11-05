# 🧪 Testing the Conversation-Aware Ad System

## Quick Test Cases

### Test 1: Car Battery Scenario ✅
**Goal**: Verify ads stay relevant to cars even with generic terms

```
Step 1: "My car battery died this morning"
Expected: AI responds with help about car batteries

Step 2: "How much does a new battery cost?"
Expected: AI discusses battery replacement costs

Step 3: "I want something long lasting"
Expected: Ad shows CAR BATTERY (e.g., Interstate, DieHard)
         NOT makeup or other "long lasting" products!

Check Console For:
💬 Conversation keywords: [battery, car, lasting, ...]
🎯 Search query: "battery car lasting ..."
🏆 Winning AD: [Something about car batteries]
```

---

### Test 2: Laptop Shopping ✅
**Goal**: Verify relevance when switching topics gradually

```
Step 1: "I need a new laptop for programming"
Expected: AI suggests laptop options

Step 2: "What about battery life?"
Expected: AI discusses laptop battery life
         Ad: Laptop with good battery (MacBook, ThinkPad, etc.)

Step 3: "Something really durable"
Expected: Ad shows LAPTOPS with durability focus
         NOT phone cases or other durable products!

Check Console For:
💬 Conversation keywords: [laptop, programming, battery, durable, ...]
```

---

### Test 3: Phone Shopping ✅
**Goal**: Verify immediate commercial intent detection

```
Step 1: "I want to buy a new iPhone"
Expected: AI responds about iPhones
         Ad appears immediately (high commercial intent)
         Ad: iPhone deals, Apple Store, etc.

Check Console For:
💬 Commercial intent: 0.6 (high)
🏆 Winning AD: iPhone or smartphone related
```

---

### Test 4: Generic Conversation ✅
**Goal**: Verify ads only appear when appropriate

```
Step 1: "What's the weather like?"
Expected: AI responds
         NO ad (low commercial intent)

Step 2: "Tell me a joke"
Expected: AI tells joke
         NO ad (still low commercial intent)

Step 3: "Another one please"
Expected: AI tells another joke
         Ad appears (3rd message - frequency trigger)
         Ad: Generic or contextual to conversation
```

---

### Test 5: Context Persistence ✅
**Goal**: Verify conversation memory across multiple exchanges

```
Step 1: "I'm planning a road trip"
Expected: AI asks about destination
         Keywords: [road, trip, planning]

Step 2: "California coast"
Expected: AI discusses California
         Keywords: [california, coast, road, trip]

Step 3: "What should I pack?"
Expected: AI suggests packing items
         Keywords: [california, coast, pack, trip]

Step 4: "Need snacks too"
Expected: Ad about TRAVEL SNACKS or ROAD TRIP supplies
         NOT just random snack ads!
         Keywords: [trip, california, snacks, pack]

Check Console For:
💬 Conversation keywords: Should include "trip" or "california"
🎯 Search query: Should reference travel context
```

---

## What to Check in the UI

### Ad Card Display
✅ Yellow/orange gradient background  
✅ "⭐ SPONSORED" badge clearly visible  
✅ Bid value shown: `💰 $X.XX`  
✅ Quality indicator: "High Match" / "Medium Match" / "Broad Match"  
✅ Color coding:
   - Green text = High Match (> 70% relevance)
   - Blue text = Medium Match (40-70% relevance)
   - Gray text = Broad Match (< 40% relevance)

### Ad Content
✅ Title clearly visible and relevant  
✅ Description/snippet shows pricing or details  
✅ Source/advertiser name displayed  
✅ Thumbnail image (if available)  
✅ "Learn More" link with arrow icon  
✅ Disclaimer at bottom

---

## Console Output to Verify

### Conversation Analysis
```
💬 Conversation Context Analysis:
   Current message: "something long lasting"
   Conversation keywords: [battery, car, replace, lasting, died]
   Search query: "battery car replace lasting"
   Commercial intent: 0.2
```

### Ad Fetching
```
🔍 Fetching ads from Google Ads Transparency Center for: "battery car replace lasting"
✅ Found 8 ads from Transparency Center
```

### Ad Scoring
```
📊 AD SCORING RESULTS:
Rank | Score | Relv | Bid    | Advertiser
-----|-------|------|--------|------------------
#1   | 0.789 | 0.800 | $4.50  | Interstate Batteries
#2   | 0.654 | 0.600 | $5.20  | AutoZone
```

### Winner Selection
```
🏆 WINNING AD: Interstate Batteries
   Bid: $4.50 | Relevance: 0.8 | Score: 0.789
```

---

## Common Issues & Solutions

### ❌ Issue: Still seeing makeup ads for "long lasting"
**Cause**: Conversation context window too small  
**Solution**: Increase context window
```typescript
const conversationKeywords = extractConversationKeywords(messages, 7) // was 5
```

---

### ❌ Issue: Ads not appearing at all
**Check**:
1. Is SERPAPI_KEY configured in `.env.local`?
2. Check console for API errors
3. Is commercial intent threshold too high?
4. Try explicitly commercial keywords: "buy", "purchase", "shop"

**Solution**: Lower commercial intent threshold
```typescript
const COMMERCIAL_INTENT_THRESHOLD = 0.2 // was 0.3
```

---

### ❌ Issue: Ads appear too frequently
**Solution**: Increase ad frequency interval
```typescript
const AD_FREQUENCY = 5 // Show every 5 messages instead of 3
```

---

### ❌ Issue: Low relevance scores
**Cause**: Keywords don't match ad content well  
**Solution**: Check console to see what keywords are extracted
- May need to adjust keyword extraction stop words
- May need to increase keyword count in query

---

## Performance Checks

### ✅ Page loads in < 2 seconds
### ✅ Chat responses appear within 2-3 seconds
### ✅ Ads load within 1 second after chat response
### ✅ Smooth animations (no jank)
### ✅ No console errors in browser
### ✅ No 500 errors in server logs

---

## API Rate Limits

### SerpApi Free Tier:
- **100 searches/month**
- Monitor usage at: https://serpapi.com/dashboard

### OpenAI:
- Depends on your plan
- Monitor at: https://platform.openai.com/usage

**Tip**: Use ad caching to reduce API calls!

---

## Success Criteria

✅ **Relevance**: Ads match conversation topic 90%+ of the time  
✅ **Context**: Generic terms like "long lasting" use conversation context  
✅ **Variety**: Different ads shown, not repeating  
✅ **Quality**: High/Medium match ads preferred over Broad match  
✅ **Performance**: Fast load times, smooth UX  
✅ **UI**: Professional look with clear "Sponsored" labels  

---

## Advanced Testing

### Test Conversation Switching
```
1. Talk about cars for 3 messages
2. Switch to laptops
3. Verify ads switch from car-related to laptop-related within 2 messages
```

### Test Edge Cases
```
- Very short messages: "ok", "yes", "thanks"
- All stop words: "the and but or if"
- Mixed topics in one message: "I need a laptop and car battery"
```

### Test Bidding Logic
```
- Check if higher relevance beats higher bid (should, 70% weight)
- Check if very high bid can win with low relevance (possible with 30% weight)
```

---

**Happy Testing!** 🎉

Monitor the console logs to understand exactly how the system makes decisions!

