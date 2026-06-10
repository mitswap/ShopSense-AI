/** Canonical internal schema — all uploads normalize to this */
export type CanonicalField =
  | 'date'
  | 'product_name'
  | 'category'
  | 'quantity'
  | 'unit_price'
  | 'revenue'
  | 'stock'
  | 'unit_cost'
  | 'weather'
  | 'season'
  | 'festival'
  | 'location'
  | 'branch'
  | 'supplier'

export interface ColumnMapping {
  sourceColumn: string
  canonicalField: CanonicalField
  confidence: number
}

export interface SchemaDetectionResult {
  mappings: ColumnMapping[]
  unmapped: string[]
  method: 'rules' | 'llm' | 'hybrid'
}

export interface CanonicalRow {
  date: string
  product_name: string
  category: string
  quantity: number
  unit_price: number
  revenue: number
  stock: number
  unit_cost: number
  weather?: string
  season?: string
  festival?: string
  location?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  nameBn: string
  category: string
  stockQty: number
  unitCost: number
  unitPrice: number
  firstStockDate?: string
}

export interface SaleRecord {
  id: string
  productId: string
  sku: string
  saleDate: string
  qtySold: number
  revenue: number
  unitPrice: number
  weather?: string
  season?: string
  festival?: string
  location?: string
}

export interface ShopData {
  shopId: string
  shopName: string
  products: Product[]
  sales: SaleRecord[]
  updatedAt: string
  schemaMappings?: ColumnMapping[]
  rowCount?: number
}

export interface AnalyticsSummary {
  totalStockValue: number
  totalSkus: number
  lowStockCount: number
  overstockCount: number
  deadStockCount: number
  totalRevenue: number
  totalRevenue30d: number
  monthlyGrowthPct: number | null
  profitEstimate: number
  bestSeller: { name: string; revenue: number } | null
  topMovers: { sku: string; name: string; qty: number }[]
  slowMovers: { sku: string; name: string; qty: number }[]
  deadStockItems: { sku: string; name: string; qty: number }[]
  categoryBreakdown: { category: string; stockValue: number; revenue: number; count: number }[]
  festivalLift: { festival: string; revenue: number; upliftPct: number }[]
  festivalProductLeaders: {
    festival: string
    sku: string
    name: string
    qty: number
    revenue: number
    currentStock: number
    avgFestivalWindowQty: number
    normalDailyQty: number
    upliftPct: number
    suggestedFestivalRestock: number
  }[]
  festivalSummary: {
    festival: string
    revenue: number
    qty: number
    activeDays: number
    topProducts: {
      sku: string
      name: string
      qty: number
      revenue: number
      currentStock: number
      avgFestivalWindowQty: number
      normalDailyQty: number
      upliftPct: number
      suggestedFestivalRestock: number
    }[]
  }[]
  locationPerformance: { location: string; revenue: number }[]
  weekdayPattern: { day: string; avgRevenue: number }[]
}

export interface ForecastPoint {
  date: string
  predicted: number
}

export interface ProductForecast {
  productId: string
  sku: string
  nameBn: string
  name: string
  currentStock: number
  avgDailySales: number
  forecast7d: number
  forecast30d: number
  daysUntilStockout: number | null
  suggestedReorder: number
  risk: 'low' | 'medium' | 'high'
  series: ForecastPoint[]
}

export interface Alert {
  id: string
  type: 'stockout' | 'overstock' | 'reorder' | 'anomaly' | 'dead_stock'
  severity: 'high' | 'medium' | 'low'
  messageBn: string
  sku: string
}

export interface DecisionFeedItem {
  id: string
  icon: 'warning' | 'insight' | 'action' | 'trend'
  titleBn: string
  bodyBn: string
  actionBn?: string
  severity: 'high' | 'medium' | 'low'
  evidence: string[]
  relatedSku?: string
}

export interface DataInsight {
  id: string
  type: 'trend' | 'anomaly' | 'forecast' | 'graph' | 'root_cause'
  titleBn: string
  explanationBn: string
  metrics: Record<string, string | number>
  confidence: number
}

export interface GraphEdge {
  from: string
  to: string
  relation: string
  weight: number
}

export interface GraphNode {
  id: string
  type: 'product' | 'category' | 'festival' | 'location' | 'season'
  label: string
}

export interface BusinessGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  bundleSuggestions: { products: string[]; reasonBn: string }[]
}

export interface InventoryUpdateInput {
  stockQty: number
  unitPrice: number
}

export interface KnowledgeChunk {
  id: string
  content: string
  contentBn: string
  category: string
}

export interface ProviderRoute {
  provider: 'huggingface' | 'openrouter' | 'ollama' | 'deterministic' | 'none' | string
  model?: string | null
  ok?: boolean
  error?: string | null
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
}

export interface AgentEvidence {
  agent: string
  evidence: Record<string, unknown>
  confidence?: number
}

export interface ReasoningTask {
  taskType: string
  intent?: string
  reasoningPath?: string[]
  evidenceUsed?: string[]
}

export interface GroundedAnswer {
  provider?: string
  method?: string
  reasoningPath?: string[]
  evidenceUsed?: string[]
  confidence?: number
  ragMode?: string
  validation?: ValidationResult
  attempts?: ProviderRoute[]
  fallbackDepth?: number
  latencyMs?: number
}

export interface MemoValidationWarning {
  rowIndex?: number
  field?: 'date' | 'product_name' | 'quantity' | 'unit_cost' | 'supplier' | 'memo_number' | 'general'
  level: 'error' | 'warning'
  message: string
}

export interface MemoLineItem {
  id: string
  date: string
  product_name: string
  category: string
  quantity: number
  unit_cost: number
  stock: number
  supplier?: string
  confidence?: number
  matchedSku?: string | null
  isNewProduct?: boolean
  warnings?: MemoValidationWarning[]
}

export interface MemoHeaderInfo {
  supplier?: string
  memoNumber?: string
  memoDate?: string
}

export interface MemoExtractionResponse extends GroundedAnswer {
  header: MemoHeaderInfo
  rows: MemoLineItem[]
  warnings: MemoValidationWarning[]
  ocrEngine?: string
  rawTextPreview?: string
}

export interface AiInsightRequest {
  shopName: string
  analytics: AnalyticsSummary
  forecasts: ProductForecast[]
  alerts: Alert[]
  products?: Product[]
  sales?: SaleRecord[]
  adviceSeed?: number
  ragChunks?: KnowledgeChunk[]
  locale: 'bn' | 'en'
  decisionFeed?: DecisionFeedItem[]
  graph?: BusinessGraph
}

export interface AiInsightResponse {
  summaryBn: string
  recommendations: { titleBn: string; actionBn: string; priority: number; reasonBn?: string }[]
  ragSources: string[]
  ragMode?: string
  provider?: string
  method?: string
  reasoningPath?: string[]
  evidenceUsed?: string[]
  confidence?: number
  validation?: ValidationResult
  attempts?: ProviderRoute[]
  fallbackDepth?: number
  latencyMs?: number
}

export interface NlQueryResult extends GroundedAnswer {
  answerBn: string
  intent: string
  dataUsed: string[]
}

export interface WeatherCardResponse extends GroundedAnswer {
  location: {
    name: string
    region: string
    country: string
    localtime: string
  }
  current: {
    tempC: number
    feelsLikeC: number
    humidity: number
    windKph: number
    precipMm: number
    uv: number
    isDay: number
    conditionText: string
    conditionIcon: string
  }
  advice: {
    summary: string
    dailyLife: string[]
    frontDeskWinners: string[]
    likelyLosers: string[]
    shopActions: string[]
  }
}
