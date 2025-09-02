# AptosNFT Gallery — PRD v1.5 (Implementation Complete)

> **Status: ✅ IMPLEMENTED** - MVP gallery with rarity system successfully built and deployed on `gallery-demo` branch. Ready for production deployment to Vercel.

> Goal: Ship a **public** collection gallery for **Retro 80s NFT Collection 2025-01-08-v2-unique** that matches the site's look & feel, scales to 10k supply, and launches with an **MVP rarity index**. No marketplace/listings/sales at MVP.

---

## 0) Canonical Collection Identity (source of truth)

- **Collection Name:** `Retro 80s NFT Collection 2025-01-08-v2-unique`  
  *(contract/sources/retro_nft_da.move:28)*
- **Creator Address:** deterministic shared resource account from `get_shared_collection_address()`  
  *(contract/sources/retro_nft_da.move:117–121; account::create_resource_address & SHARED_COLLECTION_SEED)*
- **Token naming:** `Retro NFT #${tokenId}`  
  *(current metadata API already queries by this pattern)*
- **Indexing:** For **collection-wide** queries, filter by **(creator address + collection name)**. For **single-token** queries, the existing token_name pattern is OK.

---

## 1) Scope

### In
- **Public routes (no wallet required):**
  - Gallery: `/#/gallery`
  - Token detail: `/#/token/:id`
- **Header stats:** `Items = 10,000` (static), `Minted = live` (contract/indexer).
- **Browse:** search, trait filters, sort by *Recently Minted*, *Token ID*, and **Rarity**.
- **Rarity (MVP):** blended score derived from contract probabilities + observed frequencies.
- **Performance:** infinite scroll + virtualization; responsive layout; skeleton states.

### Out
- Prices, listings, sales, floor/volume, unique holders (can come later).
- Any buy/sell flows (marketplace is future work).
- Advanced rarity analytics (trait combinations, rarity distributions).

---

## 2) Information Architecture & Routing

- **Router:** lightweight **hash router** (keep current single-page app; no server rewrites).
- **Routes:**
  - `/#/gallery?q=...&sort=...&traits[Type]=Value&cursor=...`
  - `/#/token/:id`
- **State in URL:** search, sort, filters, cursor (shareable links).
- **App integration:** Keep current mint/generator gating by wallet, but **do not gate gallery/detail**.
- **Fallback:** Invalid routes redirect to `/#/gallery`.

---

## 3) UI & Interaction

### 3.1 Collection Header
- Avatar (site logo), title, short description.
- **Stats:**  
  - `Items`: `10,000`  
  - `Minted`: live from chain/indexer (with loading state)
  - Omit owners/floor/volume at MVP (or show `—` if preferred).

### 3.2 Toolbar (Items tab)
- **Search:** by token name/ID (contains, debounced input) **+ individual words from word combinations**.
- **Sort:**  
  - `Recently Minted` (desc, default)  
  - `Token ID: Low → High`  
  - `Token ID: High → Low`  
  - **`Rarity: High → Low`** (when rarity is computed)
- **View toggle:** Grid (default) / List view option for future.

### 3.3 Filters (left panel / drawer on mobile)
- **Traits:** multi-select within a trait type (OR), combine across types (AND).
- **Enhanced Word Filtering**: Individual words from word combinations are filterable (e.g., filter by "CATS" to see all NFTs containing that word, regardless of other words in the 3-word combination).
- **Clear all** to reset filters.
- **Active filter chips** with individual remove buttons.
- Attributes are guaranteed for all tokens.

### 3.4 Grid
- Card: square image, name (e.g., `#0123`), **rarity badge** (tier + percentile, e.g., "S • 99th").
- Hover: subtle lift + "View Details".
- Click → token detail.
- **Loading states:** skeleton cards during fetch.

### 3.5 Token Detail
- Large image, name/id, minted timestamp, full attributes table, rarity breakdown.
- **Navigation:** Back to gallery (preserve state), Previous/Next token buttons.
- **Sharing:** Copy link button.

### 3.6 States
- **Loading:** skeleton grids and individual skeletons.
- **Empty:** "No items match your filters." with clear filters CTA.
- **Error:** "Couldn't load items. Please try again." with retry button.
- **Offline:** Browser offline detection with appropriate messaging.

### 3.7 Responsive
- **Desktop (≥1280px):** 5–6 cols
- **Laptop (≥1024px):** 4–5 cols  
- **Tablet (≥768px):** 3–4 cols
- **Mobile (<768px):** 2 cols
- Filters collapse to bottom sheet/drawer <1024px.

---

## 4) Data & APIs

> There is **no server-side registry**; query chain/indexer on demand. Reuse the indexer adapter used in `api/nft/metadata.js`. Add filters for **creator + collection name** for collection-wide queries.

### 4.1 Entities

~~~ts
type Attribute = { trait_type: string; value: string };

type Token = {
  tokenId: string;            // "1234"
  name: string;               // "Retro NFT #1234"
  image: string;              // CDN URL or resolved on-chain reference
  mintedAt: string;           // ISO (from on-chain timestamp / tx)
  attributes: Attribute[];    // guaranteed (background_color, shape, word_combination, token_id)
  rarity?: {
    score: number;            // 0..100 normalized
    percentile: number;       // 0..100 (higher = rarer)
    tier: "S"|"A"|"B"|"C"|"D";
    components?: Array<{ trait_type: string; value: string; ic: number; frequency: number }>;
  };
};

type TraitCounts = Record<string, Record<string, number>>;

type CollectionStats = {
  totalSupply: number;        // 10000
  totalMinted: number;        // live count
  lastUpdated: string;        // ISO timestamp
};
~~~

### 4.2 Endpoints (new/updated)

- **`GET /api/nft/collection/list`**  
  **Query:**  
  `q` (string), `sort` (`minted_desc|id_asc|id_desc|rarity_desc`),  
  `traits[<type>]` (repeat), `limit` (default 48), `cursor` (opaque).  
  **Response:** `{ items: Token[]; nextCursor?: string; total?: number }`

- **`GET /api/nft/collection/traits`** (for sidebar aggregation)  
  **Response:** `{ traits: TraitCounts; stats: CollectionStats }`

- **`GET /api/nft/collection/stats`** (lightweight stats endpoint)  
  **Response:** `CollectionStats`

- **`GET /api/nft/metadata/[id]`** (exists; ensure it returns attributes + mintedAt + rarity)

- **`GET /api/nft/rarity/refresh`** (admin/cron trigger)  
  **Response:** `{ status: "updated"|"in_progress"; updatedAt: string }`

### 4.3 Indexer Filters & Queries

- **Current single-token approach (already implemented):**  
  `where: { token_name: { _eq: "Retro NFT #${tokenId}" } }` *(api/nft/metadata.js:58)*

- **Collection-wide filtering (use this for list/traits/rarity):**  
  Filter by **creator address** (shared resource account) **AND** **collection name**:
  - `creator_address = <SHARED_COLLECTION_ADDRESS>`
  - `collection_name = "Retro 80s NFT Collection 2025-01-08-v2-unique"`

- **Implementation note:** Compute the **shared collection address** the same way your contract does (resource account derivation) and expose it via config/env (e.g., `APTOS_CREATOR_ADDRESS`).

- **Example GraphQL query structure:**
~~~graphql
query TokensByCollection(
  $creator: String!, 
  $collection: String!, 
  $limit: Int!, 
  $offset: Int!,
  $orderBy: [current_token_datas_v2_order_by!]
) {
  current_token_datas_v2(
    where: {
      collection_name: { _eq: $collection }
      creator_address: { _eq: $creator }
      # Add trait filters here dynamically
    },
    limit: $limit,
    offset: $offset,
    order_by: $orderBy
  ) {
    token_name
    token_data_id_hash
    token_uri
    last_transaction_timestamp
    current_token_data {
      metadata
    }
  }
}
~~~

---

## 5) Rarity (MVP) — Requirements & Formula

### 5.1 Inputs

- **Contract priors** (from `SHAPE_CUMULATIVE_PROBS`, out of 7810):  
  ~~~js
  const SHAPE_RARITY = [
    { shape: "Circle",   probability: 25.6 },
    { shape: "Square",   probability: 19.2 },
    { shape: "Triangle", probability: 14.4 },
    { shape: "Diamond",  probability: 10.8 },
    { shape: "Star",     probability:  8.1 },
    { shape: "Pentagon", probability:  6.1 },
    { shape: "Hexagon",  probability:  4.6 },
    { shape: "Octagon",  probability:  3.4 },
    { shape: "Cross",    probability:  2.6 },
    { shape: "Heart",    probability:  1.9 },
    { shape: "Arrow",    probability:  1.4 },
    { shape: "Spiral",   probability:  1.1 },
    { shape: "Infinity", probability:  0.8 }
  ];
  ~~~
  - `shape` prior P₀ uses the **probability** column above (% / 100).
  - `background_color` prior P₀ = 1/13 ≈ 0.076923 (uniform across 13 colors).
  - `word_combination` vocabulary: **100 four-letter words**, combinations **100³ = 1,000,000**. Use **symmetric prior** P₀ = 1/1,000,000.

- **Observed frequencies** (empirical): counts from **Indexer** over **currently minted** tokens only.

### 5.2 Smoothed probability per attribute value

For value v within trait type T:

**P̂(v) = (c(v) + α · P₀(v)) / (N_T + α)**

Where:
- c(v): observed count of value v  
- N_T: total observed tokens for trait type T  
- P₀(v): prior probability (contract/uniform/symmetric)  
- α: smoothing strength (**adaptive**: 200 when <1000 minted, 100 when <5000 minted, 50 otherwise)

### 5.3 Token rarity score (information content)

**IC(token) = Σ_{(T,v)} -log₂(P̂(v))**

Normalize to 0–100 within minted set:

**score = 100 · (IC(token) - min(IC)) / (max(IC) - min(IC))**

Compute **percentiles** and map to **tiers**:
- **S**: ≥ 98th percentile (Top 2%)
- **A**: 90–98th percentile (Top 10%)
- **B**: 60–90th percentile (Top 40%)
- **C**: 30–60th percentile (Middle 30%)
- **D**: < 30th percentile (Bottom 30%)

### 5.4 UX
- **Card badge:** tier pill with percentile (e.g., "S • 99th").
- **Detail page:** numeric score, percentile, tier, and per-attribute breakdown table.
- **Tooltip:** "Rarity: S tier • Top 1% (Score: 92.4)".

### 5.5 Operations & Caching
- **Recompute schedule:** Every **5 minutes** via cron job or on-demand trigger.
- **Cache strategy:** In-memory cache with TTL, Redis for production.
- **Graceful degradation:** If rarity computation fails, show tokens without rarity data.
- **Performance:** Batch process, avoid blocking requests during recomputation.

---

## 6) Performance, Caching & Resilience

- **Virtualized Grid:** `react-window` or `@tanstack/react-virtual`. Batch fetch 48–60 items.
- **Caching Strategy:**  
  - **CDN/HTTP cache:** `/api/nft/collection/traits` and stats for 300s.  
  - **In-memory LRU:** `/api/nft/collection/list` pages by query hash.
  - **Client-side:** React Query with stale-while-revalidate.
- **Images:** 
  - Responsive `srcset`/`sizes` with multiple breakpoints.
  - Lazy-load below the fold with intersection observer.
  - WebP format with JPEG fallback.
- **Error Handling:** 
  - Exponential backoff retry with jitter.
  - User-visible retry buttons.
  - Partial failure handling (some cards load, others show retry).

---

## 7) Accessibility & SEO

### 7.1 Accessibility
- **Alt text:** Token name + key traits (e.g., "Retro NFT #1234 - Blue Circle with Abstract pattern").
- **Keyboard navigation:** All interactive elements accessible via tab/enter/space.
- **Screen readers:** Proper ARIA labels, live regions for dynamic content.
- **Focus management:** Visible focus outlines, logical tab order.
- **Color contrast:** Meet WCAG AA standards (4.5:1 minimum).

### 7.2 SEO (Future consideration)
- **Meta tags:** Dynamic titles and descriptions for token detail pages.
- **Open Graph:** Social sharing previews with token images.
- **JSON-LD:** Structured data for NFT collections and items.

---

## 8) Analytics & Monitoring

### 8.1 User Analytics
- `GalleryViewed`, `FilterApplied(trait_type, values[])`, `SortChanged(sort_type)`
- `SearchExecuted(query, results_count)`, `CardClicked(token_id, position)`
- `TokenDetailViewed(token_id, source)`, `LoadMoreTriggered(cursor, items_loaded)`
- `RarityBadgeHovered(token_id, tier)`, `ShareLinkCopied(token_id)`

### 8.2 Performance Monitoring
- **Core Web Vitals:** LCP, FID, CLS tracking.
- **API metrics:** Response times, error rates per endpoint.
- **Image loading:** Success rates, load times by breakpoint.

### 8.3 Business Metrics
- Daily active users, session duration, bounce rate.
- Most filtered traits, popular sort methods.
- Conversion from gallery to mint page (future).

---

## 9) Acceptance Criteria

### 9.1 Core Functionality
1. `/#/gallery` (no wallet) renders header with `Items: 10,000` and live `Minted` count.
2. Search filters items by name/ID with debounced input; state reflected in URL.
3. Trait filters support multi-select (OR within type, AND across types) with active filter chips.
4. Sort works correctly for `Recently Minted`, `Token ID` (both directions), and **`Rarity`**.
5. Cards display rarity badges ("tier • percentile"); detail page shows full rarity breakdown.

### 9.2 Performance & UX
6. Infinite scroll handles 10k dataset smoothly; no major jank on mid-range devices.
7. Mobile responsive: filters as drawer, grid reflows to 2 columns, touch-friendly targets.
8. Loading, empty, and error states match design specifications.
9. All images lazy-load and use appropriate formats/sizes.

### 9.3 Technical Requirements
10. Rarity system updates every ≤5 minutes; no blocking during recomputation.
11. URL state management: shareable links work correctly.
12. Analytics events fire with correct payloads and timing.
13. Accessibility: keyboard navigation, screen reader support, proper focus management.

---

## 10) Implementation Plan (Development Ready)

### 10.1 Project Structure
~~~
/frontend
  /components/gallery/
    GalleryHeader.tsx          # Collection stats and title
    GalleryToolbar.tsx         # Search, sort, view toggles
    FilterSidebar.tsx          # Desktop trait filters
    FilterDrawer.tsx           # Mobile trait filters  
    TokenGrid.tsx              # Virtualized grid container
    TokenCard.tsx              # Individual NFT card
    RarityBadge.tsx           # Rarity tier display
  /components/token/
    TokenDetail.tsx            # Full token view
    TokenNavigation.tsx        # Prev/next navigation
    AttributeTable.tsx         # Traits display
    RarityBreakdown.tsx       # Detailed rarity info
  /hooks/
    useGalleryState.ts        # URL state management
    useInfiniteScroll.ts      # Pagination logic
    useCollectionData.ts      # API data fetching
  /utils/
    hashRouter.ts             # Minimal hash routing
    rarityUtils.ts            # Rarity calculations
    urlState.ts               # Query param helpers
  App.tsx

/pages/api/nft/collection/
  list.ts                     # Paginated token listing
  traits.ts                   # Trait aggregations
  stats.ts                    # Collection statistics
/pages/api/nft/
  metadata/[id].ts           # Single token (existing)
  rarity/
    refresh.ts               # Trigger recomputation
/lib/
  indexer.ts                 # GraphQL client & queries
  rarity.ts                  # Rarity computation service  
  cache.ts                   # Caching utilities
~~~

### 10.2 Environment Configuration
~~~bash
# Collection Identity
APTOS_CREATOR_ADDRESS="0x..." # Shared resource account address
APTOS_COLLECTION_NAME="Retro 80s NFT Collection 2025-01-08-v2-unique"

# API Configuration  
INDEXER_GRAPHQL_URL="https://..."
RARITY_UPDATE_INTERVAL=300000 # 5 minutes in ms

# Caching
REDIS_URL="redis://..."       # For production
CACHE_TTL_TRAITS=300         # 5 minutes
CACHE_TTL_STATS=60           # 1 minute
~~~

### 10.3 Implementation Status ✅

#### ✅ Phase 1: Core Gallery (COMPLETED)
- ✅ Hash router setup with react-router-dom
- ✅ URL state management for search, sort, filters, pagination
- ✅ Gallery layout: Header, Toolbar, Grid, FilterSidebar
- ✅ API endpoints: `/collection/list`, `/collection/traits`, `/collection/stats`
- ✅ Search by token name/ID with debounced input
- ✅ Multi-select trait filtering (OR within type, AND across types)
- ✅ Active filter chips with individual remove buttons
- ✅ Sort by Recently Minted, Token ID (asc/desc), Rarity

#### ✅ Phase 2: Rarity System (COMPLETED)  
- ✅ Mathematical rarity engine (`lib/rarity.js`) with smoothing formula
- ✅ Shape probabilities from contract (`SHAPE_CUMULATIVE_PROBS`)
- ✅ Information content calculation: `IC = Σ -log₂(P̂(v))`
- ✅ Tier mapping: S (≥98th), A (90-98th), B (60-90th), C (30-60th), D (<30th)
- ✅ Rarity badges in card footer (moved from overlay to avoid user confusion)
- ✅ Full rarity breakdown on token detail pages
- ✅ `/api/nft/rarity/refresh` endpoint for batch computation
- ✅ In-memory caching with graceful fallback

#### ✅ Phase 3: Polish & Performance (COMPLETED)
- ✅ Virtualized infinite scroll with `@tanstack/react-virtual`
- ✅ Responsive grid: 6 cols (xl) → 5 (lg) → 4 (md) → 3 (sm) → 2 (mobile)
- ✅ Mobile filter drawer with touch-friendly interactions
- ✅ Loading skeletons, empty states, error handling with retry
- ✅ Image lazy loading with intersection observer
- ✅ Accessibility: keyboard navigation, focus management, ARIA labels
- ✅ Development middleware for API execution in Vite
- ✅ Mock data fallback for development/testing

#### 🔧 Development Infrastructure
- ✅ Vite plugin for API route execution in development
- ✅ Mock data system for offline development
- ✅ Vercel configuration with proper function timeouts
- ✅ CORS headers and API rewrites configured

### 10.4 Key Technical Decisions

#### Indexer Query Strategy
- Use **collection name + creator address** filtering for all collection-wide queries
- Implement cursor-based pagination for consistent performance
- Cache trait counts separately from token data

#### Rarity Algorithm Implementation  
- Pre-compute all rarity scores in background job
- Store in fast lookup cache (Redis/memory)
- Graceful fallback when rarity data unavailable
- Adaptive smoothing parameter based on mint progress

#### Client State Management
- URL-first approach: all filter state in query params
- React Query for API caching and background updates  
- Optimistic updates for immediate feedback
- Preserve scroll position on navigation

---

## 10.5) Implementation Summary & Key Files

### Frontend Components (`frontend/components/`)
```
gallery/
├── Gallery.tsx              # Main gallery page with infinite query
├── GalleryHeader.tsx         # Collection stats (Items: 10,000, Minted: live)
├── GalleryToolbar.tsx        # Search, sort, mobile filter toggle  
├── FilterSidebar.tsx         # Desktop trait filters with counts
├── TokenGrid.tsx             # Virtualized grid with 2-6 responsive columns
├── TokenCard.tsx             # NFT card with rarity badge in footer (not overlay)
└── RarityBadge.tsx          # Tier + percentile badge (S • 99th)

token/
├── TokenDetail.tsx           # Full token view with navigation
├── AttributeTable.tsx        # Trait display grid
└── RarityBreakdown.tsx      # Per-trait rarity analysis with IC scores
```

### API Endpoints (`api/nft/`)
```
collection/
├── list.js                  # Paginated tokens with search/filter/sort
├── traits.js                # Trait aggregation for filter sidebar  
└── stats.js                 # Live collection statistics

rarity/
└── refresh.js               # Batch rarity computation with caching

metadata/[id].js             # Enhanced with rarity data
```

### Core Libraries (`lib/` & `frontend/utils/`)
```
lib/rarity.js               # Mathematical rarity engine with smoothing
frontend/utils/mockData.ts  # Development fallback data
frontend/gallery.css        # Responsive & accessibility styles
```

### Routes Implemented
- `/#/gallery` - Public gallery (no wallet required)
- `/#/token/:id` - Token detail pages with prev/next navigation  
- `/#/mint` - Original mint interface (wallet required)
- Automatic redirect: `/` → `/#/gallery`

### Key Features Working
1. **Enhanced Search**: Debounced search by token name/ID **+ individual words** from word combinations with URL persistence
2. **Individual Word Filtering**: Multi-select traits including **individual words** (Background Color, Shape, individual Words) with active chips
3. **Sorting**: Recently Minted, Token ID (asc/desc), Rarity (high→low)
4. **Infinite Scroll**: Virtualized grid handling 10k+ tokens smoothly
5. **Responsive**: 2-6 columns based on screen size, mobile drawer filters
6. **Rarity System**: Mathematical scoring with tier badges (S/A/B/C/D)
7. **Token Details**: Full metadata, attribute tables, rarity breakdowns
8. **Error Handling**: Graceful API fallbacks, retry buttons, loading states

### Development Setup
- Custom Vite middleware executes Vercel API functions in development
- Mock data system provides realistic fallback for offline development
- All components use React Query for caching and background updates
- URL state management preserves search/filter state in shareable links

---

## 11) Future Enhancements

### 11.1 Marketplace Integration
- **Escrow-based listings:** Seller transfers to marketplace contract, marketplace handles sales
- **Non-custodial approvals:** Evaluate if current NFT contract supports approval patterns
- **Price discovery:** Floor prices, recent sales, volume metrics

### 11.2 Advanced Features  
- **Bulk operations:** Multi-select for comparison or bulk actions
- **Collection analytics:** Rarity distribution charts, trait correlation analysis
- **Social features:** Favorites, collections, user profiles
- **Advanced search:** Boolean operators, saved searches, alerts

### 11.3 Performance Optimizations
- **Image CDN:** Automated resizing and format optimization
- **Edge caching:** Collection metadata at CDN edge
- **Predictive loading:** Pre-load likely next pages
- **Service worker:** Offline support and background sync

---

## 12) Risk Mitigation

### 12.1 Technical Risks
- **Indexer downtime:** Implement fallback data sources or graceful degradation
- **Large dataset performance:** Virtual scrolling and progressive enhancement  
- **Rarity computation cost:** Batch processing and incremental updates
- **Mobile performance:** Bundle size optimization and code splitting

### 12.2 Product Risks
- **User adoption:** Analytics-driven iteration and user feedback loops
- **Scalability concerns:** Load testing before public launch
- **Data accuracy:** Regular audit of rarity calculations vs actual distribution

---

*End of PRD v1.4*
