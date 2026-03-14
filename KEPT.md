# Kept.AI — Returns Intelligence Dashboard Specification

> **Purpose:** This document defines every metric, data source, and feature that Kept.AI's Shopify merchant dashboard must display. Use this as the single source of truth for building the dashboard UI and backend data pipelines.

---

## 1. Top-Level KPIs ("How Bad Is It?" Overview)

The first screen a merchant sees. Answers: "How much are returns costing me right now?"

### 1.1 Return Rate
- **Calculation:** `(total returns / total orders) × 100`
- **Display:** Percentage with trend arrow (up/down vs. prior period)
- **Time granularity:** Day, week, month, quarter
- **Benchmark context:** Show merchant's rate vs. industry average for their vertical (apparel ~20-30%, electronics ~5-10%, general e-commerce ~10-15%)
- **Data source:** Shopify Orders API + Shopify Refunds API

### 1.2 Total Return Cost This Period
- **Display:** Single aggregated dollar figure (the "shock number")
- **Breakdown components:**
  - Refund amount issued
  - Return shipping labels paid by merchant
  - Estimated processing/labor cost (merchant-configurable, default $5-10 per return)
  - Original outbound shipping wasted
  - Payment processing fees lost (Shopify Payments ~2.9% + $0.30, not refunded)
- **Data sources:** Shopify Refunds API, Shopify Fulfillments API, Shopify Payments API

### 1.3 Revenue Retained via Kept
- **Definition:** Dollar value of returns that Kept prevented or converted to exchanges
- **Calculation:** `(prevented returns × avg fully-loaded cost per return) + (exchange conversions × avg order value retained)`
- **Display:** Dollar figure + percentage of total return volume deflected
- **Purpose:** Justifies Kept's subscription cost — this is the ROI metric

### 1.4 Exchange Rate vs. Refund Rate
- **Calculation:** `exchanges / (exchanges + refunds) × 100`
- **Display:** Donut or bar chart showing split
- **Goal:** Kept pushes this ratio toward exchanges (revenue retained) over refunds (revenue lost)
- **Data source:** Shopify Returns API (return type field)

---

## 2. Product Intelligence ("What's Being Returned?")

### 2.1 Most Returned Products Table
| Column | Description | Source |
|--------|-------------|--------|
| Product Title | Full product name | Products API |
| SKU | Stock keeping unit | Products API |
| Variant | Size, color, material | Products API (variants) |
| Units Sold | Total units sold in period | Orders API |
| Units Returned | Total units returned in period | Returns API |
| Return Rate % | `(units returned / units sold) × 100` | Calculated |
| Top Return Reason | Most common reason code | Returns API |
| Total Return Cost | Fully-loaded cost of all returns for this product | Calculated |
| Flag | Red indicator if return rate > configurable threshold (default 15%) | Calculated |

- **Sorting:** Default sort by return rate descending
- **Filtering:** By collection, product type, date range, vendor

### 2.2 Return Rate by Product Attribute
Slice return rates across these dimensions:
- **By size:** Is XL returned at 3x the rate of Medium?
- **By color:** Is "Ocean Blue" misleading in photos?
- **By price band:** Are products over $100 returned more?
- **By collection/category:** Which collections have the worst return rates?
- **By product age:** New launches (< 30 days) vs. established products
- **By vendor/supplier:** Which suppliers have quality issues?
- **Data sources:** Shopify Products API (variants, tags, metafields), Orders API, Returns API

### 2.3 Product-Level Return Reason Breakdown
- **Display:** Per flagged product, show bar/pie chart of return reasons
- **Example insight:** "60% of returns on [Dress Name] are 'too small' → sizing chart problem"
- **Shopify return reason codes supported:**
  - `SIZE_TOO_SMALL`
  - `SIZE_TOO_LARGE`
  - `DAMAGED_DEFECTIVE`
  - `NOT_AS_DESCRIBED`
  - `CHANGED_MIND`
  - `WRONG_ITEM_RECEIVED`
  - `OTHER` (free-text)
  - Custom reasons (merchant-defined)

---

## 3. Return Reason Analysis ("Why Is It Being Returned?")

### 3.1 Return Reason Distribution
- **Display:** Bar chart showing percentage breakdown across all return reasons
- **Time trending:** Overlay trend lines to detect spikes (e.g., "not as described" spiking after a product photo update)
- **Data source:** Shopify Returns API reason codes

### 3.2 AI-Powered Reason Clustering (Kept Differentiator)
- **Input:** Free-text customer comments from return requests
- **AI processing:** NLP clustering into actionable themes:
  - "fabric feels cheap"
  - "color doesn't match photos"
  - "runs small in the shoulders"
  - "arrived later than expected"
  - "quality inconsistent with previous order"
- **Display:** Clustered theme cards with frequency count, associated products, and suggested merchant action
- **Purpose:** Transforms vague "other" reasons into specific, fixable insights

### 3.3 Return Reason by Channel
- **Channels:** Shopify Online Store, Shop App, POS (retail), Wholesale, Draft Orders
- **Hypothesis:** In-store purchases (touch/try) should have lower "not as described" rates than online
- **Display:** Stacked bar chart comparing reason distribution across channels
- **Data source:** Orders API (source_name field) + Returns API

---

## 4. Financial Drill-Down ("How Much Does Each Return Cost?")

### 4.1 Per-Return Cost Breakdown
For each individual return, calculate and display:

| Cost Component | Source | Notes |
|----------------|--------|-------|
| Refund Amount | Refunds API | Full vs. partial; original payment vs. store credit |
| Return Shipping Cost | Shopify Shipping API or 3PL integration | Who paid — merchant or customer? Carrier used? |
| Original Outbound Shipping | Fulfillments API | Wasted cost of original delivery |
| Payment Processing Fees Lost | Calculated | Shopify Payments: ~2.9% + $0.30 per transaction, NOT refunded on refunds |
| Estimated Handling Cost | Merchant-configured | Default $5-8/return; or pull from 3PL integration (ShipBob, ShipHero, etc.) |
| Product Depreciation | Merchant-tagged | Based on return condition: new, opened, damaged, unsellable |
| **Total Fully-Loaded Cost** | **Calculated** | **Sum of all above** |

### 4.2 The "True Cost" Revelation
- **Display:** Callout card showing: "This return of a $75 dress actually cost you $94.30"
- **Purpose:** Makes merchants internalize that returns cost MORE than the refund amount
- **Aggregate view:** Total return cost as percentage of gross revenue this period

### 4.3 Store Credit vs. Original Payment Refund Split
- **Calculation:** `(store credit refunds / total refunds) × 100`
- **Dollar value:** How much return value is retained as store credit (future revenue) vs. cash out the door
- **Data source:** Shopify Refunds API (refund type field)

---

## 5. Customer Intelligence ("Who's Returning?")

### 5.1 Customer Return Behavior Segmentation
| Segment | Return Rate | Action |
|---------|-------------|--------|
| Low Returners | 0-5% | Reward/retain |
| Moderate | 5-15% | Monitor |
| Heavy | 15-30% | Investigate patterns |
| Serial Returners | 30%+ | Flag for review; assess net value |

- **Display:** Segment distribution chart + revenue vs. return cost per segment
- **Key insight:** Some serial returners are net-positive (high spend, moderate returns); others are net-negative

### 5.2 Customer Lifetime Value Adjusted for Returns
- **Calculation:** `CLV = (total order value) - (total refunds) - (total return shipping) - (total handling costs) - (total lost payment fees)`
- **Display:** Per-customer "Real CLV" vs. "Gross CLV"
- **Example:** Customer with $2,000 in purchases but $1,400 in returns + costs is NOT a $2,000 customer
- **Data source:** Shopify Customers API + Orders API + Refunds API

### 5.3 Bracketing Detection
- **Definition:** Customers who order multiple sizes/colors of the same item and return most of them
- **Detection logic:** Flag customers where ≥2 variants of the same product are in one order AND ≥50% of variants are returned
- **Display:** Flagged customer list with bracketing frequency, cost impact, and suggested intervention
- **Data source:** Orders API (line items with same product_id, different variant_id) + Returns API

### 5.4 First-Time vs. Repeat Customer Return Rates
- **Display:** Comparison bar chart
- **Insight logic:**
  - High first-time return rate → product expectation gap (photos/marketing overpromising)
  - High repeat return rate → quality consistency issue or sizing inconsistency
- **Data source:** Customers API (orders_count field) + Returns API

### 5.5 Geographic Return Patterns
- **Display:** Heat map or table showing return rate by shipping region (state/province or country)
- **Insight logic:** High return rates in specific regions may indicate shipping damage (carrier issue), fit preference differences, or fraud concentration
- **Data source:** Orders API (shipping_address) + Returns API

---

## 6. Disposition Tracking ("What Happened After the Return?")

### 6.1 Return Outcome Breakdown
| Disposition | Description | Value Recovery |
|-------------|-------------|----------------|
| Restocked as New | Back into sellable inventory at full price | 100% |
| Restocked at Discount | Open-box or marked down | 50-80% |
| Sent to Liquidation | Bulk sold to liquidators | 10-30% |
| Donated | Given to charity (tax write-off value) | Tax benefit only |
| Disposed / Recycled | Total loss | 0% |
| Still in Processing | Awaiting inspection | Pending |

- **Display:** Donut chart showing percentage distribution across dispositions
- **Merchant input:** Kept lets merchants tag return condition upon receipt (or integrates with 3PL for automated grading)

### 6.2 Recovery Rate
- **Calculation:** `(total value recovered from returned merchandise / total original retail value of returned merchandise) × 100`
- **Display:** Percentage with dollar amounts
- **Example:** "Of $50,000 in returned merchandise this month, you recovered $32,000 (64%)"

### 6.3 Average Resolution Time
- **Calculation:** Time from return initiated → refund/exchange issued
- **Display:** Average in days, with distribution histogram
- **Benchmark:** Shopify merchants typically aim for 3-5 business days
- **Data source:** Shopify Returns API (timestamps for created_at, received_at, resolved_at)

---

## 7. Prevention Analytics ("What Did Kept Prevent?")

This is Kept's ROI dashboard — the section that justifies the subscription.

### 7.1 Returns Prevented
- **Categories of prevention:**
  - Size recommendations that reduced size-related returns
  - Post-purchase emails (care instructions, styling tips) that reduced "changed mind" returns
  - Proactive exchange offers that converted would-be refunds into exchanges
  - Product page enhancement suggestions (better photos, sizing charts) that reduced "not as described" returns
- **Display:** Total prevented returns count + breakdown by intervention type

### 7.2 Revenue Saved
- **Calculation:** `(number of prevented returns) × (average fully-loaded cost per return)`
- **Display:** Large dollar figure, prominently placed
- **Comparison:** Show revenue saved vs. Kept subscription cost → ROI multiplier

### 7.3 Intervention Effectiveness
| Intervention Type | Trigger | Metrics |
|-------------------|---------|---------|
| Smart Size Recommendation | Customer viewing size-variable product | Conversion rate, size-return reduction % |
| Post-Purchase Nurture Email | After order placed | Open rate, return rate of recipients vs. non-recipients |
| Exchange-First Prompt | Customer initiates return | Exchange conversion rate, revenue retained |
| Product Flag Alert | Product return rate exceeds threshold | Merchant action taken, subsequent return rate change |
| Sizing Chart Enhancement | AI detects size-related returns spike | Before/after return rate for affected products |

### 7.4 Before/After Comparison
- **Display:** Time-series chart showing return rate and total return cost, with a vertical line marking "Kept installed" date
- **Purpose:** The #1 metric for renewals, upsells, and case studies

---

## 8. Shopify Technical Integration

### 8.1 Required Shopify API Scopes
```
read_orders          # Order details, line items, prices
read_products        # Product details, variants, inventory
read_customers       # Customer profiles, order history, tags
read_returns         # Return status, tracking, reason codes, disposition
read_fulfillments    # Shipping costs, carrier info, tracking numbers
read_analytics       # Traffic, conversion data (for correlation)
read_shopify_payments_payouts  # Payment processing fee data
```

### 8.2 Shopify App Framework Requirements
- **Embedded app:** Use Shopify's App Bridge + Polaris design system for native feel
- **Billing:** Shopify App Billing API for frictionless subscription management
- **Webhooks to subscribe to:**
  - `orders/create`
  - `orders/updated`
  - `refunds/create`
  - `returns/request`
  - `returns/approve`
  - `returns/close`
  - `products/update`

### 8.3 Third-Party Integrations (Optional, Phase 2+)
| Integration | Purpose |
|-------------|---------|
| ShipBob / ShipHero / Deliverr | 3PL data: actual handling costs, disposition tracking, inventory sync |
| Klaviyo / Omnisend | Email platform: trigger post-purchase nurture flows |
| Gorgias / Zendesk | Customer support: link support tickets to returns |
| Google Analytics / GA4 | Correlate return rates with traffic source and on-site behavior |
| Loop / ReturnGO | If merchant already uses a returns portal, ingest their data |

### 8.4 Merchant Size Adaptation
| Merchant Tier | Monthly Orders | Dashboard Scope |
|---------------|---------------|-----------------|
| Starter | < 100 | Return rate, top returned products, cost per return, basic reason breakdown |
| Growth | 100 - 1,000 | + Customer segmentation, product attribute slicing, exchange vs. refund tracking |
| Scale | 1,000 - 10,000 | + AI reason clustering, bracketing detection, geographic patterns, prevention analytics |
| Enterprise | 10,000+ | + Full financial drill-down, 3PL integrations, custom reporting, API access |

---

## 9. Data Model Summary

### Core Entities
```
Order
  ├── id, order_number, created_at, total_price, financial_status
  ├── customer_id → Customer
  ├── line_items[] → Product/Variant
  ├── fulfillments[] → shipping_cost, carrier, tracking
  └── refunds[] → Refund

Refund
  ├── id, created_at, amount, refund_type (original_payment | store_credit)
  └── return_id → Return

Return
  ├── id, status, created_at, received_at, resolved_at
  ├── reason_code, customer_note (free text)
  ├── return_line_items[] → Product/Variant
  └── disposition (restocked | discounted | liquidated | donated | disposed)

Product
  ├── id, title, vendor, product_type, tags, collections
  └── variants[] → sku, size, color, price, inventory_quantity

Customer
  ├── id, email, orders_count, total_spent
  ├── tags, shipping_address (city, state, country)
  └── kept_segment (low | moderate | heavy | serial)

KeptIntervention
  ├── id, type, triggered_at, customer_id, product_id
  ├── outcome (prevented | converted_to_exchange | no_effect)
  └── estimated_value_saved
```

---

## 10. Key Design Principles

1. **Shock value first.** Lead with the total cost number. Merchants underestimate return costs by 2-3x. The dashboard should make the problem visceral before offering solutions.

2. **Actionable, not just informational.** Every metric should link to a recommended action. "This product has a 25% return rate" → "Suggested action: update sizing chart based on return reason patterns."

3. **Kept's value is always visible.** The prevention analytics and revenue-saved metrics should be persistent — visible from every page, not buried in a sub-tab.

4. **Progressive complexity.** Don't overwhelm a merchant doing 50 orders/month with enterprise analytics. Adapt the dashboard to their scale.

5. **Shopify-native feel.** Use Polaris components. The dashboard should feel like it belongs inside the Shopify admin, not like a separate tool.

6. **Speed.** Dashboard should load in < 2 seconds. Pre-compute aggregations. Use caching. Merchants will abandon a slow analytics tool.

---

## 11. Competitive Positioning

| Tool | What It Does | Kept's Advantage |
|------|-------------|------------------|
| Loop Returns | Returns management portal (labels, exchanges, store credit) | Kept prevents returns before they happen; Loop manages them after |
| ReturnGO | Returns automation and exchange workflows | Kept adds AI-powered reason analysis and predictive prevention |
| Narvar | Post-purchase experience (tracking, returns) | Kept focuses exclusively on returns intelligence and cost reduction |
| AfterShip Returns | Return label generation and tracking | Kept provides the analytics and prevention layer AfterShip lacks |
| Shopify Native Returns | Basic return processing built into Shopify admin | Extremely limited analytics; no prevention, no cost calculation, no AI |

**Kept's moat:** No existing Shopify returns app answers "why are returns happening, how much do they actually cost, and how do I prevent them?" Kept is the intelligence and prevention layer that sits on top of (or replaces) existing returns management tools.
