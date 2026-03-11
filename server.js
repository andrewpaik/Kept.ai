/**
 * Kept.ai — Backend Server
 * Processes uploaded datasets through Claude to generate dashboard data.
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk').default;

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// --- File Upload ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.csv', '.json', '.tsv', '.txt', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Use CSV, JSON, TSV, or TXT.`));
    }
  }
});

// --- Anthropic Client ---
const anthropic = new Anthropic();

// --- Dashboard Schema for Claude ---
const DASHBOARD_SCHEMA = `You are a data analytics agent for Kept.ai, a returns prevention platform. Your job is to analyze raw e-commerce data and produce a structured JSON dashboard.

Given the uploaded data, you must produce a JSON object with this exact structure:

{
  "name": "Company Name",
  "initials": "XX",
  "industry": "Industry Category",
  "datasets": {
    "7D": [{ "label": "Day Label", "orders": number, "returns": number, "prevented": number, "returnRate": number }],
    "30D": [same structure, ~15 data points],
    "3M": [same structure, ~12 weekly points],
    "1Y": [same structure, ~12 monthly points],
    "ALL": [same structure, ~6-9 quarterly points]
  },
  "reasonsData": [
    { "name": "Reason Name", "pct": number, "count": number, "color": "hex color" }
  ],
  "products": [
    {
      "id": "sku-lowercase",
      "emoji": "HTML entity for relevant emoji",
      "name": "Product Name",
      "cat": "Category",
      "sku": "SKU-CODE",
      "price": number,
      "sold": number,
      "returned": number,
      "returnRate": number,
      "topReason": "Main Return Reason",
      "reasonPct": number,
      "returnCost": number,
      "risk": "critical" or "high"
    }
  ],
  "aiInsights": {
    "product-id": {
      "product": "Product Name — SKU",
      "summary": "2-3 sentence analysis of why this product has high returns, citing specific data patterns.",
      "actions": [
        {
          "priority": "high" or "medium" or "low",
          "text": "Specific actionable recommendation.",
          "impact": "Est. -X% return rate → saves ~$Y/quarter"
        }
      ]
    }
  }
}

IMPORTANT RULES:
1. Use these exact colors for reasonsData in order: "#073159", "#2E9CDB", "#3B4A6B", "#5BB8E8", "#A0AEC0", "#CBD5E0"
2. The "prevented" field should start at 0 for older data and increase for recent months (simulating Kept.ai being deployed).
3. returnRate should show a downward trend in recent periods (showing Kept.ai's impact).
4. Pick the top 4 highest-return-rate products for the products array.
5. Generate 2-3 specific, actionable recommendations per product in aiInsights.
6. If the data doesn't contain certain fields, infer reasonable values from what's available.
7. Return reasons should have percentages that sum to 100.
8. The "prevented" counts in the chart data represent returns that Kept.ai prevented — they should be 0 before Kept.ai was deployed and grow after.
9. For the ALL dataset, add a tag "Kept starts" to the quarter when prevented first becomes > 0.
10. For the 1Y dataset, add a tag "Kept starts" to the month when prevented first becomes > 0.
11. Always return ONLY valid JSON, no markdown, no explanation.`;

// --- Process endpoint ---
app.post('/api/process', upload.array('files', 10), async (req, res) => {
  try {
    const { companyName, industry } = req.body;
    const files = req.files;

    if (!companyName) {
      return res.status(400).json({ error: 'Company name is required.' });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one file is required.' });
    }

    // Read file contents
    const fileContents = files.map(f => {
      const ext = path.extname(f.originalname).toLowerCase();
      let content = f.buffer.toString('utf-8');

      // Truncate very large files to stay within token limits
      if (content.length > 100000) {
        content = content.substring(0, 100000) + '\n... [truncated, showing first 100K characters]';
      }

      return {
        filename: f.originalname,
        type: ext,
        content: content
      };
    });

    // Build the prompt
    const fileDescriptions = fileContents.map(f =>
      `--- FILE: ${f.filename} (${f.type}) ---\n${f.content}\n--- END FILE ---`
    ).join('\n\n');

    const userPrompt = `Analyze the following e-commerce data for "${companyName}" (industry: ${industry || 'unknown'}) and generate a complete dashboard JSON.

${fileDescriptions}

Analyze this data carefully:
- Identify order/sales data, return data, product information, and return reasons
- If the data has dates, use them to build the time-series datasets (7D, 30D, 3M, 1Y, ALL)
- If return reasons are present, use actual reasons; otherwise infer likely reasons based on the industry
- Calculate return rates, identify the highest-risk products, and generate AI insights with specific recommendations
- Make the "prevented" numbers realistic — they should be 0 for historical data and start appearing in recent months

Return ONLY the JSON object, nothing else.`;

    console.log(`[${new Date().toISOString()}] Processing ${files.length} file(s) for "${companyName}"...`);

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: DASHBOARD_SCHEMA,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    });

    // Extract the response text
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Parse the JSON response
    let dashboardData;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      dashboardData = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('Failed to parse Claude response as JSON:', parseErr.message);
      console.error('Raw response:', responseText.substring(0, 500));
      return res.status(500).json({
        error: 'AI agent returned invalid data. Please try again.',
        details: parseErr.message
      });
    }

    // Ensure required fields
    if (!dashboardData.name) dashboardData.name = companyName;
    if (!dashboardData.initials) {
      dashboardData.initials = companyName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    }
    if (!dashboardData.industry) dashboardData.industry = industry || 'E-commerce';

    console.log(`[${new Date().toISOString()}] Successfully processed dashboard for "${companyName}"`);

    res.json({
      success: true,
      company: dashboardData
    });

  } catch (err) {
    console.error('Processing error:', err);

    if (err.status === 401) {
      return res.status(500).json({ error: 'API key not configured. Set ANTHROPIC_API_KEY environment variable.' });
    }

    res.status(500).json({
      error: 'Failed to process data. ' + (err.message || 'Unknown error.'),
    });
  }
});

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Kept.ai server running at http://localhost:${PORT}`);
  console.log(`API key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});
