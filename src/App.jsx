import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const T = {
  accent: "#e8edf3", accentGlow: "rgba(232,237,243,0.25)", accentSubtle: "rgba(232,237,243,0.07)",
  neon: "#f0f4f8", bg: "#020204", bgCard: "rgba(10,10,16,0.75)",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.15)",
  text: "#f0f2f5", textMuted: "rgba(200,205,215,0.55)", textDim: "rgba(160,168,180,0.35)",
  green: "#4ade80", red: "#fb7185", amber: "#fbbf24", cyan: "#67e8f9",
  purple: "#c084fc", pink: "#f472b6",
  mono: "'Montserrat', sans-serif", sans: "'Montserrat', sans-serif",
};

function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); let w = c.width = window.innerWidth, h = c.height = window.innerHeight;
    const stars = Array.from({ length: 220 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.5 + 0.1, sp: Math.random() * 0.0005 + 0.0002, ph: Math.random() * Math.PI * 2 }));
    let raf; const draw = (t) => { ctx.clearRect(0, 0, w, h); stars.forEach(s => { const tw = Math.sin(t * s.sp * 60 + s.ph) * 0.35 + 0.65; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fillStyle = `rgba(220,225,240,${s.a * tw})`; ctx.fill(); }); raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw);
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", resize); return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []); return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

const sGet = async (k, fb) => { try { const r = await window.storage.get("ryzn_" + k); return r ? JSON.parse(r.value) : fb; } catch { return fb; } };
const sSet = async (k, v) => { try { await window.storage.set("ryzn_" + k, JSON.stringify(v)); } catch {} };
const pct = (n) => n == null ? "-" : (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

function ValuationGauge({ value, size = 160, label }) {
  const v = Math.min(Math.max(value, 0), 100);
  const r = size * 0.4, cx = size / 2, cy = size / 2 + 8;
  const sa = Math.PI * 0.8, ea = Math.PI * 0.2 + Math.PI, va = sa + (v / 100) * (ea - sa);
  const arc = (s, e) => { const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s), x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e); return `M ${x1} ${y1} A ${r} ${r} 0 ${e - s > Math.PI ? 1 : 0} 1 ${x2} ${y2}`; };
  const col = v >= 66 ? T.green : v >= 33 ? T.amber : T.red;
  const txt = v >= 66 ? "Undervalued" : v >= 33 ? "Fair Value" : "Overvalued";
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}><path d={arc(sa, ea)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={6} strokeLinecap="round" /><path d={arc(sa, va)} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${col}40)` }} /><text x={cx} y={cy - 6} textAnchor="middle" fill={col} fontSize={size * 0.16} fontWeight="800" fontFamily={T.mono}>{Math.round(v)}</text><text x={cx} y={cy + 10} textAnchor="middle" fill={T.textMuted} fontSize={size * 0.065} fontFamily={T.mono} fontWeight="600">{txt}</text>{label && <text x={cx} y={cy + 22} textAnchor="middle" fill={T.textDim} fontSize={size * 0.055} fontFamily={T.mono}>{label}</text>}</svg>);
}

// ═══════════════════════════════════════════════════
// GUIDANCE PANEL — collapsible info box per tab
// ═══════════════════════════════════════════════════
function GuidancePanel({ title, items, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 20, borderRadius: 12, border: `1px solid ${T.border}`, background: "rgba(103,232,249,0.02)", overflow: "hidden" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", color: T.cyan, cursor: "pointer", fontFamily: T.mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
        <span>{"\u2139\uFE0F"} {title}</span><span style={{ fontSize: 12 }}>{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open && (
        <div style={{ padding: "0 16px 14px", display: "grid", gap: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.015)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 3 }}>{item.term}</div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>{item.def}</div>
              {item.range && <div style={{ fontSize: 9, color: T.cyan, marginTop: 3 }}>{item.range}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DCF_GUIDANCE = [
  { term: "Revenue Growth (%)", def: "Year-over-year top-line growth rate. Use TTM (trailing twelve months) as your starting point, then project forward.", range: "Tech: 10–30% | Healthcare: 5–15% | Consumer Staples: 2–6% | Industrials: 3–8%" },
  { term: "Growth Decay (%/yr)", def: "How quickly the revenue growth rate fades each year toward maturity. Higher decay = more conservative. A 5% decay on 20% growth means Y1=20%, Y2=19%, Y3=18%...", range: "Typical: 3–10%/yr. Mature companies: 0–3%. Hyper-growth: 5–15%" },
  { term: "Operating Margin (%)", def: "EBIT as a percentage of revenue. Measures core profitability before interest and taxes.", range: "Software/SaaS: 25–45% | Pharma: 20–35% | Retail: 3–8% | Banks: 30–40% | Industrials: 8–15%" },
  { term: "Tax Rate (%)", def: "Effective corporate tax rate applied to EBIT to get NOPAT.", range: "US statutory: 21% | Effective avg: 15–25% | International cos: 10–22%" },
  { term: "D&A (% of Revenue)", def: "Depreciation & Amortization as a % of revenue. Added back to NOPAT since it's a non-cash charge.", range: "Asset-light (SaaS): 2–5% | Asset-heavy (Mfg, Telecom): 8–15% | Avg: 4–7%" },
  { term: "CapEx (% of Revenue)", def: "Capital Expenditures as a % of revenue. Subtracted from NOPAT. Should generally be ≥ D&A for growing companies.", range: "Tech: 3–8% | Telecom: 12–20% | Retail: 3–6% | Oil & Gas: 10–25%" },
  { term: "NWC (% of ΔRevenue)", def: "Net Working Capital change as a % of revenue increase. Represents cash tied up in operations (receivables, inventory minus payables).", range: "Typical: 1–5%. Capital-light businesses: 0–2%. Manufacturing: 5–15%" },
  { term: "WACC (%)", def: "Weighted Average Cost of Capital — the blended discount rate reflecting the cost of equity and after-tax cost of debt.", range: "Large-cap stable: 7–9% | Mid-cap: 9–12% | Small/high-risk: 12–18% | Emerging mkts: add 2–5%" },
  { term: "Terminal Growth (%)", def: "Perpetual growth rate of FCF beyond the projection period. Should not exceed long-term GDP growth.", range: "Conservative: 2–2.5% | Moderate: 2.5–3% | Must always be < WACC" },
  { term: "Net Debt ($M)", def: "Total debt minus cash & equivalents. Subtracted from Enterprise Value to get Equity Value. Negative = the company has more cash than debt (net cash).", range: "Varies widely. Tech giants often net-cash. Utilities/REITs typically high net debt." },
  { term: "Margin of Safety (%)", def: "A haircut applied to the calculated fair value to account for model uncertainty. Buffett-style conservatism.", range: "Conservative: 20–30% | Moderate: 10–20% | Aggressive: 0–10%" },
];

const MC_GUIDANCE = [
  { term: "Monte Carlo Simulation", def: "Runs thousands of DCF valuations, each with slightly randomized inputs drawn from a normal distribution around your base case. The result is a probability distribution of fair values rather than a single point estimate." },
  { term: "Standard Deviation (σ)", def: "Controls how wide the randomized range is for each input. A σ of 3% on 10% revenue growth means ~68% of simulations will use 7–13% growth, and ~95% will use 4–16%.", range: "Start with σ = 2–5% for most inputs. Use wider σ for more uncertain assumptions." },
  { term: "P10 / P90", def: "The 10th and 90th percentile outcomes. P10 is your bear case (only 10% of simulations were worse). P90 is your bull case." },
  { term: "Probability Above Current Price", def: "The percentage of all simulations where the fair value exceeded today's market price. >70% suggests the stock is likely undervalued." },
  { term: "Iterations", def: "More iterations = smoother distribution but takes longer. 5,000 is a good balance. 10,000 for publication-quality results.", range: "Minimum useful: 1,000 | Standard: 5,000 | High-precision: 10,000" },
];

const COMPS_GUIDANCE = [
  { term: "EV/EBITDA", def: "Enterprise Value ÷ EBITDA. The most widely used valuation multiple — capital-structure neutral and ignores non-cash charges.", range: "Tech: 15–30x | Healthcare: 12–20x | Financials: 8–12x | Industrials: 8–14x | Consumer: 10–16x" },
  { term: "EV/Revenue", def: "Enterprise Value ÷ Revenue. Useful for unprofitable or high-growth companies where earnings multiples aren't meaningful.", range: "SaaS: 5–15x | Biotech (pre-revenue): 10–50x | Retail: 0.5–2x | Industrials: 1–3x" },
  { term: "P/E (Price-to-Earnings)", def: "Share price ÷ EPS. The most common equity multiple but affected by capital structure and accounting choices.", range: "S&P 500 avg: 18–22x | Growth: 25–50x | Value: 8–15x | Cyclicals: varies wildly" },
  { term: "P/FCF (Price-to-FCF)", def: "Market cap ÷ Free Cash Flow. More reliable than P/E because FCF is harder to manipulate.", range: "Healthy range: 15–25x | Undervalued: <15x | Premium growth: 30–60x" },
  { term: "Football Field Chart", def: "A visual comparison showing the implied valuation range from each method (DCF, each multiple) on the same scale. Where ranges overlap = higher conviction zone." },
  { term: "How to pick comps", def: "Choose 3–5 companies in the same industry with similar size, growth profile, margins, and risk. Avoid outliers. Use the median (not average) to reduce skew from extreme values." },
];

const HEALTH_GUIDANCE = [
  { term: "Current Ratio", def: "Current Assets ÷ Current Liabilities. Measures short-term liquidity — can the company pay bills due within 1 year?", range: "Healthy: >1.5 | Adequate: 1.0–1.5 | Distressed: <1.0" },
  { term: "Quick Ratio", def: "(Current Assets − Inventory) ÷ Current Liabilities. Stricter than current ratio — excludes inventory which may be hard to liquidate.", range: "Healthy: >1.0 | Banks/Retail: often lower is OK" },
  { term: "Debt-to-Equity", def: "Total Debt ÷ Shareholders' Equity. Measures financial leverage.", range: "Conservative: <0.5 | Moderate: 0.5–1.5 | Aggressive: >2.0 | REITs/Utilities: higher is normal" },
  { term: "Interest Coverage", def: "EBIT ÷ Interest Expense. How many times can the company cover its interest payments?", range: "Strong: >5x | Adequate: 3–5x | Risky: <2x" },
  { term: "Net Debt/EBITDA", def: "Net Debt ÷ EBITDA. A leverage metric used by credit analysts and banks.", range: "Investment grade: <3x | Leveraged: 3–5x | Distressed: >6x" },
  { term: "ROE (Return on Equity)", def: "Net Income ÷ Equity. Measures how efficiently the company generates profit from shareholders' capital.", range: "Excellent: >20% | Good: 12–20% | Below avg: <10%" },
  { term: "ROIC (Return on Invested Capital)", def: "NOPAT ÷ Invested Capital. The single best profitability metric — measures return on all capital (debt + equity).", range: "Value-creating: >WACC | Excellent: >15% | Avg: 8–12%" },
  { term: "DuPont Decomposition", def: "Breaks ROE into three drivers: Net Margin × Asset Turnover × Financial Leverage. Reveals whether ROE comes from profitability, efficiency, or debt." },
  { term: "Gross Margin", def: "(Revenue − COGS) ÷ Revenue. Measures pricing power and cost efficiency at the product level.", range: "Software: 60–90% | Pharma: 60–80% | Retail: 25–40% | Hardware: 30–50%" },
];

const SCENARIO_GUIDANCE = [
  { term: "Bear / Base / Bull Cases", def: "Standard practice is to model three scenarios: Bear (pessimistic — growth disappoints, margins compress), Base (most likely outcome), and Bull (optimistic — growth accelerates, margins expand)." },
  { term: "How to set scenarios", def: "Start with your Base case. For Bear, reduce growth by 30–50% and widen WACC by 1–2%. For Bull, increase growth by 20–30% and tighten WACC by 0.5–1%. Adjust margins accordingly." },
  { term: "Probability weighting", def: "Many analysts assign probabilities: e.g. Bear 25%, Base 50%, Bull 25%. You can approximate this in the Blended Value tab using custom weights." },
];

const BLENDED_GUIDANCE = [
  { term: "Blended / Weighted Valuation", def: "Combines multiple valuation methods into a single fair value by assigning a weight (importance) to each approach. Reduces the risk of relying on any single method." },
  { term: "Recommended Weights", def: "For mature, profitable companies: DCF 50%, Comps 30%, Other 20%. For pre-profit growth: Comps 50%, DCF 30%, Other 20%. For stable dividend payers: GGM 40%, DCF 40%, Comps 20%.", range: "Weights should sum to 100%" },
  { term: "GGM (Gordon Growth Model)", def: "Fair Value = D1 ÷ (r − g), where D1 = next year's dividend, r = required return, g = dividend growth rate. Best for stable dividend-paying companies. Enter the result in the custom field." },
  { term: "Price Range Chart", def: "Shows the low–high range implied by each valuation method, and where the current stock price sits. Convergence zones (where multiple methods overlap) indicate higher-conviction fair value ranges." },
];

function StockCard({ stock, onClick }) {
  if (!stock) return null; const c = stock.rating === "BUY" ? T.green : stock.rating === "HOLD" ? T.amber : T.red;
  return (<div onClick={onClick} style={{ padding: 20, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}><div><div style={{ fontWeight: 800, fontSize: 16, fontFamily: T.mono }}>{stock.ticker}</div><div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{stock.name}</div></div><span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: `${c}10`, color: c, fontFamily: T.mono, height: "fit-content" }}>{stock.rating}</span></div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}><div><div style={{ fontSize: 20, fontWeight: 800, fontFamily: T.mono }}>${(stock.price || 0).toFixed(2)}</div>{stock.sector && <div style={{ fontSize: 10, color: T.textDim, marginTop: 4 }}>{stock.sector}</div>}</div><ValuationGauge value={stock.valuationScore || 50} size={60} /></div>
    {stock.notes && <div style={{ fontSize: 11, color: T.textDim, marginTop: 12, lineHeight: 1.6, borderTop: `1px solid ${T.border}`, paddingTop: 10, whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: 48 }}>{stock.notes}</div>}
  </div>);
}

function StockPreview({ stock, onClose }) {
  if (!stock) return null; const c = stock.rating === "BUY" ? T.green : stock.rating === "HOLD" ? T.amber : T.red;
  return (<div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }} onClick={onClose}><div onClick={e => e.stopPropagation()} style={{ width: "92%", maxWidth: 600, maxHeight: "85vh", overflow: "auto", background: "#0a0a10", borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}><div><div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 24, fontWeight: 800, fontFamily: T.mono }}>{stock.ticker}</span><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: `${c}10`, color: c }}>{stock.rating}</span></div><div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>{stock.name}{stock.sector ? ` | ${stock.sector}` : ""}</div></div><button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: T.textDim, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>{"\u2715"}</button></div>
    <div style={{ fontSize: 32, fontWeight: 800, fontFamily: T.mono, marginBottom: 24 }}>${(stock.price || 0).toFixed(2)}</div>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><ValuationGauge value={stock.valuationScore || 50} size={150} label="Valuation" /></div>
    {stock.notes && <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}><div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 10 }}>ANALYSIS NOTES</div><div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{stock.notes}</div></div>}
  </div></div>);
}

function TH({ cols }) { return <thead><tr>{cols.map(c => <th key={c} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{c}</th>)}</tr></thead>; }

function RenderBlocks({ blocks }) {
  if (!blocks || !blocks.length) return null;
  return blocks.map((b, i) => {
    if (b.type === "heading") return <h3 key={i} style={{ fontSize: 18, fontWeight: 800, marginTop: i > 0 ? 28 : 0, marginBottom: 12, color: T.text }}>{b.content}</h3>;
    if (b.type === "text") return <p key={i} style={{ fontSize: 14, color: T.textMuted, lineHeight: 2, marginBottom: 16, whiteSpace: "pre-wrap" }}>{b.content}</p>;
    if (b.type === "image" && b.url) return <div key={i} style={{ margin: "20px 0", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}><img src={b.url} alt="" style={{ width: "100%", display: "block" }} onError={e => e.target.style.display = "none"} />{b.caption && <div style={{ padding: "8px 12px", fontSize: 11, color: T.textDim, fontStyle: "italic" }}>{b.caption}</div>}</div>;
    return null;
  });
}

// ═══════════════════════════════════════════════════
// DCF ENGINE
// ═══════════════════════════════════════════════════
function runDCF(inp) {
  const { currentPrice, sharesOutM, revenueM, revenueGrowth, revenueGrowthDecay = 5, opMargin, taxRate, daPercent, capexPercent, nwcPercent, wacc, terminalGrowth, projYears, netDebtM = 0, marginOfSafety = 0 } = inp;
  const rev = revenueM * 1e6, sh = sharesOutM * 1e6, nd = netDebtM * 1e6, mos = marginOfSafety / 100, decay = revenueGrowthDecay / 100;
  const proj = []; let pvSum = 0;
  for (let y = 1; y <= projYears; y++) {
    const g = revenueGrowth * Math.pow(1 - decay, y - 1);
    const r = rev * Math.pow(1 + g / 100, y), ebit = r * opMargin / 100, nopat = ebit * (1 - taxRate / 100);
    const da = r * daPercent / 100, cx = r * capexPercent / 100;
    const pr = y === 1 ? rev : rev * Math.pow(1 + (revenueGrowth * Math.pow(1 - decay, y - 2)) / 100, y - 1);
    const nwc = (r - pr) * nwcPercent / 100, fcf = nopat + da - cx - nwc;
    const pv = fcf / Math.pow(1 + wacc / 100, y); pvSum += pv;
    proj.push({ year: y, revenue: r, ebit, nopat, da, capex: cx, nwcChg: nwc, fcf, pvFCF: pv, growth: g });
  }
  const lf = proj[proj.length - 1].fcf, tv = (lf * (1 + terminalGrowth / 100)) / (wacc / 100 - terminalGrowth / 100);
  const pvTV = tv / Math.pow(1 + wacc / 100, projYears), ev = pvSum + pvTV, eq = ev - nd;
  const raw = eq / sh, fair = raw * (1 - mos), low = fair * 0.8, high = raw * 1.2;
  const up = ((fair - currentPrice) / currentPrice) * 100;
  const lebitda = proj[proj.length - 1].ebit + proj[proj.length - 1].da;
  const evEbitda = lebitda > 0 ? ev / lebitda : 0, tvPct = ev > 0 ? (pvTV / ev) * 100 : 0;
  const fcfY = sh > 0 && currentPrice > 0 ? (lf / (sh * currentPrice)) * 100 : 0;
  const gauge = up > 30 ? 90 : up > 15 ? 75 : up > 0 ? 55 : up > -15 ? 35 : 15;
  const sW = [wacc - 2, wacc - 1, wacc, wacc + 1, wacc + 2], sT = [terminalGrowth - 1, terminalGrowth - 0.5, terminalGrowth, terminalGrowth + 0.5, terminalGrowth + 1];
  const sens = sW.map(w => sT.map(tg => { if (w / 100 <= tg / 100) return null; const t2 = (lf * (1 + tg / 100)) / (w / 100 - tg / 100); return (pvSum + t2 / Math.pow(1 + w / 100, projYears) - nd) / sh * (1 - mos); }));
  return { proj, tv, pvTV, pvSum, ev, eq, raw, fair, low, high, up, gauge, evEbitda, tvPct, fcfY, sens, sW, sT, nd };
}

// Format millions display: all values shown as $M
const fmM = (n) => { if (n == null || isNaN(n)) return "-"; const a = Math.abs(n); const s = n < 0 ? "-" : ""; const mVal = a / 1e6; if (mVal >= 1e6) return s + "$" + (mVal / 1e6).toFixed(2) + "T (M)"; if (mVal >= 1e3) return s + "$" + Number(mVal.toFixed(0)).toLocaleString() + "M"; return s + "$" + mVal.toFixed(1) + "M"; };

function randNorm(mu, sigma) { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function runMonteCarlo(baseDcf, ranges, iterations = 5000) {
  const results = [];
  for (let i = 0; i < iterations; i++) {
    const inp = { ...baseDcf };
    inp.revenueGrowth = randNorm(baseDcf.revenueGrowth, ranges.revenueGrowthStd || 3);
    inp.opMargin = Math.max(1, Math.min(60, randNorm(baseDcf.opMargin, ranges.opMarginStd || 3)));
    inp.wacc = Math.max(baseDcf.terminalGrowth + 0.5, randNorm(baseDcf.wacc, ranges.waccStd || 1.5));
    inp.terminalGrowth = randNorm(baseDcf.terminalGrowth, ranges.termGrowthStd || 0.5);
    inp.wacc = Math.max(inp.terminalGrowth + 0.5, inp.wacc);
    try { const r = runDCF(inp); if (isFinite(r.fair) && r.fair > 0 && r.fair < baseDcf.currentPrice * 10) results.push(r.fair); } catch {}
  }
  results.sort((a, b) => a - b);
  const p = (pctile) => results[Math.floor(results.length * pctile / 100)] || 0;
  const bins = 30, mn = results[0], mx = results[results.length - 1], bw = (mx - mn) / bins;
  const hist = Array.from({ length: bins }, (_, i) => ({ lo: mn + i * bw, hi: mn + (i + 1) * bw, count: 0 }));
  results.forEach(v => { const bi = Math.min(bins - 1, Math.floor((v - mn) / bw)); hist[bi].count++; });
  return { results, count: results.length, mean: results.reduce((a, b) => a + b, 0) / results.length, median: p(50), p10: p(10), p25: p(25), p75: p(75), p90: p(90), min: mn, max: mx, hist, maxC: Math.max(...hist.map(h => h.count)) };
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false); const [adminPass, setAdminPass] = useState(""); const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [notif, setNotif] = useState(null); const [mounted, setMounted] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null); const [adminTab, setAdminTab] = useState("picks");
  const [ready, setReady] = useState(false);
  const [stockPicks, setStockPicks] = useState([]); const [caseStudies, setCaseStudies] = useState([]);

  const [pT, setPT] = useState(""); const [pN, setPN] = useState(""); const [pP, setPP] = useState(""); const [pSe, setPSe] = useState(""); const [pSc, setPSc] = useState(50); const [pR, setPR] = useState("HOLD"); const [pNo, setPNo] = useState(""); const [editP, setEditP] = useState(null);
  const [csTitle, setCsTitle] = useState(""); const [csSummary, setCsSummary] = useState(""); const [csCat, setCsCat] = useState("Analysis"); const [csCover, setCsCover] = useState(""); const [csBlocks, setCsBlocks] = useState([]); const [editCS, setEditCS] = useState(null);
  const [valTab, setValTab] = useState("dcf");

  const [dcf, setDcf] = useState({ ticker: "", currentPrice: 0, sharesOutM: 0, revenueM: 0, revenueGrowth: 10, revenueGrowthDecay: 5, opMargin: 25, taxRate: 21, daPercent: 5, capexPercent: 4, nwcPercent: 2, wacc: 10, terminalGrowth: 3, projYears: 5, netDebtM: 0, marginOfSafety: 15 });
  const [dcfRes, setDcfRes] = useState(null); const [showRpt, setShowRpt] = useState(false);
  const [wCalc, setWCalc] = useState({ rf: 4.5, beta: 1.0, erp: 5.5, kd: 5.0, taxW: 21, dPct: 30 }); const [showWCalc, setShowWCalc] = useState(false);
  const [mcRanges, setMcRanges] = useState({ revenueGrowthStd: 3, opMarginStd: 3, waccStd: 1.5, termGrowthStd: 0.5, iterations: 5000 });
  const [mcRes, setMcRes] = useState(null); const [mcRunning, setMcRunning] = useState(false);
  const [comps, setComps] = useState([{ name: "", evEbitda: "", evRev: "", pe: "", pFcf: "" }]);
  const [subjectFin, setSubjectFin] = useState({ ebitdaM: 0, revenueM: 0, netIncomeM: 0, fcfM: 0 });
  const [fh, setFh] = useState({ totalAssets: 0, totalLiab: 0, equity: 0, currentAssets: 0, currentLiab: 0, cash: 0, inventory: 0, revenue: 0, cogs: 0, netIncome: 0, interestExp: 0, ebit: 0, totalDebt: 0, investedCapital: 0 });
  const [scenarios, setScenarios] = useState([]); const [scenName, setScenName] = useState("");
  const [blend, setBlend] = useState({ dcfWeight: 50, compsWeight: 30, customWeight: 20, customVal: 0, customLabel: "GGM / Other" });
  const [selCS, setSelCS] = useState(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { (async () => { const [sp, cs, sc] = await Promise.all([sGet("stockPicks", []), sGet("caseStudies", []), sGet("scenarios", [])]); setStockPicks(sp); setCaseStudies(cs); setScenarios(sc); setReady(true); })(); }, []);
  useEffect(() => { if (ready) sSet("stockPicks", stockPicks); }, [stockPicks, ready]);
  useEffect(() => { if (ready) sSet("caseStudies", caseStudies); }, [caseStudies, ready]);
  useEffect(() => { if (ready) sSet("scenarios", scenarios); }, [scenarios, ready]);

  const notify = (m, t = "success") => { setNotif({ m, t }); setTimeout(() => setNotif(null), 3000); };
  const setDF = (k, v) => setDcf(p => ({ ...p, [k]: v }));

  const addPick = () => { if (!pT) return; const pk = { id: editP || Date.now(), ticker: pT.toUpperCase(), name: pN || pT.toUpperCase(), price: +pP || 0, sector: pSe, valuationScore: +pSc, rating: pR, notes: pNo, published: true, dateAdded: new Date().toISOString().split("T")[0] }; if (editP) { setStockPicks(p => p.map(x => x.id === editP ? pk : x)); notify("Updated"); } else { setStockPicks(p => [pk, ...p]); notify("Added"); } clearPF(); };
  const clearPF = () => { setPT(""); setPN(""); setPP(""); setPSe(""); setPSc(50); setPR("HOLD"); setPNo(""); setEditP(null); };
  const epk = (s) => { setPT(s.ticker); setPN(s.name); setPP(s.price.toString()); setPSe(s.sector); setPSc(s.valuationScore); setPR(s.rating); setPNo(s.notes); setEditP(s.id); };

  const addCS = () => { if (!csTitle) return; const cs = { id: editCS || Date.now(), title: csTitle, summary: csSummary, blocks: csBlocks, category: csCat, coverImage: csCover, published: true, date: new Date().toISOString().split("T")[0] }; if (editCS) { setCaseStudies(p => p.map(x => x.id === editCS ? cs : x)); notify("Updated"); } else { setCaseStudies(p => [cs, ...p]); notify("Published"); } clearCSF(); };
  const clearCSF = () => { setCsTitle(""); setCsSummary(""); setCsCat("Analysis"); setCsCover(""); setCsBlocks([]); setEditCS(null); };
  const ecsF = (cs) => { setCsTitle(cs.title); setCsSummary(cs.summary); setCsCat(cs.category || "Analysis"); setCsCover(cs.coverImage || ""); setCsBlocks(cs.blocks || []); setEditCS(cs.id); setAdminTab("casestudies"); };
  const addBlock = (type) => setCsBlocks(p => [...p, { type, content: "", url: "", caption: "" }]);
  const updBlock = (i, f, v) => setCsBlocks(p => p.map((b, j) => j === i ? { ...b, [f]: v } : b));
  const rmBlock = (i) => setCsBlocks(p => p.filter((_, j) => j !== i));
  const moveBlock = (i, d) => setCsBlocks(p => { const a = [...p]; const n = i + d; if (n < 0 || n >= a.length) return a; [a[i], a[n]] = [a[n], a[i]]; return a; });
  const loadTemplate = () => { setCsBlocks([{ type: "heading", content: "Executive Summary" }, { type: "text", content: "" }, { type: "heading", content: "Investment Thesis" }, { type: "text", content: "" }, { type: "image", url: "", caption: "" }, { type: "heading", content: "Financial Analysis" }, { type: "text", content: "" }, { type: "heading", content: "Risks & Considerations" }, { type: "text", content: "" }, { type: "heading", content: "Conclusion" }, { type: "text", content: "" }]); notify("Template loaded"); };

  const runDCFCalc = () => { if (dcf.currentPrice <= 0 || dcf.sharesOutM <= 0 || dcf.revenueM <= 0) { notify("Fill required: Price, Shares ($M), Revenue ($M)", "error"); return; } if (dcf.wacc <= dcf.terminalGrowth) { notify("WACC must > Terminal Growth", "error"); return; } setDcfRes(runDCF(dcf)); };
  const calcWACC = () => { const ke = wCalc.rf + wCalc.beta * wCalc.erp; const w = ((100 - wCalc.dPct) / 100) * ke + (wCalc.dPct / 100) * wCalc.kd * (1 - wCalc.taxW / 100); setDF("wacc", Math.round(w * 100) / 100); notify(`WACC: ${w.toFixed(2)}%`); setShowWCalc(false); };
  const runMC = () => { if (!dcfRes) { notify("Run DCF first", "error"); return; } setMcRunning(true); setTimeout(() => { setMcRes(runMonteCarlo(dcf, mcRanges, mcRanges.iterations)); setMcRunning(false); notify("Simulation complete"); }, 50); };

  const compStats = useMemo(() => {
    const valid = comps.filter(c => c.name); if (valid.length === 0 || !subjectFin.ebitdaM) return null;
    const metrics = ["evEbitda", "evRev", "pe", "pFcf"], labels = ["EV/EBITDA", "EV/Revenue", "P/E", "P/FCF"];
    const subVals = [subjectFin.ebitdaM, subjectFin.revenueM, subjectFin.netIncomeM, subjectFin.fcfM];
    return metrics.map((m, idx) => { const vals = valid.map(c => +c[m]).filter(v => v > 0); if (!vals.length) return null; const med = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)]; const sv = subVals[idx] * 1e6; const implied = m.startsWith("ev") ? (med * sv - (dcf.netDebtM || 0) * 1e6) / (dcf.sharesOutM * 1e6) : med * sv / (dcf.sharesOutM * 1e6); return { label: labels[idx], median: med, implied, count: vals.length }; }).filter(Boolean);
  }, [comps, subjectFin, dcf.netDebtM, dcf.sharesOutM]);

  const fhRatios = useMemo(() => {
    const r = [];
    if (fh.currentLiab > 0) { r.push({ name: "Current Ratio", value: (fh.currentAssets / fh.currentLiab).toFixed(2), cat: "Liquidity", good: fh.currentAssets / fh.currentLiab >= 1.5 }); r.push({ name: "Quick Ratio", value: ((fh.currentAssets - fh.inventory) / fh.currentLiab).toFixed(2), cat: "Liquidity", good: (fh.currentAssets - fh.inventory) / fh.currentLiab >= 1 }); }
    if (fh.equity > 0) r.push({ name: "Debt-to-Equity", value: (fh.totalDebt / fh.equity).toFixed(2), cat: "Leverage", good: fh.totalDebt / fh.equity < 1.5 });
    if (fh.totalAssets > 0) r.push({ name: "Debt-to-Assets", value: (fh.totalDebt / fh.totalAssets).toFixed(2), cat: "Leverage", good: fh.totalDebt / fh.totalAssets < 0.5 });
    if (fh.interestExp > 0) r.push({ name: "Interest Coverage", value: (fh.ebit / fh.interestExp).toFixed(1) + "x", cat: "Leverage", good: fh.ebit / fh.interestExp >= 3 });
    if (fh.totalDebt > 0 && fh.ebit > 0) r.push({ name: "Net Debt/EBITDA", value: ((fh.totalDebt - fh.cash) / (fh.ebit * 1.1)).toFixed(1) + "x", cat: "Leverage", good: (fh.totalDebt - fh.cash) / (fh.ebit * 1.1) < 3 });
    if (fh.revenue > 0) { r.push({ name: "Gross Margin", value: (((fh.revenue - fh.cogs) / fh.revenue) * 100).toFixed(1) + "%", cat: "Profitability", good: (fh.revenue - fh.cogs) / fh.revenue > 0.3 }); r.push({ name: "Net Margin", value: ((fh.netIncome / fh.revenue) * 100).toFixed(1) + "%", cat: "Profitability", good: fh.netIncome / fh.revenue > 0.1 }); }
    if (fh.equity > 0) r.push({ name: "ROE", value: ((fh.netIncome / fh.equity) * 100).toFixed(1) + "%", cat: "Profitability", good: fh.netIncome / fh.equity > 0.12 });
    if (fh.totalAssets > 0) r.push({ name: "ROA", value: ((fh.netIncome / fh.totalAssets) * 100).toFixed(1) + "%", cat: "Profitability", good: fh.netIncome / fh.totalAssets > 0.05 });
    if (fh.investedCapital > 0) r.push({ name: "ROIC", value: ((fh.ebit * 0.79 / fh.investedCapital) * 100).toFixed(1) + "%", cat: "Efficiency", good: fh.ebit * 0.79 / fh.investedCapital > 0.1 });
    if (fh.totalAssets > 0 && fh.revenue > 0) r.push({ name: "Asset Turnover", value: (fh.revenue / fh.totalAssets).toFixed(2) + "x", cat: "Efficiency", good: fh.revenue / fh.totalAssets > 0.5 });
    if (fh.equity > 0 && fh.revenue > 0 && fh.totalAssets > 0) { const m = fh.netIncome / fh.revenue, t = fh.revenue / fh.totalAssets, l = fh.totalAssets / fh.equity; r.push({ name: "DuPont ROE", value: ((m * t * l) * 100).toFixed(1) + "%", cat: "DuPont", good: m * t * l > 0.12, detail: `${(m * 100).toFixed(1)}% × ${t.toFixed(2)}x × ${l.toFixed(2)}x` }); }
    return r;
  }, [fh]);

  const blendedVal = useMemo(() => {
    const dcfVal = dcfRes?.fair || 0, compsVal = compStats?.length > 0 ? compStats.reduce((s, c) => s + c.implied, 0) / compStats.length : 0;
    const tw = blend.dcfWeight + blend.compsWeight + blend.customWeight;
    if (tw === 0) return null;
    return { dcfVal, compsVal, customVal: blend.customVal || 0, weighted: (dcfVal * blend.dcfWeight + compsVal * blend.compsWeight + (blend.customVal || 0) * blend.customWeight) / tw, tw, dcfLow: dcfRes?.low || 0, dcfHigh: dcfRes?.high || 0 };
  }, [dcfRes, compStats, blend]);

  const pubPicks = stockPicks.filter(s => s.published), pubCS = caseStudies.filter(c => c.published);
  const iS = { padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.03)", color: T.text, fontSize: 13, fontFamily: T.mono, outline: "none", width: "100%" };
  const bS = (c = T.accent) => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: `${c}15`, color: c, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.mono });
  const cardS = { padding: 20, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}` };
  const secH = (t) => <div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 10 }}>{t}</div>;

  const navItems = [{ id: "home", label: "Home" }, { id: "casestudies", label: "Case Studies" }, { id: "picks", label: "Stock Picks" }, { id: "valuation", label: "AI-Powered Valuation" }];
  const valTabs = [{ id: "dcf", label: "DCF Model" }, { id: "mc", label: "Monte Carlo" }, { id: "comps", label: "Comps" }, { id: "health", label: "Ratios" }, { id: "scenarios", label: "Scenarios" }, { id: "blended", label: "Blended" }];

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: T.bg, color: T.text, fontFamily: T.sans, position: "relative", overflowX: "hidden" }}>
      <Starfield />
      {notif && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: notif.t === "error" ? `${T.red}20` : `${T.green}20`, border: `1px solid ${notif.t === "error" ? T.red : T.green}30`, color: notif.t === "error" ? T.red : T.green, fontSize: 12, fontWeight: 600, fontFamily: T.mono, maxWidth: "90vw" }}>{notif.m}</div>}

      <nav className="ryzn-nav">
        <div style={{ cursor: "pointer", flexShrink: 0 }} onClick={() => { setPage("home"); setSelCS(null); }}><span className="ryzn-logo-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>ryzn<span style={{ fontWeight: 400, color: T.textDim }}>.io</span></span></div>
        <div className="ryzn-nav-links">{navItems.map(n => <button key={n.id} onClick={() => { setPage(n.id); setSelCS(null); }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: page === n.id ? T.accentSubtle : "transparent", color: page === n.id ? T.accent : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.mono, whiteSpace: "nowrap" }}>{n.label}</button>)}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isAdmin ? <div style={{ display: "flex", gap: 6 }}><button onClick={() => setPage("admin")} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.amber}20`, background: page === "admin" ? `${T.amber}08` : "transparent", color: T.amber, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>ADMIN</button><button onClick={() => { setIsAdmin(false); setPage("home"); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>Logout</button></div>
          : <div style={{ position: "relative" }}><button onClick={() => setShowAdminLogin(!showAdminLogin)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Admin</button>{showAdminLogin && <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, padding: 12, borderRadius: 8, background: "#0a0a10", border: `1px solid ${T.border}`, display: "flex", gap: 6, zIndex: 100 }}><input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Password" onKeyDown={e => { if (e.key === "Enter") { if (adminPass === "RVNCP24!") { setIsAdmin(true); setShowAdminLogin(false); setAdminPass(""); notify("Admin granted"); setPage("admin"); } else notify("Wrong", "error"); }}} style={{ ...iS, width: 120, padding: "6px 10px" }} /><button onClick={() => { if (adminPass === "RVNCP24!") { setIsAdmin(true); setShowAdminLogin(false); setAdminPass(""); setPage("admin"); } else notify("Wrong", "error"); }} style={bS()}>{"\u2192"}</button></div>}</div>}
        </div>
      </nav>

      <div className="ryzn-content">
        {/* HOME */}
        {page === "home" && <div style={{ animation: mounted ? "slideIn 0.5s ease" : "none" }}>
          <div style={{ textAlign: "center", padding: "48px 16px 40px" }}><h1 style={{ fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>ryzn<span style={{ fontWeight: 400, color: T.textDim }}>.io</span></h1><p style={{ fontSize: 14, color: T.textDim, maxWidth: 520, margin: "0 auto", lineHeight: 1.8 }}>AI-powered stock analysis with curated picks, institutional-grade valuation tools, and in-depth case studies.</p></div>
          <div className="ryzn-home-grid" style={{ display: "grid", gap: 16, maxWidth: 900, margin: "0 auto 40px" }}>{[["Case Study Library", "Research articles and investment case studies.", "\u25A3", "casestudies"], ["Top Stock Picks", "Curated picks with valuation analysis.", "\u25C8", "picks"], ["AI-Powered Valuation", "DCF, Monte Carlo, comps, ratios, scenarios & blended value.", "\u25CE", "valuation"]].map(([t, d, ic, pg]) => <div key={t} onClick={() => setPage(pg)} style={{ padding: 28, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, cursor: "pointer", transition: "border-color 0.3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHover} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}><div style={{ fontSize: 24, marginBottom: 14, opacity: 0.4 }}>{ic}</div><div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t}</div><div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.7 }}>{d}</div></div>)}</div>
          {pubPicks.length > 0 && <div style={{ maxWidth: 900, margin: "0 auto" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}><h2 style={{ fontSize: 18, fontWeight: 800 }}>Featured Picks</h2><button onClick={() => setPage("picks")} style={{ ...bS(), fontSize: 10 }}>View All {"\u2192"}</button></div><div className="ryzn-cards-grid">{pubPicks.slice(0, 3).map(s => <StockCard key={s.id} stock={s} onClick={() => setSelectedStock(s)} />)}</div></div>}
        </div>}

        {/* CASE STUDIES */}
        {page === "casestudies" && !selCS && <div><div style={{ marginBottom: 28 }}><h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>Case Study Library</h1></div>{pubCS.length > 0 ? <div className="ryzn-cards-grid">{pubCS.map(cs => <div key={cs.id} onClick={() => setSelCS(cs)} style={{ borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s", overflow: "hidden" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>{cs.coverImage && <div style={{ height: 160, background: `url(${cs.coverImage}) center/cover`, borderBottom: `1px solid ${T.border}` }} />}<div style={{ padding: 20 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: `${T.cyan}10`, color: T.cyan }}>{cs.category}</span><span style={{ fontSize: 10, color: T.textDim }}>{cs.date}</span></div><div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{cs.title}</div>{cs.summary && <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cs.summary}</div>}</div></div>)}</div> : <div style={{ textAlign: "center", padding: 60, color: T.textDim }}>No articles yet.</div>}</div>}
        {page === "casestudies" && selCS && <div style={{ maxWidth: 720, margin: "0 auto" }}><button onClick={() => setSelCS(null)} style={{ ...bS(T.textMuted), marginBottom: 20 }}>{"\u2190"} Back</button>{selCS.coverImage && <div style={{ height: 240, borderRadius: 14, background: `url(${selCS.coverImage}) center/cover`, marginBottom: 24, border: `1px solid ${T.border}` }} />}<div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: `${T.cyan}10`, color: T.cyan }}>{selCS.category}</span><span style={{ fontSize: 11, color: T.textDim }}>{selCS.date}</span></div><h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>{selCS.title}</h1>{selCS.summary && <div style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.8, marginBottom: 24, fontStyle: "italic", borderLeft: `3px solid ${T.cyan}30`, paddingLeft: 16 }}>{selCS.summary}</div>}<RenderBlocks blocks={selCS.blocks || []} /></div>}

        {page === "picks" && <div><div style={{ marginBottom: 28 }}><h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>Top Stock Picks</h1></div>{pubPicks.length > 0 ? <div className="ryzn-cards-grid">{pubPicks.map(s => <StockCard key={s.id} stock={s} onClick={() => setSelectedStock(s)} />)}</div> : <div style={{ textAlign: "center", padding: 60, color: T.textDim }}>No published picks yet.</div>}</div>}

        {/* ════════ VALUATION ════════ */}
        {page === "valuation" && <div>
          <div style={{ marginBottom: 16 }}><h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>AI-Powered Valuation</h1><p style={{ fontSize: 13, color: T.textDim }}>All dollar inputs in millions ($M). Example: $1B = 1,000.</p></div>
          <div style={{ display: "flex", gap: 3, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>{valTabs.map(vt => <button key={vt.id} onClick={() => setValTab(vt.id)} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: valTab === vt.id ? `${T.cyan}10` : "transparent", color: valTab === vt.id ? T.cyan : T.textMuted, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: T.mono, whiteSpace: "nowrap" }}>{vt.label}</button>)}</div>

          {/* DCF */}
          {valTab === "dcf" && <div>
            <GuidancePanel title="DCF MODEL — DEFINITIONS & INDUSTRY BENCHMARKS" items={DCF_GUIDANCE} />
            <div style={{ display: "grid", gap: 20 }} className="ryzn-dcf-layout">
              <div style={cardS}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.12em", marginBottom: 18 }}>MODEL INPUTS</div>
                {secH("COMPANY")}
                <div className="ig3" style={{ marginBottom: 16 }}><div><div className="lbl">TICKER</div><input value={dcf.ticker} onChange={e => setDF("ticker", e.target.value.toUpperCase())} placeholder="AAPL" style={iS} /></div><div><div className="lbl">CURRENT PRICE ($)</div><input type="number" step="0.01" value={dcf.currentPrice || ""} onChange={e => setDF("currentPrice", +e.target.value)} style={iS} /></div><div><div className="lbl">SHARES OUT ($M)</div><input type="number" value={dcf.sharesOutM || ""} onChange={e => setDF("sharesOutM", +e.target.value)} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>15,000 = 15B shares</div></div></div>
                {secH("INCOME STATEMENT")}
                <div className="ig3" style={{ marginBottom: 16 }}><div><div className="lbl">REVENUE TTM ($M)</div><input type="number" value={dcf.revenueM || ""} onChange={e => setDF("revenueM", +e.target.value)} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>383,000 = $383B</div></div><div><div className="lbl">REV. GROWTH (%)</div><input type="number" step="0.1" value={dcf.revenueGrowth || ""} onChange={e => setDF("revenueGrowth", +e.target.value)} style={iS} /></div><div><div className="lbl">GROWTH DECAY (%/YR)</div><input type="number" step="0.5" value={dcf.revenueGrowthDecay || ""} onChange={e => setDF("revenueGrowthDecay", +e.target.value)} style={iS} /></div></div>
                <div className="ig3" style={{ marginBottom: 16 }}><div><div className="lbl">OP. MARGIN (%)</div><input type="number" step="0.1" value={dcf.opMargin || ""} onChange={e => setDF("opMargin", +e.target.value)} style={iS} /></div><div><div className="lbl">TAX RATE (%)</div><input type="number" step="0.1" value={dcf.taxRate || ""} onChange={e => setDF("taxRate", +e.target.value)} style={iS} /></div><div><div className="lbl">D&A (% OF REV)</div><input type="number" step="0.1" value={dcf.daPercent || ""} onChange={e => setDF("daPercent", +e.target.value)} style={iS} /></div></div>
                {secH("CAPEX & WORKING CAPITAL")}
                <div className="ig3" style={{ marginBottom: 16 }}><div><div className="lbl">CAPEX (% OF REV)</div><input type="number" step="0.1" value={dcf.capexPercent || ""} onChange={e => setDF("capexPercent", +e.target.value)} style={iS} /></div><div><div className="lbl">NWC (% OF ΔRev)</div><input type="number" step="0.1" value={dcf.nwcPercent || ""} onChange={e => setDF("nwcPercent", +e.target.value)} style={iS} /></div><div><div className="lbl">NET DEBT ($M)</div><input type="number" value={dcf.netDebtM || ""} onChange={e => setDF("netDebtM", +e.target.value)} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Negative = net cash</div></div></div>
                {secH("DISCOUNT & TERMINAL")}
                <div className="ig4" style={{ marginBottom: 16 }}><div><div className="lbl">WACC (%)</div><input type="number" step="0.1" value={dcf.wacc || ""} onChange={e => setDF("wacc", +e.target.value)} style={iS} /></div><div><div className="lbl">TERMINAL GROWTH (%)</div><input type="number" step="0.1" value={dcf.terminalGrowth || ""} onChange={e => setDF("terminalGrowth", +e.target.value)} style={iS} /></div><div><div className="lbl">PROJECTION YRS</div><input type="number" min="1" max="20" value={dcf.projYears || ""} onChange={e => setDF("projYears", +e.target.value)} style={iS} /></div><div><div className="lbl">MARGIN OF SAFETY (%)</div><input type="number" step="1" value={dcf.marginOfSafety || ""} onChange={e => setDF("marginOfSafety", +e.target.value)} style={iS} /></div></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}><button onClick={() => setShowWCalc(!showWCalc)} style={{ ...bS(T.amber), background: showWCalc ? `${T.amber}25` : `${T.amber}15` }}>{showWCalc ? "\u25B2" : "\u25BC"} WACC (CAPM)</button></div>
                {showWCalc && <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.amber}20`, marginBottom: 16 }}><div style={{ fontSize: 9, color: T.textDim, marginBottom: 10 }}>Ke = Rf + β × ERP | WACC = (E/V × Ke) + (D/V × Kd × (1−T))</div><div className="ig3" style={{ marginBottom: 10 }}><div><div className="lbl">RISK-FREE (%)</div><input type="number" step="0.1" value={wCalc.rf} onChange={e => setWCalc(p => ({ ...p, rf: +e.target.value }))} style={iS} /></div><div><div className="lbl">BETA</div><input type="number" step="0.01" value={wCalc.beta} onChange={e => setWCalc(p => ({ ...p, beta: +e.target.value }))} style={iS} /></div><div><div className="lbl">ERP (%)</div><input type="number" step="0.1" value={wCalc.erp} onChange={e => setWCalc(p => ({ ...p, erp: +e.target.value }))} style={iS} /></div></div><div className="ig3" style={{ marginBottom: 10 }}><div><div className="lbl">COST OF DEBT (%)</div><input type="number" step="0.1" value={wCalc.kd} onChange={e => setWCalc(p => ({ ...p, kd: +e.target.value }))} style={iS} /></div><div><div className="lbl">TAX (%)</div><input type="number" step="0.1" value={wCalc.taxW} onChange={e => setWCalc(p => ({ ...p, taxW: +e.target.value }))} style={iS} /></div><div><div className="lbl">DEBT WT (%)</div><input type="number" value={wCalc.dPct} onChange={e => setWCalc(p => ({ ...p, dPct: +e.target.value }))} style={iS} /></div></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 11, color: T.amber }}>WACC = {(((100 - wCalc.dPct) / 100) * (wCalc.rf + wCalc.beta * wCalc.erp) + (wCalc.dPct / 100) * wCalc.kd * (1 - wCalc.taxW / 100)).toFixed(2)}%</span><button onClick={calcWACC} style={bS(T.amber)}>Apply</button></div></div>}
                <button onClick={runDCFCalc} style={{ ...bS(T.cyan), padding: "12px 28px", fontSize: 13, fontWeight: 800, width: "100%" }}>Run DCF Valuation</button>
              </div>
              {dcfRes && <div style={cardS}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}><span style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono }}>RESULT {dcf.ticker && `— ${dcf.ticker}`}</span><button onClick={() => setShowRpt(true)} style={bS(T.cyan)}>Full Report</button></div>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><ValuationGauge value={dcfRes.gauge} size={200} label="DCF Score" /></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 16 }}>{[["CURRENT", "$" + dcf.currentPrice.toFixed(2), T.text], ["FAIR VALUE", "$" + dcfRes.fair.toFixed(2), T.cyan], ["UPSIDE", pct(dcfRes.up), dcfRes.up >= 0 ? T.green : T.red], ["EV", fmM(dcfRes.ev), T.text], ["EV/EBITDA", dcfRes.evEbitda.toFixed(1) + "x", T.accent], ["FCF YIELD", dcfRes.fcfY.toFixed(1) + "%", T.cyan]].map(([l, v, c]) => <div key={l} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", textAlign: "center" }}><div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 3 }}>{l}</div><div style={{ fontSize: 16, fontWeight: 800, fontFamily: T.mono, color: c }}>{v}</div></div>)}</div>
                <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}><div style={{ fontSize: 9, fontWeight: 700, color: T.textDim, marginBottom: 10 }}>PRICE RANGE</div><div style={{ position: "relative", height: 36, marginBottom: 6 }}><div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 8, borderRadius: 4, background: `linear-gradient(to right, ${T.red}40, ${T.amber}40, ${T.green}40)` }} />{(() => { const mn = dcfRes.low * 0.8, mx = dcfRes.high * 1.2, rng = mx - mn; const cp = Math.max(0, Math.min(100, ((dcf.currentPrice - mn) / rng) * 100)), fp = Math.max(0, Math.min(100, ((dcfRes.fair - mn) / rng) * 100)); return <><div style={{ position: "absolute", top: 6, left: `${cp}%`, transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: T.text }}>{"\u25BC"}</div><div style={{ position: "absolute", top: 24, left: `${fp}%`, width: 3, height: 8, background: T.cyan, borderRadius: 2, transform: "translateX(-50%)" }} /></>; })()}</div><div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: T.mono }}><span style={{ color: T.red }}>${dcfRes.low.toFixed(2)}</span><span style={{ color: T.cyan }}>Fair: ${dcfRes.fair.toFixed(2)}</span><span style={{ color: T.green }}>${dcfRes.high.toFixed(2)}</span></div></div>
              </div>}
            </div>
          </div>}

          {/* MONTE CARLO */}
          {valTab === "mc" && <div>
            <GuidancePanel title="MONTE CARLO — DEFINITIONS & GUIDANCE" items={MC_GUIDANCE} />
            <div style={cardS}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>SIMULATION PARAMETERS</div>
              <div className="ig4" style={{ marginBottom: 16 }}><div><div className="lbl">REV GROWTH σ (%)</div><input type="number" step="0.5" value={mcRanges.revenueGrowthStd} onChange={e => setMcRanges(p => ({ ...p, revenueGrowthStd: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>±{mcRanges.revenueGrowthStd}% around {dcf.revenueGrowth}%</div></div><div><div className="lbl">OP MARGIN σ (%)</div><input type="number" step="0.5" value={mcRanges.opMarginStd} onChange={e => setMcRanges(p => ({ ...p, opMarginStd: +e.target.value }))} style={iS} /></div><div><div className="lbl">WACC σ (%)</div><input type="number" step="0.1" value={mcRanges.waccStd} onChange={e => setMcRanges(p => ({ ...p, waccStd: +e.target.value }))} style={iS} /></div><div><div className="lbl">TERM GROWTH σ (%)</div><input type="number" step="0.1" value={mcRanges.termGrowthStd} onChange={e => setMcRanges(p => ({ ...p, termGrowthStd: +e.target.value }))} style={iS} /></div></div>
              <div className="ig2" style={{ marginBottom: 16 }}><div><div className="lbl">ITERATIONS</div><select value={mcRanges.iterations} onChange={e => setMcRanges(p => ({ ...p, iterations: +e.target.value }))} style={iS}><option value={1000}>1,000</option><option value={5000}>5,000</option><option value={10000}>10,000</option></select></div></div>
              <button onClick={runMC} disabled={mcRunning} style={{ ...bS(T.purple), padding: "12px 28px", fontSize: 13, fontWeight: 800, width: "100%", opacity: mcRunning ? 0.5 : 1 }}>{mcRunning ? "Running..." : "Run Monte Carlo"}</button>
            </div>
            {mcRes && <div style={{ ...cardS, marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>DISTRIBUTION ({mcRes.count.toLocaleString()} sims)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 8, marginBottom: 20 }}>{[["MEAN", "$" + mcRes.mean.toFixed(2), T.purple], ["MEDIAN", "$" + mcRes.median.toFixed(2), T.cyan], ["P10 (BEAR)", "$" + mcRes.p10.toFixed(2), T.red], ["P25", "$" + mcRes.p25.toFixed(2), T.amber], ["P75", "$" + mcRes.p75.toFixed(2), T.green], ["P90 (BULL)", "$" + mcRes.p90.toFixed(2), T.green]].map(([l, v, c]) => <div key={l} style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", textAlign: "center" }}><div style={{ fontSize: 8, color: T.textDim, fontFamily: T.mono, marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14, fontWeight: 800, color: c, fontFamily: T.mono }}>{v}</div></div>)}</div>
              <div style={{ fontSize: 9, color: T.textDim, marginBottom: 8 }}>FAIR VALUE DISTRIBUTION</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 120, padding: "0 4px" }}>{mcRes.hist.map((h, i) => { const pH = h.count / mcRes.maxC; const inR = dcfRes && h.lo <= dcfRes.fair && h.hi >= dcfRes.fair; return <div key={i} style={{ flex: 1, height: `${pH * 100}%`, minHeight: 1, background: inR ? T.cyan : `${T.purple}60`, borderRadius: "2px 2px 0 0" }} title={`$${h.lo.toFixed(0)}-$${h.hi.toFixed(0)}: ${h.count}`} />; })}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.textDim, fontFamily: T.mono, marginTop: 4 }}><span>${mcRes.min.toFixed(0)}</span><span>${mcRes.max.toFixed(0)}</span></div>
              {dcf.currentPrice > 0 && <div style={{ marginTop: 12, fontSize: 12, color: T.textMuted }}>Prob. above ${dcf.currentPrice.toFixed(2)}: <span style={{ fontWeight: 800, color: T.green }}>{((mcRes.results.filter(v => v > dcf.currentPrice).length / mcRes.count) * 100).toFixed(1)}%</span></div>}
            </div>}
          </div>}

          {/* COMPS */}
          {valTab === "comps" && <div>
            <GuidancePanel title="COMPS & MULTIPLES — DEFINITIONS & INDUSTRY BENCHMARKS" items={COMPS_GUIDANCE} />
            <div style={cardS}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>COMPARABLE COMPANIES</div>
              {secH("SUBJECT COMPANY FINANCIALS ($M)")}
              <div className="ig4" style={{ marginBottom: 16 }}><div><div className="lbl">EBITDA ($M)</div><input type="number" value={subjectFin.ebitdaM || ""} onChange={e => setSubjectFin(p => ({ ...p, ebitdaM: +e.target.value }))} style={iS} /></div><div><div className="lbl">REVENUE ($M)</div><input type="number" value={subjectFin.revenueM || ""} onChange={e => setSubjectFin(p => ({ ...p, revenueM: +e.target.value }))} style={iS} /></div><div><div className="lbl">NET INCOME ($M)</div><input type="number" value={subjectFin.netIncomeM || ""} onChange={e => setSubjectFin(p => ({ ...p, netIncomeM: +e.target.value }))} style={iS} /></div><div><div className="lbl">FCF ($M)</div><input type="number" value={subjectFin.fcfM || ""} onChange={e => setSubjectFin(p => ({ ...p, fcfM: +e.target.value }))} style={iS} /></div></div>
              {secH("PEER MULTIPLES")}
              {comps.map((c, i) => <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "flex-end", flexWrap: "wrap" }}><div style={{ flex: "1 1 100px" }}><div className="lbl">COMPANY</div><input value={c.name} onChange={e => { const n = [...comps]; n[i] = { ...n[i], name: e.target.value }; setComps(n); }} style={iS} /></div><div style={{ flex: "1 1 70px" }}><div className="lbl">EV/EBITDA</div><input type="number" step="0.1" value={c.evEbitda} onChange={e => { const n = [...comps]; n[i] = { ...n[i], evEbitda: e.target.value }; setComps(n); }} style={iS} /></div><div style={{ flex: "1 1 70px" }}><div className="lbl">EV/REV</div><input type="number" step="0.1" value={c.evRev} onChange={e => { const n = [...comps]; n[i] = { ...n[i], evRev: e.target.value }; setComps(n); }} style={iS} /></div><div style={{ flex: "1 1 70px" }}><div className="lbl">P/E</div><input type="number" step="0.1" value={c.pe} onChange={e => { const n = [...comps]; n[i] = { ...n[i], pe: e.target.value }; setComps(n); }} style={iS} /></div><div style={{ flex: "1 1 70px" }}><div className="lbl">P/FCF</div><input type="number" step="0.1" value={c.pFcf} onChange={e => { const n = [...comps]; n[i] = { ...n[i], pFcf: e.target.value }; setComps(n); }} style={iS} /></div><button onClick={() => setComps(p => p.filter((_, j) => j !== i))} style={{ background: `${T.red}08`, border: `1px solid ${T.red}20`, color: T.red, borderRadius: 6, padding: "8px 10px", cursor: "pointer", fontSize: 11 }}>{"\u2715"}</button></div>)}
              <button onClick={() => setComps(p => [...p, { name: "", evEbitda: "", evRev: "", pe: "", pFcf: "" }])} style={{ ...bS(T.textMuted), marginTop: 4 }}>+ Add Peer</button>
            </div>
            {compStats && compStats.length > 0 && <div style={{ ...cardS, marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>IMPLIED VALUATION</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 20 }}>{compStats.map(c => <div key={c.label} style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}><div style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono, marginBottom: 4 }}>{c.label}</div><div style={{ fontSize: 10, color: T.textMuted, marginBottom: 4 }}>Median: {c.median.toFixed(1)}x (n={c.count})</div><div style={{ fontSize: 20, fontWeight: 800, color: c.implied > dcf.currentPrice ? T.green : T.red, fontFamily: T.mono }}>${c.implied.toFixed(2)}</div></div>)}</div>
              {(() => { const all = [...compStats.map(c => c.implied), dcfRes?.fair].filter(Boolean); if (!all.length) return null; const mn = Math.min(...all) * 0.7, mx = Math.max(...all) * 1.3, rng = mx - mn; const pos = (v) => Math.max(0, Math.min(100, ((v - mn) / rng) * 100)); const colors = [T.cyan, T.purple, T.amber, T.green]; return <div><div style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono, marginBottom: 8 }}>FOOTBALL FIELD</div>{dcfRes && <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><div style={{ fontSize: 9, color: T.textDim, width: 65 }}>DCF</div><div style={{ flex: 1, position: "relative", height: 18 }}><div style={{ position: "absolute", left: `${pos(dcfRes.low)}%`, right: `${100 - pos(dcfRes.high)}%`, height: 18, background: `${T.cyan}20`, borderRadius: 4 }} /><div style={{ position: "absolute", left: `${pos(dcfRes.fair)}%`, top: 2, width: 3, height: 14, background: T.cyan, borderRadius: 2, transform: "translateX(-50%)" }} /></div><span style={{ fontSize: 10, color: T.cyan, width: 55, textAlign: "right" }}>${dcfRes.fair.toFixed(0)}</span></div>}{compStats.map((c, i) => <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><div style={{ fontSize: 9, color: T.textDim, width: 65 }}>{c.label.split("/")[1] || c.label}</div><div style={{ flex: 1, position: "relative", height: 14 }}><div style={{ position: "absolute", left: `${pos(c.implied)}%`, top: 2, width: 10, height: 10, background: colors[i % colors.length], borderRadius: "50%", transform: "translateX(-50%)" }} /></div><span style={{ fontSize: 10, color: colors[i % colors.length], width: 55, textAlign: "right" }}>${c.implied.toFixed(0)}</span></div>)}{dcf.currentPrice > 0 && <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}><div style={{ fontSize: 9, color: T.text, width: 65, fontWeight: 700 }}>CURRENT</div><div style={{ flex: 1, position: "relative", height: 14 }}><div style={{ position: "absolute", left: `${pos(dcf.currentPrice)}%`, top: 0, width: 2, height: 14, background: T.text, transform: "translateX(-50%)" }} /></div><span style={{ fontSize: 10, color: T.text, width: 55, textAlign: "right", fontWeight: 700 }}>${dcf.currentPrice.toFixed(0)}</span></div>}</div>; })()}
            </div>}
          </div>}

          {/* HEALTH */}
          {valTab === "health" && <div>
            <GuidancePanel title="FINANCIAL RATIOS — DEFINITIONS & HEALTHY RANGES" items={HEALTH_GUIDANCE} />
            <div style={cardS}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>FINANCIAL STATEMENT INPUTS ($M)</div>
              {secH("BALANCE SHEET ($M)")}
              <div className="ig4" style={{ marginBottom: 16 }}><div><div className="lbl">TOTAL ASSETS</div><input type="number" value={fh.totalAssets || ""} onChange={e => setFh(p => ({ ...p, totalAssets: +e.target.value }))} style={iS} /></div><div><div className="lbl">TOTAL LIABILITIES</div><input type="number" value={fh.totalLiab || ""} onChange={e => setFh(p => ({ ...p, totalLiab: +e.target.value }))} style={iS} /></div><div><div className="lbl">EQUITY</div><input type="number" value={fh.equity || ""} onChange={e => setFh(p => ({ ...p, equity: +e.target.value }))} style={iS} /></div><div><div className="lbl">TOTAL DEBT</div><input type="number" value={fh.totalDebt || ""} onChange={e => setFh(p => ({ ...p, totalDebt: +e.target.value }))} style={iS} /></div></div>
              <div className="ig4" style={{ marginBottom: 16 }}><div><div className="lbl">CURRENT ASSETS</div><input type="number" value={fh.currentAssets || ""} onChange={e => setFh(p => ({ ...p, currentAssets: +e.target.value }))} style={iS} /></div><div><div className="lbl">CURRENT LIAB</div><input type="number" value={fh.currentLiab || ""} onChange={e => setFh(p => ({ ...p, currentLiab: +e.target.value }))} style={iS} /></div><div><div className="lbl">CASH</div><input type="number" value={fh.cash || ""} onChange={e => setFh(p => ({ ...p, cash: +e.target.value }))} style={iS} /></div><div><div className="lbl">INVENTORY</div><input type="number" value={fh.inventory || ""} onChange={e => setFh(p => ({ ...p, inventory: +e.target.value }))} style={iS} /></div></div>
              {secH("INCOME STATEMENT ($M)")}
              <div className="ig4" style={{ marginBottom: 16 }}><div><div className="lbl">REVENUE</div><input type="number" value={fh.revenue || ""} onChange={e => setFh(p => ({ ...p, revenue: +e.target.value }))} style={iS} /></div><div><div className="lbl">COGS</div><input type="number" value={fh.cogs || ""} onChange={e => setFh(p => ({ ...p, cogs: +e.target.value }))} style={iS} /></div><div><div className="lbl">EBIT</div><input type="number" value={fh.ebit || ""} onChange={e => setFh(p => ({ ...p, ebit: +e.target.value }))} style={iS} /></div><div><div className="lbl">NET INCOME</div><input type="number" value={fh.netIncome || ""} onChange={e => setFh(p => ({ ...p, netIncome: +e.target.value }))} style={iS} /></div></div>
              <div className="ig2" style={{ marginBottom: 16 }}><div><div className="lbl">INTEREST EXP ($M)</div><input type="number" value={fh.interestExp || ""} onChange={e => setFh(p => ({ ...p, interestExp: +e.target.value }))} style={iS} /></div><div><div className="lbl">INVESTED CAPITAL ($M)</div><input type="number" value={fh.investedCapital || ""} onChange={e => setFh(p => ({ ...p, investedCapital: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Equity + Net Debt</div></div></div>
            </div>
            {fhRatios.length > 0 && <div style={{ ...cardS, marginTop: 20 }}><div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>SCORECARD</div>{["Profitability", "Leverage", "Liquidity", "Efficiency", "DuPont"].map(cat => { const items = fhRatios.filter(r => r.cat === cat); if (!items.length) return null; return <div key={cat} style={{ marginBottom: 16 }}><div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 8 }}>{cat.toUpperCase()}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>{items.map(r => <div key={r.name} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${r.good ? T.green : T.red}15` }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}><span style={{ fontSize: 10, color: T.textMuted }}>{r.name}</span><span style={{ width: 8, height: 8, borderRadius: "50%", background: r.good ? T.green : T.red }} /></div><div style={{ fontSize: 18, fontWeight: 800, color: r.good ? T.green : T.red, fontFamily: T.mono }}>{r.value}</div>{r.detail && <div style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>{r.detail}</div>}</div>)}</div></div>; })}</div>}
          </div>}

          {/* SCENARIOS */}
          {valTab === "scenarios" && <div>
            <GuidancePanel title="SCENARIO ANALYSIS — GUIDANCE" items={SCENARIO_GUIDANCE} />
            <div style={cardS}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>SCENARIO MANAGER</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}><input value={scenName} onChange={e => setScenName(e.target.value)} placeholder="e.g. Bull Case" style={{ ...iS, maxWidth: 250 }} /><button onClick={() => { if (!scenName) return; const res = dcfRes || (dcf.currentPrice > 0 && dcf.sharesOutM > 0 && dcf.revenueM > 0 && dcf.wacc > dcf.terminalGrowth ? runDCF(dcf) : null); setScenarios(p => [...p, { id: Date.now(), name: scenName, inputs: { ...dcf }, fair: res?.fair || 0, up: res?.up || 0 }]); setScenName(""); notify("Saved"); }} style={bS(T.green)}>Save Current</button></div>
              {scenarios.length === 0 && <div style={{ textAlign: "center", padding: 30, color: T.textDim, fontSize: 12 }}>No scenarios saved.</div>}
              {scenarios.length > 0 && <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}><thead><tr>{["Scenario", "Growth", "Margin", "WACC", "TG", "MOS", "Fair Value", "Upside", ""].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "right", fontSize: 9, fontWeight: 700, color: T.textDim, fontFamily: T.mono, borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{scenarios.map(s => <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}><td style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, fontSize: 12 }}>{s.name}</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontFamily: T.mono }}>{s.inputs.revenueGrowth}%</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontFamily: T.mono }}>{s.inputs.opMargin}%</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontFamily: T.mono }}>{s.inputs.wacc}%</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontFamily: T.mono }}>{s.inputs.terminalGrowth}%</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 11, fontFamily: T.mono }}>{s.inputs.marginOfSafety}%</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 13, fontWeight: 800, color: T.cyan, fontFamily: T.mono }}>${s.fair.toFixed(2)}</td><td style={{ padding: "8px 10px", textAlign: "right", fontSize: 12, fontWeight: 700, color: s.up >= 0 ? T.green : T.red }}>{pct(s.up)}</td><td style={{ padding: "8px 10px" }}><div style={{ display: "flex", gap: 4 }}><button onClick={() => { setDcf(s.inputs); setDcfRes(runDCF(s.inputs)); setValTab("dcf"); notify("Loaded"); }} style={{ padding: "3px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 9, cursor: "pointer" }}>Load</button><button onClick={() => setScenarios(p => p.filter(x => x.id !== s.id))} style={{ padding: "3px 6px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.red, fontSize: 9, cursor: "pointer" }}>{"\u2715"}</button></div></td></tr>)}</tbody></table></div>}
              {scenarios.length >= 2 && <div style={{ marginTop: 20 }}><div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 10 }}>COMPARISON</div><div style={{ display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center", padding: "20px 0" }}>{scenarios.map((s, i) => { const maxFV = Math.max(...scenarios.map(x => x.fair)); const h = maxFV > 0 ? (s.fair / maxFV) * 140 : 40; const colors = [T.red, T.amber, T.green, T.cyan, T.purple]; return <div key={s.id} style={{ textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 800, color: colors[i % colors.length], fontFamily: T.mono, marginBottom: 4 }}>${s.fair.toFixed(0)}</div><div style={{ width: 48, height: h, background: `${colors[i % colors.length]}30`, border: `1px solid ${colors[i % colors.length]}40`, borderRadius: "6px 6px 0 0", margin: "0 auto" }} /><div style={{ fontSize: 9, color: T.textMuted, marginTop: 6, maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div></div>; })}</div></div>}
            </div>
          </div>}

          {/* BLENDED */}
          {valTab === "blended" && <div>
            <GuidancePanel title="BLENDED VALUATION — GUIDANCE & DEFINITIONS" items={BLENDED_GUIDANCE} />
            <div style={cardS}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>WEIGHTED BLENDED VALUATION</div>
              <div className="ig3" style={{ marginBottom: 16 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}><div className="lbl">DCF MODEL</div><div style={{ fontSize: 18, fontWeight: 800, color: T.cyan, fontFamily: T.mono, marginBottom: 8 }}>{dcfRes ? "$" + dcfRes.fair.toFixed(2) : "—"}</div><div className="lbl">WEIGHT (%)</div><input type="number" min="0" max="100" value={blend.dcfWeight} onChange={e => setBlend(p => ({ ...p, dcfWeight: +e.target.value }))} style={iS} /></div>
                <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}><div className="lbl">COMPS (AVG)</div><div style={{ fontSize: 18, fontWeight: 800, color: T.purple, fontFamily: T.mono, marginBottom: 8 }}>{compStats?.length > 0 ? "$" + (compStats.reduce((s, c) => s + c.implied, 0) / compStats.length).toFixed(2) : "—"}</div><div className="lbl">WEIGHT (%)</div><input type="number" min="0" max="100" value={blend.compsWeight} onChange={e => setBlend(p => ({ ...p, compsWeight: +e.target.value }))} style={iS} /></div>
                <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}><div className="lbl">{blend.customLabel.toUpperCase()}</div><input type="number" step="0.01" value={blend.customVal || ""} onChange={e => setBlend(p => ({ ...p, customVal: +e.target.value }))} placeholder="$ value" style={{ ...iS, fontSize: 18, fontWeight: 800, color: T.amber, marginBottom: 8 }} /><div className="lbl">WEIGHT (%)</div><input type="number" min="0" max="100" value={blend.customWeight} onChange={e => setBlend(p => ({ ...p, customWeight: +e.target.value }))} style={iS} /><div style={{ marginTop: 6 }}><div className="lbl">LABEL</div><input value={blend.customLabel} onChange={e => setBlend(p => ({ ...p, customLabel: e.target.value }))} style={{ ...iS, fontSize: 10 }} /></div></div>
              </div>
              {blendedVal && blendedVal.weighted > 0 && <>
                <div style={{ padding: 24, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.cyan}20`, textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono, marginBottom: 6 }}>BLENDED FAIR VALUE (weights: {blendedVal.tw}%)</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: T.cyan, fontFamily: T.mono }}>${blendedVal.weighted.toFixed(2)}</div>
                  {dcf.currentPrice > 0 && <div style={{ fontSize: 14, fontWeight: 700, color: blendedVal.weighted > dcf.currentPrice ? T.green : T.red, marginTop: 8 }}>{pct(((blendedVal.weighted - dcf.currentPrice) / dcf.currentPrice) * 100)} vs current ${dcf.currentPrice.toFixed(2)}</div>}
                  <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 16, flexWrap: "wrap" }}>
                    {[[`DCF: $${blendedVal.dcfVal.toFixed(2)}`, `${blend.dcfWeight}%`, T.cyan], [`Comps: $${blendedVal.compsVal.toFixed(2)}`, `${blend.compsWeight}%`, T.purple], [`${blend.customLabel}: $${blendedVal.customVal.toFixed(2)}`, `${blend.customWeight}%`, T.amber]].filter(([, , ], i) => [blend.dcfWeight, blend.compsWeight, blend.customWeight][i] > 0).map(([l, w, c]) => <div key={l} style={{ fontSize: 10, color: c }}><span style={{ fontWeight: 700 }}>{l}</span> <span style={{ color: T.textDim }}>({w})</span></div>)}
                  </div>
                </div>
                {/* PRICE RANGE CHART */}
                <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>PRICE TARGET RANGE</div>
                  {(() => {
                    const vals = [];
                    if (dcfRes) { vals.push({ label: "DCF", low: dcfRes.low, mid: dcfRes.fair, high: dcfRes.high, color: T.cyan }); }
                    if (compStats?.length > 0) {
                      const implieds = compStats.map(c => c.implied);
                      const cLow = Math.min(...implieds) * 0.85, cHigh = Math.max(...implieds) * 1.15;
                      const cMid = implieds.reduce((a, b) => a + b, 0) / implieds.length;
                      vals.push({ label: "Comps", low: cLow, mid: cMid, high: cHigh, color: T.purple });
                    }
                    if (blend.customVal > 0) vals.push({ label: blend.customLabel, low: blend.customVal * 0.85, mid: blend.customVal, high: blend.customVal * 1.15, color: T.amber });
                    if (blendedVal) vals.push({ label: "Blended", low: blendedVal.weighted * 0.85, mid: blendedVal.weighted, high: blendedVal.weighted * 1.15, color: T.green });
                    if (vals.length === 0) return null;
                    const allNums = vals.flatMap(v => [v.low, v.high]);
                    if (dcf.currentPrice > 0) allNums.push(dcf.currentPrice);
                    const gMin = Math.min(...allNums) * 0.85, gMax = Math.max(...allNums) * 1.15, gRng = gMax - gMin;
                    const pos = (v) => Math.max(0, Math.min(100, ((v - gMin) / gRng) * 100));

                    return <div>
                      {vals.map(v => (
                        <div key={v.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: v.color, width: 55, fontWeight: 700, fontFamily: T.mono, flexShrink: 0 }}>{v.label}</div>
                          <div style={{ flex: 1, position: "relative", height: 22 }}>
                            <div style={{ position: "absolute", left: `${pos(v.low)}%`, right: `${100 - pos(v.high)}%`, height: 12, top: 5, background: `${v.color}20`, borderRadius: 6, border: `1px solid ${v.color}30` }} />
                            <div style={{ position: "absolute", left: `${pos(v.mid)}%`, top: 3, width: 3, height: 16, background: v.color, borderRadius: 2, transform: "translateX(-50%)" }} />
                          </div>
                          <div style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono, width: 120, textAlign: "right", flexShrink: 0 }}>${v.low.toFixed(0)} – <span style={{ color: v.color, fontWeight: 700 }}>${v.mid.toFixed(0)}</span> – ${v.high.toFixed(0)}</div>
                        </div>
                      ))}
                      {dcf.currentPrice > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                          <div style={{ fontSize: 9, color: T.text, width: 55, fontWeight: 800, fontFamily: T.mono }}>CURRENT</div>
                          <div style={{ flex: 1, position: "relative", height: 16 }}><div style={{ position: "absolute", left: `${pos(dcf.currentPrice)}%`, top: 0, width: 2, height: 16, background: T.text, transform: "translateX(-50%)" }} /></div>
                          <div style={{ fontSize: 10, color: T.text, fontFamily: T.mono, width: 120, textAlign: "right", fontWeight: 800 }}>${dcf.currentPrice.toFixed(2)}</div>
                        </div>
                      )}
                    </div>;
                  })()}
                </div>
              </>}
            </div>
          </div>}
        </div>}

        {/* ADMIN */}
        {page === "admin" && isAdmin && <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}><h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800 }}>Admin</h1><span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", background: `${T.amber}08`, color: T.amber, borderRadius: 4 }}>RESTRICTED</span></div>
          <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>{[["picks", "Stock Picks"], ["casestudies", "Case Studies"], ["settings", "Settings"]].map(([id, l]) => <button key={id} onClick={() => setAdminTab(id)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: adminTab === id ? `${T.amber}08` : "transparent", color: adminTab === id ? T.amber : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{l}</button>)}</div>
          {adminTab === "picks" && <div><div style={{ ...cardS, marginBottom: 24 }}><div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>{editP ? "EDIT" : "ADD"} PICK</div><div className="ig4" style={{ marginBottom: 12 }}><div><div className="lbl">TICKER</div><input value={pT} onChange={e => setPT(e.target.value)} style={iS} /></div><div><div className="lbl">NAME</div><input value={pN} onChange={e => setPN(e.target.value)} style={iS} /></div><div><div className="lbl">PRICE</div><input type="number" step="0.01" value={pP} onChange={e => setPP(e.target.value)} style={iS} /></div><div><div className="lbl">SECTOR</div><input value={pSe} onChange={e => setPSe(e.target.value)} style={iS} /></div></div><div className="ig2" style={{ marginBottom: 12 }}><div><div className="lbl">SCORE: <span style={{ color: pSc >= 66 ? T.green : pSc >= 33 ? T.amber : T.red, fontWeight: 700 }}>{pSc}</span></div><input type="range" min="0" max="100" value={pSc} onChange={e => setPSc(+e.target.value)} style={{ width: "100%", height: 4, appearance: "none", background: `linear-gradient(to right, ${T.red}, ${T.amber}, ${T.green})`, borderRadius: 2 }} /></div><div><div className="lbl">RATING</div><select value={pR} onChange={e => setPR(e.target.value)} style={iS}><option>BUY</option><option>HOLD</option><option>SELL</option></select></div></div><div style={{ marginBottom: 12 }}><div className="lbl">NOTES</div><textarea value={pNo} onChange={e => setPNo(e.target.value)} rows={3} style={{ ...iS, resize: "vertical" }} /></div><div style={{ display: "flex", gap: 8 }}><button onClick={addPick} style={bS(T.green)}>{editP ? "Update" : "Publish"}</button>{editP && <button onClick={clearPF} style={bS(T.textDim)}>Cancel</button>}</div></div>{stockPicks.length > 0 && <div className="ryzn-table-wrap"><table style={{ width: "100%", borderCollapse: "collapse" }}><TH cols={["Ticker", "Price", "Rating", "Actions"]} /><tbody>{stockPicks.map(s => <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}><td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13 }}>{s.ticker}</td><td style={{ padding: "10px 14px", fontSize: 12 }}>${s.price?.toFixed(2)}</td><td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: (s.rating === "BUY" ? T.green : s.rating === "HOLD" ? T.amber : T.red) + "10", color: s.rating === "BUY" ? T.green : s.rating === "HOLD" ? T.amber : T.red }}>{s.rating}</span></td><td style={{ padding: "10px 14px" }}><div style={{ display: "flex", gap: 6 }}><button onClick={() => epk(s)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>Edit</button><button onClick={() => setStockPicks(p => p.map(x => x.id === s.id ? { ...x, published: !x.published } : x))} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: s.published ? `${T.red}08` : `${T.green}08`, color: s.published ? T.red : T.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{s.published ? "Hide" : "Pub"}</button><button onClick={() => setStockPicks(p => p.filter(x => x.id !== s.id))} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>{"\u2715"}</button></div></td></tr>)}</tbody></table></div>}</div>}
          {adminTab === "casestudies" && <div><div style={{ ...cardS, marginBottom: 24 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono }}>{editCS ? "EDIT" : "NEW"} ARTICLE</div><button onClick={loadTemplate} style={bS(T.amber)}>Load Template</button></div><div className="ig2" style={{ marginBottom: 12 }}><div><div className="lbl">TITLE</div><input value={csTitle} onChange={e => setCsTitle(e.target.value)} style={iS} /></div><div><div className="lbl">CATEGORY</div><select value={csCat} onChange={e => setCsCat(e.target.value)} style={iS}>{["Analysis", "Case Study", "Market Commentary", "Sector Research", "Earnings Review", "Strategy"].map(c => <option key={c}>{c}</option>)}</select></div></div><div style={{ marginBottom: 12 }}><div className="lbl">COVER IMAGE URL</div><input value={csCover} onChange={e => setCsCover(e.target.value)} style={iS} /></div><div style={{ marginBottom: 12 }}><div className="lbl">SUMMARY</div><textarea value={csSummary} onChange={e => setCsSummary(e.target.value)} rows={2} style={{ ...iS, resize: "vertical" }} /></div><div style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}><div className="lbl" style={{ marginBottom: 0 }}>CONTENT BLOCKS</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button onClick={() => addBlock("heading")} style={{ ...bS(T.text), fontSize: 9, padding: "4px 10px" }}>+ Bold Heading</button><button onClick={() => addBlock("text")} style={{ ...bS(T.textMuted), fontSize: 9, padding: "4px 10px" }}>+ Text</button><button onClick={() => addBlock("image")} style={{ ...bS(T.cyan), fontSize: 9, padding: "4px 10px" }}>+ Image</button></div></div>{csBlocks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 12, border: `1px dashed ${T.border}`, borderRadius: 8 }}>No blocks. Use buttons or "Load Template".</div>}{csBlocks.map((b, i) => <div key={i} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${b.type === "heading" ? "rgba(255,255,255,0.12)" : T.border}`, marginBottom: 8 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 9, fontWeight: 700, color: b.type === "heading" ? T.text : b.type === "image" ? T.cyan : T.textMuted, fontFamily: T.mono }}>{b.type === "heading" ? "\u2726 BOLD HEADING" : b.type === "image" ? "\u25A3 IMAGE" : "\u2261 TEXT"}</span><div style={{ display: "flex", gap: 4 }}>{i > 0 && <button onClick={() => moveBlock(i, -1)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, cursor: "pointer", fontSize: 10, borderRadius: 4, padding: "1px 6px" }}>{"\u25B2"}</button>}{i < csBlocks.length - 1 && <button onClick={() => moveBlock(i, 1)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, cursor: "pointer", fontSize: 10, borderRadius: 4, padding: "1px 6px" }}>{"\u25BC"}</button>}<button onClick={() => rmBlock(i)} style={{ background: `${T.red}08`, border: `1px solid ${T.red}20`, color: T.red, cursor: "pointer", fontSize: 10, borderRadius: 4, padding: "1px 6px" }}>{"\u2715"}</button></div></div>{b.type === "heading" && <input value={b.content} onChange={e => updBlock(i, "content", e.target.value)} style={{ ...iS, fontWeight: 800, fontSize: 15 }} />}{b.type === "text" && <textarea value={b.content} onChange={e => updBlock(i, "content", e.target.value)} rows={4} style={{ ...iS, resize: "vertical", lineHeight: 1.7 }} />}{b.type === "image" && <div><input value={b.url} onChange={e => updBlock(i, "url", e.target.value)} placeholder="Image URL" style={{ ...iS, marginBottom: 6 }} /><input value={b.caption || ""} onChange={e => updBlock(i, "caption", e.target.value)} placeholder="Caption" style={{ ...iS, fontSize: 11 }} />{b.url && <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, maxHeight: 100 }}><img src={b.url} alt="" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 100 }} onError={e => e.target.style.display = "none"} /></div>}</div>}</div>)}</div><div style={{ display: "flex", gap: 8 }}><button onClick={addCS} style={bS(T.green)}>{editCS ? "Update" : "Publish"}</button>{editCS && <button onClick={clearCSF} style={bS(T.textDim)}>Cancel</button>}</div></div>{caseStudies.length > 0 && <div className="ryzn-table-wrap"><table style={{ width: "100%", borderCollapse: "collapse" }}><TH cols={["Title", "Category", "Actions"]} /><tbody>{caseStudies.map(cs => <tr key={cs.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}><td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cs.title}</td><td style={{ padding: "10px 14px", fontSize: 11, color: T.textMuted }}>{cs.category}</td><td style={{ padding: "10px 14px" }}><div style={{ display: "flex", gap: 6 }}><button onClick={() => ecsF(cs)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>Edit</button><button onClick={() => setCaseStudies(p => p.map(x => x.id === cs.id ? { ...x, published: !x.published } : x))} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: cs.published ? `${T.red}08` : `${T.green}08`, color: cs.published ? T.red : T.green, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{cs.published ? "Hide" : "Pub"}</button><button onClick={() => setCaseStudies(p => p.filter(x => x.id !== cs.id))} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>{"\u2715"}</button></div></td></tr>)}</tbody></table></div>}</div>}
          {adminTab === "settings" && <div style={cardS}><div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>DATA MANAGEMENT</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button onClick={() => { if (confirm("Clear picks?")) { setStockPicks([]); notify("Cleared"); } }} style={bS(T.red)}>Clear Picks</button><button onClick={() => { if (confirm("Clear articles?")) { setCaseStudies([]); notify("Cleared"); } }} style={bS(T.red)}>Clear Articles</button><button onClick={() => { if (confirm("Clear scenarios?")) { setScenarios([]); notify("Cleared"); } }} style={bS(T.red)}>Clear Scenarios</button></div></div>}
        </div>}
        {page === "admin" && !isAdmin && <div style={{ textAlign: "center", padding: "80px 16px" }}><div style={{ fontSize: 15, fontWeight: 600, color: T.textDim, marginTop: 16 }}>Admin Access Required</div></div>}
      </div>

      <footer style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${T.border}`, padding: "24px 16px", textAlign: "center" }}><span style={{ fontSize: 12, fontWeight: 700, color: T.textDim }}>ryzn.io</span><div style={{ fontSize: 9, color: T.textDim, marginTop: 4 }}>AI-Powered Stock Analysis | Not Financial Advice</div></footer>
      {selectedStock && <StockPreview stock={selectedStock} onClose={() => setSelectedStock(null)} />}
      {showRpt && dcfRes && (() => { const rRef = { current: null }; const vc = dcfRes.up > 20 ? T.green : dcfRes.up > -5 ? T.amber : T.red; const vt = dcfRes.up > 20 ? "UNDERVALUED" : dcfRes.up > -5 ? "FAIRLY VALUED" : "OVERVALUED"; const cs = { padding: "6px 8px", textAlign: "right", fontSize: 11, fontFamily: T.mono }; return <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} onClick={() => setShowRpt(false)}><div onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: 860, maxHeight: "90vh", overflow: "auto", background: "#060610", borderRadius: 16, border: `1px solid ${T.border}` }}><div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#060610", zIndex: 10, borderRadius: "16px 16px 0 0" }}><span style={{ fontSize: 14, fontWeight: 700 }}>DCF Report — {dcf.ticker || "N/A"}</span><button onClick={() => setShowRpt(false)} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: T.textDim, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>{"\u2715"}</button></div><div ref={el => rRef.current = el} style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}><div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><span style={{ fontSize: 28, fontWeight: 900 }}>{dcf.ticker || "N/A"}</span><span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: `${vc}15`, color: vc }}>{vt}</span></div><div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><ValuationGauge value={dcfRes.gauge} size={170} label="DCF Score" /></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>{[["CURRENT", "$" + dcf.currentPrice.toFixed(2), T.text], ["FAIR VALUE", "$" + dcfRes.fair.toFixed(2), T.cyan], ["UPSIDE", pct(dcfRes.up), dcfRes.up >= 0 ? T.green : T.red], ["EV", fmM(dcfRes.ev), T.text], ["EV/EBITDA", dcfRes.evEbitda.toFixed(1) + "x", T.accent], ["FCF YIELD", dcfRes.fcfY.toFixed(1) + "%", T.cyan]].map(([l, v, c]) => <div key={l} style={{ padding: 8, borderRadius: 8, background: "rgba(255,255,255,0.02)" }}><div style={{ fontSize: 8, color: T.textDim }}>{l}</div><div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div></div>)}</div><div style={{ overflowX: "auto", marginBottom: 16 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}><thead><tr>{["Yr", "Growth", "Revenue", "EBIT", "FCF", "PV FCF"].map(h => <th key={h} style={{ ...cs, fontSize: 9, color: T.textDim, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead><tbody>{dcfRes.proj.map(p => <tr key={p.year}><td style={{ ...cs, fontWeight: 700 }}>Y{p.year}</td><td style={{ ...cs, color: T.textMuted }}>{p.growth.toFixed(1)}%</td><td style={{ ...cs, color: T.textMuted }}>{fmM(p.revenue)}</td><td style={{ ...cs, color: T.textMuted }}>{fmM(p.ebit)}</td><td style={{ ...cs, color: p.fcf >= 0 ? T.green : T.red, fontWeight: 600 }}>{fmM(p.fcf)}</td><td style={{ ...cs, color: T.cyan }}>{fmM(p.pvFCF)}</td></tr>)}</tbody></table></div><div style={{ textAlign: "center", fontSize: 9, color: T.textDim, marginTop: 16 }}>ryzn.io | {new Date().toLocaleDateString()} | Not Financial Advice</div></div></div></div>; })()}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        ::selection{background:rgba(255,255,255,0.15)}
        select{appearance:none;-webkit-appearance:none}input[type="date"]{color-scheme:dark}
        input[type="range"]::-webkit-slider-thumb{appearance:none;width:14px;height:14px;border-radius:50%;background:white;cursor:pointer}
        .lbl{font-size:9px;color:rgba(160,168,180,0.35);margin-bottom:4px;font-family:'Montserrat',sans-serif;font-weight:700;letter-spacing:0.05em}
        .ryzn-nav{position:relative;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid rgba(255,255,255,0.06)}
        .ryzn-nav-links{display:flex;gap:2px;overflow-x:auto;-webkit-overflow-scrolling:touch}
        .ryzn-content{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:32px 24px 80px}
        .ryzn-table-wrap{background:rgba(10,10,16,0.75);border-radius:14px;border:1px solid rgba(255,255,255,0.06);overflow-x:auto}
        .ryzn-home-grid{grid-template-columns:repeat(3,1fr)}
        .ryzn-cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
        .ryzn-dcf-layout{grid-template-columns:1fr 1fr}
        .ig2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .ig3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
        .ig4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px}
        @media(max-width:1024px){.ryzn-dcf-layout{grid-template-columns:1fr!important}.ig4{grid-template-columns:1fr 1fr!important}}
        @media(max-width:768px){.ryzn-nav{flex-wrap:wrap;gap:10px;padding:12px 16px}.ryzn-nav-links{width:100%;order:3}.ryzn-content{padding:16px 14px 60px}.ryzn-home-grid{grid-template-columns:1fr!important}.ryzn-cards-grid{grid-template-columns:1fr!important}.ryzn-table-wrap table{min-width:400px}.ig2,.ig3,.ig4{grid-template-columns:1fr!important}.ryzn-dcf-layout{grid-template-columns:1fr!important}}
        @media(max-width:480px){.ryzn-nav-links button{padding:5px 8px!important;font-size:9px!important}.ryzn-logo-text{font-size:15px!important}}
      `}</style>
    </div>
  );
}
