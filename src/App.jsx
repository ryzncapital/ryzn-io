import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════
const T = {
  accent: "#e8edf3", accentGlow: "rgba(232,237,243,0.25)", accentSubtle: "rgba(232,237,243,0.07)",
  neon: "#f0f4f8", bg: "#020204", bgCard: "rgba(10,10,16,0.75)",
  border: "rgba(255,255,255,0.06)", borderHover: "rgba(255,255,255,0.15)",
  text: "#f0f2f5", textMuted: "rgba(200,205,215,0.55)", textDim: "rgba(160,168,180,0.35)",
  green: "#4ade80", red: "#fb7185", amber: "#fbbf24", cyan: "#67e8f9",
  mono: "'Montserrat', sans-serif", sans: "'Montserrat', sans-serif",
};



// ═══════════════════════════════════════════════════
// STARFIELD
// ═══════════════════════════════════════════════════
function Starfield() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    let w = c.width = window.innerWidth, h = c.height = window.innerHeight;
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.5 + 0.1,
      sp: Math.random() * 0.0005 + 0.0002, ph: Math.random() * Math.PI * 2
    }));
    let raf;
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach(s => {
        const tw = Math.sin(t * s.sp * 60 + s.ph) * 0.35 + 0.65;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,225,240,${s.a * tw})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

// ═══════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════
const storageGet = async (k, fb) => { try { const r = await window.storage.get("ryzn_" + k); return r ? JSON.parse(r.value) : fb; } catch { return fb; } };
const storageSet = async (k, v) => { try { await window.storage.set("ryzn_" + k, JSON.stringify(v)); } catch {} };

// ═══════════════════════════════════════════════════
// VALUATION GAUGE
// ═══════════════════════════════════════════════════
function ValuationGauge({ value, size = 160, label }) {
  const v = Math.min(Math.max(value, 0), 100);
  const r = size * 0.4, cx = size / 2, cy = size / 2 + 8;
  const sa = Math.PI * 0.8, ea = Math.PI * 0.2 + Math.PI;
  const va = sa + (v / 100) * (ea - sa);
  const arc = (s, e) => {
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${e - s > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
  };
  const col = v >= 66 ? T.green : v >= 33 ? T.amber : T.red;
  const txt = v >= 66 ? "Undervalued" : v >= 33 ? "Fair Value" : "Overvalued";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={arc(sa, ea)} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={6} strokeLinecap="round" />
      <path d={arc(sa, va)} fill="none" stroke={col} strokeWidth={6} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${col}40)` }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill={col} fontSize={size * 0.16} fontWeight="800" fontFamily={T.mono}>{Math.round(v)}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={T.textMuted} fontSize={size * 0.065} fontFamily={T.mono} fontWeight="600">{txt}</text>
      {label && <text x={cx} y={cy + 22} textAnchor="middle" fill={T.textDim} fontSize={size * 0.055} fontFamily={T.mono}>{label}</text>}
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// STOCK CARD + PREVIEW
// ═══════════════════════════════════════════════════
function StockCard({ stock, onClick }) {
  if (!stock) return null;
  const c = stock.rating === "BUY" ? T.green : stock.rating === "HOLD" ? T.amber : T.red;
  return (
    <div onClick={onClick} style={{ padding: 20, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, fontFamily: T.mono }}>{stock.ticker}</div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{stock.name}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: `${c}10`, color: c, fontFamily: T.mono, height: "fit-content" }}>{stock.rating}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: T.mono }}>${(stock.price || 0).toFixed(2)}</div>
          {stock.sector && <div style={{ fontSize: 10, color: T.textDim, marginTop: 4, fontFamily: T.mono }}>{stock.sector}</div>}
        </div>
        <ValuationGauge value={stock.valuationScore || 50} size={60} />
      </div>
      {stock.notes && <div style={{ fontSize: 11, color: T.textDim, marginTop: 12, lineHeight: 1.6, borderTop: `1px solid ${T.border}`, paddingTop: 10, whiteSpace: "pre-wrap", overflow: "hidden", maxHeight: 48 }}>{stock.notes}</div>}
    </div>
  );
}

function StockPreview({ stock, onClose }) {
  if (!stock) return null;
  const c = stock.rating === "BUY" ? T.green : stock.rating === "HOLD" ? T.amber : T.red;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "92%", maxWidth: 600, maxHeight: "85vh", overflow: "auto", background: "#0a0a10", borderRadius: 16, border: `1px solid ${T.border}`, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: T.mono }}>{stock.ticker}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: `${c}10`, color: c, fontFamily: T.mono }}>{stock.rating}</span>
            </div>
            <div style={{ fontSize: 12, color: T.textDim, marginTop: 4 }}>{stock.name}{stock.sector ? ` | ${stock.sector}` : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: T.textDim, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>{"\u2715"}</button>
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: T.mono, marginBottom: 24 }}>${(stock.price || 0).toFixed(2)}</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><ValuationGauge value={stock.valuationScore || 50} size={150} label="Valuation" /></div>
        {stock.notes && (
          <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.12em", marginBottom: 10 }}>ANALYSIS NOTES</div>
            <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{stock.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function TH({ cols }) {
  return (
    <thead><tr>{cols.map(c => (
      <th key={c} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{c}</th>
    ))}</tr></thead>
  );
}

// ═══════════════════════════════════════════════════
// ARTICLE BLOCK RENDERER (public facing)
// ═══════════════════════════════════════════════════
function RenderBlocks({ blocks }) {
  if (!blocks || blocks.length === 0) return null;
  return blocks.map((b, i) => {
    if (b.type === "heading") {
      return <h3 key={i} style={{ fontSize: 18, fontWeight: 800, marginTop: i > 0 ? 28 : 0, marginBottom: 12, color: T.text }}>{b.content}</h3>;
    }
    if (b.type === "text") {
      return <p key={i} style={{ fontSize: 14, color: T.textMuted, lineHeight: 2, marginBottom: 16, whiteSpace: "pre-wrap" }}>{b.content}</p>;
    }
    if (b.type === "image" && b.url) {
      return (
        <div key={i} style={{ margin: "20px 0", borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <img src={b.url} alt={b.caption || ""} style={{ width: "100%", display: "block" }} onError={e => e.target.style.display = "none"} />
          {b.caption && <div style={{ padding: "8px 12px", fontSize: 11, color: T.textDim, fontStyle: "italic" }}>{b.caption}</div>}
        </div>
      );
    }
    return null;
  });
}

// ═══════════════════════════════════════════════════
// DCF CALCULATION ENGINE
// ═══════════════════════════════════════════════════
function runDCF(inp) {
  const {
    currentPrice, sharesOutM, revenueM, revenueGrowth, opMargin, taxRate,
    daPercent, capexPercent, nwcPercent, wacc, terminalGrowth, projYears,
    netDebtM, marginOfSafety, revenueGrowthDecay
  } = inp;
  const revenue = revenueM * 1e6;
  const sharesOut = sharesOutM * 1e6;
  const netDebt = (netDebtM || 0) * 1e6;
  const mosRate = (marginOfSafety || 0) / 100;
  const decayRate = (revenueGrowthDecay || 5) / 100;

  const projections = [];
  let totalPV = 0;

  for (let y = 1; y <= projYears; y++) {
    const gDecay = revenueGrowth * Math.pow(1 - decayRate, y - 1);
    const projRev = revenue * Math.pow(1 + gDecay / 100, y);
    const ebit = projRev * (opMargin / 100);
    const nopat = ebit * (1 - taxRate / 100);
    const da = projRev * (daPercent / 100);
    const capex = projRev * (capexPercent / 100);
    const prevRev = y === 1 ? revenue : revenue * Math.pow(1 + (revenueGrowth * Math.pow(1 - decayRate, y - 2)) / 100, y - 1);
    const nwcChg = (projRev - prevRev) * (nwcPercent / 100);
    const fcf = nopat + da - capex - nwcChg;
    const disc = Math.pow(1 + wacc / 100, y);
    const pvFCF = fcf / disc;
    totalPV += pvFCF;
    projections.push({ year: y, revenue: projRev, ebit, nopat, da, capex, nwcChg, fcf, pvFCF, growthUsed: gDecay });
  }

  const lastFCF = projections[projections.length - 1].fcf;
  const termVal = (lastFCF * (1 + terminalGrowth / 100)) / (wacc / 100 - terminalGrowth / 100);
  const pvTerm = termVal / Math.pow(1 + wacc / 100, projYears);
  const ev = totalPV + pvTerm;
  const eqVal = ev - netDebt;
  const rawFairVal = eqVal / sharesOut;
  const fairVal = rawFairVal * (1 - mosRate);
  const low = fairVal * 0.80;
  const high = rawFairVal * 1.20;
  const upside = ((fairVal - currentPrice) / currentPrice) * 100;

  const lastEBITDA = projections[projections.length - 1].ebit + projections[projections.length - 1].da;
  const impliedMultiple = lastEBITDA > 0 ? ev / lastEBITDA : 0;
  const tvPercent = ev > 0 ? (pvTerm / ev) * 100 : 0;
  const fcfYield = sharesOut > 0 && currentPrice > 0 ? (lastFCF / (sharesOut * currentPrice)) * 100 : 0;

  let gauge;
  if (upside > 30) gauge = 90;
  else if (upside > 15) gauge = 75;
  else if (upside > 0) gauge = 55;
  else if (upside > -15) gauge = 35;
  else gauge = 15;

  // Sensitivity: WACC vs Terminal Growth
  const sensWACCs = [wacc - 2, wacc - 1, wacc, wacc + 1, wacc + 2];
  const sensTGs = [terminalGrowth - 1, terminalGrowth - 0.5, terminalGrowth, terminalGrowth + 0.5, terminalGrowth + 1];
  const sensitivity = sensWACCs.map(w => sensTGs.map(tg => {
    if (w / 100 <= tg / 100) return null;
    const tv2 = (lastFCF * (1 + tg / 100)) / (w / 100 - tg / 100);
    const pvT2 = tv2 / Math.pow(1 + w / 100, projYears);
    const ev2 = totalPV + pvT2 - netDebt;
    return (ev2 / sharesOut) * (1 - mosRate);
  }));

  return { projections, termVal, pvTerm, totalPV, ev, eqVal, rawFairVal, fairVal, low, high, upside, gauge, impliedMultiple, tvPercent, fcfYield, sensitivity, sensWACCs, sensTGs, netDebt };
}

// ═══════════════════════════════════════════════════
// DCF REPORT POPUP (printable)
// ═══════════════════════════════════════════════════
function DCFReport({ inp, res, onClose }) {
  const rRef = useRef(null);
  const fm = (n) => {
    if (Math.abs(n) >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (Math.abs(n) >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (Math.abs(n) >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
    if (Math.abs(n) >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
    return "$" + Math.round(n).toLocaleString();
  };
  const vc = res.upside > 20 ? T.green : res.upside > -5 ? T.amber : T.red;
  const vt = res.upside > 20 ? "UNDERVALUED" : res.upside > -5 ? "FAIRLY VALUED" : "OVERVALUED";

  const handleDL = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    w.document.write(`<!DOCTYPE html><html><head><title>DCF - ${inp.ticker || "N/A"}</title><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Montserrat',sans-serif;background:#020204;color:#f0f2f5;padding:40px;-webkit-print-color-adjust:exact;print-color-adjust:exact}.r{max-width:800px;margin:0 auto}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:8px 10px;text-align:right;border-bottom:1px solid rgba(255,255,255,0.04)}th{font-size:9px;color:rgba(160,168,180,0.35);letter-spacing:0.1em;text-transform:uppercase}</style></head><body>`);
    w.document.write(rRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  const cellS = { padding: "6px 8px", textAlign: "right", fontSize: 11, fontFamily: T.mono };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "95%", maxWidth: 860, maxHeight: "90vh", overflow: "auto", background: "#060610", borderRadius: 16, border: `1px solid ${T.border}` }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#060610", zIndex: 10, borderRadius: "16px 16px 0 0" }}>
          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: T.mono }}>DCF Valuation Report</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDL} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: `${T.cyan}15`, color: T.cyan, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.mono }}>Print / Save PDF</button>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: T.textDim, width: 32, height: 32, borderRadius: 8, cursor: "pointer", fontSize: 16 }}>{"\u2715"}</button>
          </div>
        </div>
        <div ref={rRef} style={{ padding: 24 }}>
          <div className="r">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 900 }}>{inp.ticker || "N/A"}</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: `${vc}15`, color: vc, fontFamily: T.mono }}>{vt}</span>
            </div>
            <div style={{ fontSize: 13, color: T.textDim, marginBottom: 20 }}>Discounted Cash Flow Valuation</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><ValuationGauge value={res.gauge} size={170} label="DCF Score" /></div>

            {/* Summary */}
            <div style={{ padding: 16, borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.1em", marginBottom: 12 }}>VALUATION SUMMARY</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                {[
                  ["CURRENT PRICE", "$" + inp.currentPrice.toFixed(2), T.text],
                  ["FAIR VALUE", "$" + res.fairVal.toFixed(2), T.cyan],
                  ["RAW (NO MOS)", "$" + res.rawFairVal.toFixed(2), T.textMuted],
                  ["LOW EST.", "$" + res.low.toFixed(2), T.amber],
                  ["HIGH EST.", "$" + res.high.toFixed(2), T.green],
                  ["UPSIDE", (res.upside >= 0 ? "+" : "") + res.upside.toFixed(1) + "%", res.upside >= 0 ? T.green : T.red],
                  ["EV", fm(res.ev), T.text],
                  ["EV/EBITDA", res.impliedMultiple.toFixed(1) + "x", T.accent],
                  ["TV % OF EV", res.tvPercent.toFixed(1) + "%", T.accent],
                  ["FCF YIELD", res.fcfYield.toFixed(1) + "%", T.cyan],
                ].map(([l, v, col]) => (
                  <div key={l} style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: T.mono, color: col }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Assumptions */}
            <div style={{ padding: 16, borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.1em", marginBottom: 12 }}>KEY ASSUMPTIONS</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
                {[
                  ["Revenue (TTM)", `$${Number(inp.revenueM).toLocaleString()}M`],
                  ["Rev Growth", `${inp.revenueGrowth}%`],
                  ["Growth Decay", `${inp.revenueGrowthDecay || 5}%/yr`],
                  ["Op Margin", `${inp.opMargin}%`],
                  ["Tax Rate", `${inp.taxRate}%`],
                  ["WACC", `${inp.wacc}%`],
                  ["Terminal Growth", `${inp.terminalGrowth}%`],
                  ["Net Debt", `$${Number(inp.netDebtM || 0).toLocaleString()}M`],
                  ["Margin of Safety", `${inp.marginOfSafety || 0}%`],
                  ["Shares Out", `${Number(inp.sharesOutM).toLocaleString()}M`],
                ].map(([l, v]) => (
                  <div key={l} style={{ padding: 8, borderRadius: 6, background: "rgba(255,255,255,0.015)" }}>
                    <div style={{ fontSize: 8, color: T.textDim, fontFamily: T.mono }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: T.mono }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* FCF Table */}
            <div style={{ padding: 16, borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 16, overflowX: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.1em", marginBottom: 12 }}>PROJECTED FREE CASH FLOW</div>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 550 }}>
                <thead><tr>{["Yr", "Growth", "Revenue", "EBIT", "NOPAT", "FCF", "PV FCF"].map(h => <th key={h} style={{ ...cellS, fontSize: 9, fontWeight: 700, color: T.textDim, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{res.projections.map(p => (
                  <tr key={p.year} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ ...cellS, fontWeight: 700 }}>Y{p.year}</td>
                    <td style={{ ...cellS, color: T.textMuted }}>{p.growthUsed.toFixed(1)}%</td>
                    <td style={{ ...cellS, color: T.textMuted }}>{fm(p.revenue)}</td>
                    <td style={{ ...cellS, color: T.textMuted }}>{fm(p.ebit)}</td>
                    <td style={{ ...cellS, color: T.textMuted }}>{fm(p.nopat)}</td>
                    <td style={{ ...cellS, color: p.fcf >= 0 ? T.green : T.red, fontWeight: 600 }}>{fm(p.fcf)}</td>
                    <td style={{ ...cellS, color: T.cyan }}>{fm(p.pvFCF)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            {/* Sensitivity */}
            <div style={{ padding: 16, borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 16, overflowX: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.1em", marginBottom: 12 }}>SENSITIVITY: WACC vs TERMINAL GROWTH</div>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                <thead><tr>
                  <th style={{ ...cellS, textAlign: "center", fontSize: 9, color: T.cyan, borderBottom: `1px solid ${T.border}` }}>WACC \ TG</th>
                  {res.sensTGs.map(tg => <th key={tg} style={{ ...cellS, textAlign: "center", fontSize: 9, color: T.textDim, borderBottom: `1px solid ${T.border}` }}>{tg.toFixed(1)}%</th>)}
                </tr></thead>
                <tbody>{res.sensitivity.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ ...cellS, textAlign: "center", fontWeight: 700, color: T.textDim }}>{res.sensWACCs[i].toFixed(1)}%</td>
                    {row.map((val, j) => {
                      const isBase = res.sensWACCs[i] === inp.wacc && res.sensTGs[j] === inp.terminalGrowth;
                      return <td key={j} style={{ ...cellS, textAlign: "center", fontWeight: isBase ? 800 : 400, color: val === null ? T.textDim : val > inp.currentPrice ? T.green : T.red, background: isBase ? "rgba(103,232,249,0.06)" : "transparent" }}>{val === null ? "-" : "$" + val.toFixed(2)}</td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div style={{ textAlign: "center", fontSize: 9, color: T.textDim, fontFamily: T.mono, marginTop: 16 }}>
              ryzn.io | Generated {new Date().toLocaleDateString()} | Not Financial Advice
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [notif, setNotif] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [adminTab, setAdminTab] = useState("picks");
  const [ready, setReady] = useState(false);

  // Data
  const [stockPicks, setStockPicks] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);

  // Admin pick form
  const [pT, setPT] = useState("");
  const [pN, setPN] = useState("");
  const [pP, setPP] = useState("");
  const [pSe, setPSe] = useState("");
  const [pSc, setPSc] = useState(50);
  const [pR, setPR] = useState("HOLD");
  const [pNo, setPNo] = useState("");
  const [editP, setEditP] = useState(null);

  // Admin article form — block-based
  const [csTitle, setCsTitle] = useState("");
  const [csSummary, setCsSummary] = useState("");
  const [csCat, setCsCat] = useState("Analysis");
  const [csCover, setCsCover] = useState("");
  const [csBlocks, setCsBlocks] = useState([]);
  const [editCS, setEditCS] = useState(null);

  // DCF state
  const [dcf, setDcf] = useState({
    ticker: "", currentPrice: 0, sharesOutM: 0, revenueM: 0,
    revenueGrowth: 10, revenueGrowthDecay: 5, opMargin: 25,
    taxRate: 21, daPercent: 5, capexPercent: 4, nwcPercent: 2,
    wacc: 10, terminalGrowth: 3, projYears: 5,
    netDebtM: 0, marginOfSafety: 15, equityRiskPremium: 5.5
  });
  const [dcfRes, setDcfRes] = useState(null);
  const [showRpt, setShowRpt] = useState(false);

  // WACC calculator
  const [wCalc, setWCalc] = useState({ riskFreeRate: 4.5, beta: 1.0, erp: 5.5, costDebt: 5.0, taxRateW: 21, debtPct: 30 });
  const [showWCalc, setShowWCalc] = useState(false);

  // NWC calculator
  const [nCalc, setNCalc] = useState({ currentAssets: 0, cash: 0, currentLiabilities: 0, currentDebt: 0, prevNWC: 0 });
  const [showNCalc, setShowNCalc] = useState(false);

  const [selCS, setSelCS] = useState(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    (async () => {
      const [sp, cs] = await Promise.all([storageGet("stockPicks", []), storageGet("caseStudies", [])]);
      setStockPicks(sp); setCaseStudies(cs); setReady(true);
    })();
  }, []);
  useEffect(() => { if (ready) storageSet("stockPicks", stockPicks); }, [stockPicks, ready]);
  useEffect(() => { if (ready) storageSet("caseStudies", caseStudies); }, [caseStudies, ready]);

  const notify = (m, t = "success") => { setNotif({ m, t }); setTimeout(() => setNotif(null), 3000); };

  // === PICKS CRUD ===
  const addPick = () => {
    if (!pT) return;
    const pk = { id: editP || Date.now(), ticker: pT.toUpperCase(), name: pN || pT.toUpperCase(), price: +pP || 0, sector: pSe, valuationScore: +pSc, rating: pR, notes: pNo, published: true, dateAdded: new Date().toISOString().split("T")[0] };
    if (editP) { setStockPicks(p => p.map(x => x.id === editP ? pk : x)); notify("Updated"); }
    else { setStockPicks(p => [pk, ...p]); notify("Added"); }
    clearPF();
  };
  const clearPF = () => { setPT(""); setPN(""); setPP(""); setPSe(""); setPSc(50); setPR("HOLD"); setPNo(""); setEditP(null); };
  const epk = (s) => { setPT(s.ticker); setPN(s.name); setPP(s.price.toString()); setPSe(s.sector); setPSc(s.valuationScore); setPR(s.rating); setPNo(s.notes); setEditP(s.id); };

  // === CASE STUDY CRUD ===
  const addCS = () => {
    if (!csTitle) return;
    const cs = { id: editCS || Date.now(), title: csTitle, summary: csSummary, blocks: csBlocks, category: csCat, coverImage: csCover, published: true, date: new Date().toISOString().split("T")[0] };
    if (editCS) { setCaseStudies(p => p.map(x => x.id === editCS ? cs : x)); notify("Updated"); }
    else { setCaseStudies(p => [cs, ...p]); notify("Published"); }
    clearCSF();
  };
  const clearCSF = () => { setCsTitle(""); setCsSummary(""); setCsCat("Analysis"); setCsCover(""); setCsBlocks([]); setEditCS(null); };
  const ecsF = (cs) => { setCsTitle(cs.title); setCsSummary(cs.summary); setCsCat(cs.category || "Analysis"); setCsCover(cs.coverImage || ""); setCsBlocks(cs.blocks || []); setEditCS(cs.id); setAdminTab("casestudies"); };
  const addBlock = (type) => setCsBlocks(p => [...p, { type, content: "", url: "", caption: "" }]);
  const updBlock = (i, field, val) => setCsBlocks(p => p.map((b, j) => j === i ? { ...b, [field]: val } : b));
  const rmBlock = (i) => setCsBlocks(p => p.filter((_, j) => j !== i));
  const moveBlock = (i, dir) => {
    setCsBlocks(p => {
      const a = [...p]; const ni = i + dir;
      if (ni < 0 || ni >= a.length) return a;
      [a[i], a[ni]] = [a[ni], a[i]]; return a;
    });
  };
  const loadTemplate = () => {
    setCsBlocks([
      { type: "heading", content: "Executive Summary" },
      { type: "text", content: "" },
      { type: "heading", content: "Investment Thesis" },
      { type: "text", content: "" },
      { type: "image", url: "", caption: "" },
      { type: "heading", content: "Financial Analysis" },
      { type: "text", content: "" },
      { type: "heading", content: "Risks & Considerations" },
      { type: "text", content: "" },
      { type: "heading", content: "Conclusion" },
      { type: "text", content: "" },
    ]);
    notify("Template loaded");
  };

  // === DCF ===
  const setDF = (k, v) => setDcf(p => ({ ...p, [k]: v }));
  const runDCFCalc = () => {
    if (dcf.currentPrice <= 0 || dcf.sharesOutM <= 0 || dcf.revenueM <= 0) { notify("Fill required fields (Price, Shares, Revenue)", "error"); return; }
    if (dcf.wacc <= dcf.terminalGrowth) { notify("WACC must exceed Terminal Growth Rate", "error"); return; }
    setDcfRes(runDCF(dcf));
  };
  const calcWACC = () => {
    const { riskFreeRate, beta, erp, costDebt, taxRateW, debtPct } = wCalc;
    const costEquity = riskFreeRate + beta * erp; // CAPM
    const eqPct = 100 - debtPct;
    const w = (eqPct / 100) * costEquity + (debtPct / 100) * costDebt * (1 - taxRateW / 100);
    setDF("wacc", Math.round(w * 100) / 100);
    notify(`WACC calculated: ${w.toFixed(2)}% (Ke: ${costEquity.toFixed(2)}%)`);
    setShowWCalc(false);
  };
  const calcNWC = () => {
    const opCA = nCalc.currentAssets - nCalc.cash;
    const opCL = nCalc.currentLiabilities - nCalc.currentDebt;
    const nwc = opCA - opCL;
    const chg = nwc - nCalc.prevNWC;
    notify(`Operating NWC: $${(nwc).toLocaleString()} | ΔChange: $${chg.toLocaleString()}`);
    setShowNCalc(false);
  };

  const pubPicks = stockPicks.filter(s => s.published);
  const pubCS = caseStudies.filter(c => c.published);

  const iS = { padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.03)", color: T.text, fontSize: 13, fontFamily: T.mono, outline: "none", width: "100%" };
  const bS = (c = T.accent) => ({ padding: "8px 16px", borderRadius: 8, border: "none", background: `${c}15`, color: c, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.mono });

  const navItems = [
    { id: "home", label: "Home" },
    { id: "casestudies", label: "Case Studies" },
    { id: "picks", label: "Stock Picks" },
    { id: "valuation", label: "AI-Powered Valuation" },
  ];

  return (
    <div style={{ minHeight: "100vh", width: "100vw", background: T.bg, color: T.text, fontFamily: T.sans, position: "relative", overflowX: "hidden" }}>
      <Starfield />
      {notif && <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, padding: "12px 20px", borderRadius: 10, background: notif.t === "error" ? `${T.red}20` : `${T.green}20`, border: `1px solid ${notif.t === "error" ? T.red : T.green}30`, color: notif.t === "error" ? T.red : T.green, fontSize: 12, fontWeight: 600, fontFamily: T.mono, animation: "slideIn 0.3s ease", maxWidth: "90vw" }}>{notif.m}</div>}

      {/* NAV */}
      <nav className="ryzn-nav">
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={() => { setPage("home"); setSelCS(null); }}>
          <span className="ryzn-logo-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em", fontFamily: T.mono }}>ryzn<span style={{ fontWeight: 400, color: T.textDim }}>.io</span></span>
        </div>
        <div className="ryzn-nav-links">
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setSelCS(null); }} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: page === n.id ? T.accentSubtle : "transparent", color: page === n.id ? T.accent : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.mono, whiteSpace: "nowrap" }}>{n.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {isAdmin ? (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setPage("admin")} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.amber}20`, background: page === "admin" ? `${T.amber}08` : "transparent", color: T.amber, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: T.mono }}>ADMIN</button>
              <button onClick={() => { setIsAdmin(false); setPage("home"); }} style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer", fontFamily: T.mono }}>Logout</button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowAdminLogin(!showAdminLogin)} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: T.mono }}>Admin</button>
              {showAdminLogin && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 6, padding: 12, borderRadius: 8, background: "#0a0a10", border: `1px solid ${T.border}`, display: "flex", gap: 6, zIndex: 100 }}>
                  <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="Password" onKeyDown={e => { if (e.key === "Enter") { if (adminPass === "RVNCP24!") { setIsAdmin(true); setShowAdminLogin(false); setAdminPass(""); notify("Admin access granted"); setPage("admin"); } else notify("Wrong password", "error"); }}} style={{ ...iS, width: 120, padding: "6px 10px" }} />
                  <button onClick={() => { if (adminPass === "RVNCP24!") { setIsAdmin(true); setShowAdminLogin(false); setAdminPass(""); notify("Admin granted"); setPage("admin"); } else notify("Wrong password", "error"); }} style={bS(T.accent)}>{"\u2192"}</button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="ryzn-content">

        {/* ════════ HOME ════════ */}
        {page === "home" && (
          <div style={{ animation: mounted ? "slideIn 0.5s ease" : "none" }}>
            <div style={{ textAlign: "center", padding: "48px 16px 40px" }}>
              <h1 style={{ fontSize: "clamp(32px, 8vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginTop: 16, marginBottom: 12 }}>ryzn<span style={{ fontWeight: 400, color: T.textDim }}>.io</span></h1>
              <p style={{ fontSize: 14, color: T.textDim, maxWidth: 520, margin: "0 auto", lineHeight: 1.8 }}>AI-powered stock analysis with curated picks, institutional-grade DCF valuation, and in-depth case studies.</p>
            </div>
            <div className="ryzn-home-grid" style={{ display: "grid", gap: 16, maxWidth: 900, margin: "0 auto 40px" }}>
              {[
                ["Case Study Library", "In-depth research articles, market analysis, and case studies.", "\u25A3", "casestudies"],
                ["Top Stock Picks", "Curated picks with valuation analysis and detailed notes.", "\u25C8", "picks"],
                ["AI-Powered Valuation", "Institutional-grade DCF with WACC/NWC calculators and PDF reports.", "\u25CE", "valuation"],
              ].map(([t, d, ic, pg]) => (
                <div key={t} onClick={() => setPage(pg)} style={{ padding: 28, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, cursor: "pointer", transition: "border-color 0.3s" }} onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHover} onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                  <div style={{ fontSize: 24, marginBottom: 14, opacity: 0.4 }}>{ic}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{t}</div>
                  <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.7 }}>{d}</div>
                </div>
              ))}
            </div>
            {pubPicks.length > 0 && (
              <div style={{ maxWidth: 900, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800 }}>Featured Picks</h2>
                  <button onClick={() => setPage("picks")} style={{ ...bS(), fontSize: 10 }}>View All {"\u2192"}</button>
                </div>
                <div className="ryzn-cards-grid">{pubPicks.slice(0, 3).map(s => <StockCard key={s.id} stock={s} onClick={() => setSelectedStock(s)} />)}</div>
              </div>
            )}
          </div>
        )}

        {/* ════════ CASE STUDIES ════════ */}
        {page === "casestudies" && !selCS && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>Case Study Library</h1>
              <p style={{ fontSize: 13, color: T.textDim }}>In-depth research, market analysis, and investment case studies.</p>
            </div>
            {pubCS.length > 0 ? (
              <div className="ryzn-cards-grid">{pubCS.map(cs => (
                <div key={cs.id} onClick={() => setSelCS(cs)} style={{ borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, cursor: "pointer", transition: "all 0.2s", overflow: "hidden" }} onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.transform = "translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
                  {cs.coverImage && <div style={{ height: 160, background: `url(${cs.coverImage}) center/cover`, borderBottom: `1px solid ${T.border}` }} />}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 4, background: `${T.cyan}10`, color: T.cyan, fontFamily: T.mono }}>{cs.category}</span>
                      <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.mono }}>{cs.date}</span>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{cs.title}</div>
                    {cs.summary && <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{cs.summary}</div>}
                  </div>
                </div>
              ))}</div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: T.textDim }}><div style={{ fontSize: 14 }}>No articles published yet.</div></div>
            )}
          </div>
        )}

        {page === "casestudies" && selCS && (
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <button onClick={() => setSelCS(null)} style={{ ...bS(T.textMuted), marginBottom: 20 }}>{"\u2190"} Back</button>
            {selCS.coverImage && <div style={{ height: 240, borderRadius: 14, background: `url(${selCS.coverImage}) center/cover`, marginBottom: 24, border: `1px solid ${T.border}` }} />}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 4, background: `${T.cyan}10`, color: T.cyan, fontFamily: T.mono }}>{selCS.category}</span>
              <span style={{ fontSize: 11, color: T.textDim, fontFamily: T.mono }}>{selCS.date}</span>
            </div>
            <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 800, lineHeight: 1.3, marginBottom: 16 }}>{selCS.title}</h1>
            {selCS.summary && <div style={{ fontSize: 15, color: T.textMuted, lineHeight: 1.8, marginBottom: 24, fontStyle: "italic", borderLeft: `3px solid ${T.cyan}30`, paddingLeft: 16 }}>{selCS.summary}</div>}
            <RenderBlocks blocks={selCS.blocks || []} />
          </div>
        )}

        {/* ════════ STOCK PICKS ════════ */}
        {page === "picks" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>Top Stock Picks</h1>
              <p style={{ fontSize: 13, color: T.textDim }}>Curated stock picks with valuation analysis.</p>
            </div>
            {pubPicks.length > 0 ? (
              <div className="ryzn-cards-grid">{pubPicks.map(s => <StockCard key={s.id} stock={s} onClick={() => setSelectedStock(s)} />)}</div>
            ) : (
              <div style={{ textAlign: "center", padding: 60, color: T.textDim }}><div style={{ fontSize: 14 }}>No published picks yet.</div></div>
            )}
          </div>
        )}

        {/* ════════ DCF VALUATION ════════ */}
        {page === "valuation" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800, marginBottom: 6 }}>AI-Powered Valuation</h1>
              <p style={{ fontSize: 13, color: T.textDim }}>Institutional-grade DCF calculator. Revenue &amp; shares outstanding in millions (e.g. 1B = 1,000).</p>
            </div>
            <div style={{ display: "grid", gap: 20 }} className="ryzn-dcf-layout">
              {/* INPUT PANEL */}
              <div style={{ padding: 24, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.12em", marginBottom: 18 }}>MODEL INPUTS</div>

                <div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 10 }}>COMPANY</div>
                <div className="ig3" style={{ marginBottom: 16 }}>
                  <div><div className="lbl">TICKER</div><input value={dcf.ticker} onChange={e => setDF("ticker", e.target.value.toUpperCase())} placeholder="AAPL" style={iS} /></div>
                  <div><div className="lbl">CURRENT PRICE ($)</div><input type="number" step="0.01" value={dcf.currentPrice || ""} onChange={e => setDF("currentPrice", +e.target.value)} placeholder="175.00" style={iS} /></div>
                  <div><div className="lbl">SHARES OUT. (M)</div><input type="number" value={dcf.sharesOutM || ""} onChange={e => setDF("sharesOutM", +e.target.value)} placeholder="15000 = 15B" style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>In millions</div></div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 10 }}>INCOME STATEMENT</div>
                <div className="ig3" style={{ marginBottom: 16 }}>
                  <div><div className="lbl">REVENUE TTM ($M)</div><input type="number" value={dcf.revenueM || ""} onChange={e => setDF("revenueM", +e.target.value)} placeholder="383000 = $383B" style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>In millions</div></div>
                  <div><div className="lbl">REV. GROWTH (%)</div><input type="number" step="0.1" value={dcf.revenueGrowth || ""} onChange={e => setDF("revenueGrowth", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">GROWTH DECAY (%/YR)</div><input type="number" step="0.5" value={dcf.revenueGrowthDecay || ""} onChange={e => setDF("revenueGrowthDecay", +e.target.value)} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>How fast growth fades</div></div>
                </div>
                <div className="ig3" style={{ marginBottom: 16 }}>
                  <div><div className="lbl">OP. MARGIN (%)</div><input type="number" step="0.1" value={dcf.opMargin || ""} onChange={e => setDF("opMargin", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">TAX RATE (%)</div><input type="number" step="0.1" value={dcf.taxRate || ""} onChange={e => setDF("taxRate", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">D&A (% OF REV)</div><input type="number" step="0.1" value={dcf.daPercent || ""} onChange={e => setDF("daPercent", +e.target.value)} style={iS} /></div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 10 }}>CAPITAL EXPENDITURES & WORKING CAPITAL</div>
                <div className="ig3" style={{ marginBottom: 16 }}>
                  <div><div className="lbl">CAPEX (% OF REV)</div><input type="number" step="0.1" value={dcf.capexPercent || ""} onChange={e => setDF("capexPercent", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">NWC (% OF ΔRev)</div><input type="number" step="0.1" value={dcf.nwcPercent || ""} onChange={e => setDF("nwcPercent", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">NET DEBT ($M)</div><input type="number" value={dcf.netDebtM || ""} onChange={e => setDF("netDebtM", +e.target.value)} placeholder="Debt minus Cash" style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Negative = net cash</div></div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: T.cyan, fontFamily: T.mono, marginBottom: 10 }}>DISCOUNT & TERMINAL</div>
                <div className="ig4" style={{ marginBottom: 16 }}>
                  <div><div className="lbl">WACC (%)</div><input type="number" step="0.1" value={dcf.wacc || ""} onChange={e => setDF("wacc", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">TERMINAL GROWTH (%)</div><input type="number" step="0.1" value={dcf.terminalGrowth || ""} onChange={e => setDF("terminalGrowth", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">PROJECTION YRS</div><input type="number" min="1" max="20" value={dcf.projYears || ""} onChange={e => setDF("projYears", +e.target.value)} style={iS} /></div>
                  <div><div className="lbl">MARGIN OF SAFETY (%)</div><input type="number" step="1" value={dcf.marginOfSafety || ""} onChange={e => setDF("marginOfSafety", +e.target.value)} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Haircut to fair value</div></div>
                </div>

                {/* Helper Calculators */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  <button onClick={() => setShowWCalc(!showWCalc)} style={{ ...bS(T.amber), background: showWCalc ? `${T.amber}25` : `${T.amber}15` }}>
                    {showWCalc ? "\u25B2" : "\u25BC"} WACC Calculator (CAPM)
                  </button>
                  <button onClick={() => setShowNCalc(!showNCalc)} style={{ ...bS(T.amber), background: showNCalc ? `${T.amber}25` : `${T.amber}15` }}>
                    {showNCalc ? "\u25B2" : "\u25BC"} NWC Calculator
                  </button>
                </div>

                {/* WACC CALC */}
                {showWCalc && (
                  <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.amber}20`, marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, fontFamily: T.mono, marginBottom: 4 }}>WACC CALCULATOR (CAPM-BASED)</div>
                    <div style={{ fontSize: 9, color: T.textDim, marginBottom: 12, lineHeight: 1.5 }}>Ke = Rf + β × ERP &nbsp;|&nbsp; WACC = (E/V × Ke) + (D/V × Kd × (1−T))</div>
                    <div className="ig3" style={{ marginBottom: 10 }}>
                      <div><div className="lbl">RISK-FREE RATE (%)</div><input type="number" step="0.1" value={wCalc.riskFreeRate} onChange={e => setWCalc(p => ({ ...p, riskFreeRate: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>10yr Treasury yield</div></div>
                      <div><div className="lbl">BETA (β)</div><input type="number" step="0.01" value={wCalc.beta} onChange={e => setWCalc(p => ({ ...p, beta: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Levered beta</div></div>
                      <div><div className="lbl">EQUITY RISK PREM (%)</div><input type="number" step="0.1" value={wCalc.erp} onChange={e => setWCalc(p => ({ ...p, erp: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Market premium</div></div>
                    </div>
                    <div className="ig3" style={{ marginBottom: 12 }}>
                      <div><div className="lbl">COST OF DEBT (%)</div><input type="number" step="0.1" value={wCalc.costDebt} onChange={e => setWCalc(p => ({ ...p, costDebt: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Pre-tax Kd</div></div>
                      <div><div className="lbl">TAX RATE (%)</div><input type="number" step="0.1" value={wCalc.taxRateW} onChange={e => setWCalc(p => ({ ...p, taxRateW: +e.target.value }))} style={iS} /></div>
                      <div><div className="lbl">DEBT WEIGHT (% of V)</div><input type="number" step="1" value={wCalc.debtPct} onChange={e => setWCalc(p => ({ ...p, debtPct: +e.target.value }))} style={iS} /></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: T.amber, fontFamily: T.mono }}>
                        Ke = {(wCalc.riskFreeRate + wCalc.beta * wCalc.erp).toFixed(2)}% &nbsp;|&nbsp;
                        WACC = {(((100 - wCalc.debtPct) / 100) * (wCalc.riskFreeRate + wCalc.beta * wCalc.erp) + (wCalc.debtPct / 100) * wCalc.costDebt * (1 - wCalc.taxRateW / 100)).toFixed(2)}%
                      </div>
                      <button onClick={calcWACC} style={bS(T.amber)}>Apply to Model</button>
                    </div>
                  </div>
                )}

                {/* NWC CALC */}
                {showNCalc && (
                  <div style={{ padding: 16, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.amber}20`, marginBottom: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.amber, fontFamily: T.mono, marginBottom: 4 }}>NET WORKING CAPITAL CALCULATOR</div>
                    <div style={{ fontSize: 9, color: T.textDim, marginBottom: 12, lineHeight: 1.5 }}>Operating NWC = (Current Assets − Cash) − (Current Liabilities − Current Debt)</div>
                    <div className="ig3" style={{ marginBottom: 10 }}>
                      <div><div className="lbl">CURRENT ASSETS ($)</div><input type="number" value={nCalc.currentAssets || ""} onChange={e => setNCalc(p => ({ ...p, currentAssets: +e.target.value }))} style={iS} /></div>
                      <div><div className="lbl">CASH & EQUIV ($)</div><input type="number" value={nCalc.cash || ""} onChange={e => setNCalc(p => ({ ...p, cash: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Excluded from op. NWC</div></div>
                      <div><div className="lbl">CURRENT LIABILITIES ($)</div><input type="number" value={nCalc.currentLiabilities || ""} onChange={e => setNCalc(p => ({ ...p, currentLiabilities: +e.target.value }))} style={iS} /></div>
                    </div>
                    <div className="ig2" style={{ marginBottom: 12 }}>
                      <div><div className="lbl">CURRENT PORTION OF DEBT ($)</div><input type="number" value={nCalc.currentDebt || ""} onChange={e => setNCalc(p => ({ ...p, currentDebt: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>Excluded from op. NWC</div></div>
                      <div><div className="lbl">PREV PERIOD NWC ($)</div><input type="number" value={nCalc.prevNWC || ""} onChange={e => setNCalc(p => ({ ...p, prevNWC: +e.target.value }))} style={iS} /><div style={{ fontSize: 8, color: T.textDim, marginTop: 2 }}>To calculate change</div></div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 11, color: T.amber, fontFamily: T.mono }}>
                        Op. NWC: ${((nCalc.currentAssets - nCalc.cash) - (nCalc.currentLiabilities - nCalc.currentDebt)).toLocaleString()}
                      </div>
                      <button onClick={calcNWC} style={bS(T.amber)}>Calculate</button>
                    </div>
                  </div>
                )}

                <button onClick={runDCFCalc} style={{ ...bS(T.cyan), padding: "12px 28px", fontSize: 13, fontWeight: 800, width: "100%" }}>Run DCF Valuation</button>
              </div>

              {/* RESULT PANEL */}
              {dcfRes && (
                <div style={{ padding: 24, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, letterSpacing: "0.12em" }}>VALUATION RESULT {dcf.ticker && `— ${dcf.ticker}`}</span>
                    <button onClick={() => setShowRpt(true)} style={bS(T.cyan)}>Full Report</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                    <ValuationGauge value={dcfRes.gauge} size={200} label="DCF Score" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 16 }}>
                    {[
                      ["CURRENT", "$" + dcf.currentPrice.toFixed(2), T.text],
                      ["FAIR VALUE", "$" + dcfRes.fairVal.toFixed(2), T.cyan],
                      ["UPSIDE", (dcfRes.upside >= 0 ? "+" : "") + dcfRes.upside.toFixed(1) + "%", dcfRes.upside >= 0 ? T.green : T.red],
                      ["EV/EBITDA", dcfRes.impliedMultiple.toFixed(1) + "x", T.accent],
                      ["TV %", dcfRes.tvPercent.toFixed(0) + "%", T.accent],
                      ["FCF YIELD", dcfRes.fcfYield.toFixed(1) + "%", T.cyan],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", textAlign: "center" }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 17, fontWeight: 800, fontFamily: T.mono, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Range bar */}
                  <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 10 }}>PRICE RANGE</div>
                    <div style={{ position: "relative", height: 36, marginBottom: 6 }}>
                      <div style={{ position: "absolute", top: 14, left: 0, right: 0, height: 8, borderRadius: 4, background: `linear-gradient(to right, ${T.red}40, ${T.amber}40, ${T.green}40)` }} />
                      {(() => {
                        const mn = dcfRes.low * 0.8, mx = dcfRes.high * 1.2, rng = mx - mn;
                        const cp = Math.max(0, Math.min(100, ((dcf.currentPrice - mn) / rng) * 100));
                        const fp = Math.max(0, Math.min(100, ((dcfRes.fairVal - mn) / rng) * 100));
                        return (<>
                          <div style={{ position: "absolute", top: 6, left: `${cp}%`, transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: T.text, fontFamily: T.mono }}>{"\u25BC"}</div>
                          <div style={{ position: "absolute", top: 24, left: `${fp}%`, width: 3, height: 8, background: T.cyan, borderRadius: 2, transform: "translateX(-50%)" }} />
                        </>);
                      })()}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: T.mono }}>
                      <span style={{ color: T.red }}>${dcfRes.low.toFixed(2)}</span>
                      <span style={{ color: T.cyan }}>Fair: ${dcfRes.fairVal.toFixed(2)}</span>
                      <span style={{ color: T.green }}>${dcfRes.high.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════ ADMIN ════════ */}
        {page === "admin" && isAdmin && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "clamp(24px, 6vw, 30px)", fontWeight: 800 }}>Admin Dashboard</h1>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", background: `${T.amber}08`, color: T.amber, borderRadius: 4, fontFamily: T.mono }}>RESTRICTED</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
              {[["picks", "Stock Picks"], ["casestudies", "Case Studies"], ["settings", "Settings"]].map(([id, l]) => (
                <button key={id} onClick={() => setAdminTab(id)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: adminTab === id ? `${T.amber}08` : "transparent", color: adminTab === id ? T.amber : T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.mono }}>{l}</button>
              ))}
            </div>

            {/* STOCK PICKS TAB */}
            {adminTab === "picks" && (
              <div>
                <div style={{ padding: 20, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>{editP ? "EDIT PICK" : "ADD PICK"}</div>
                  <div className="ig4" style={{ marginBottom: 12 }}>
                    <div><div className="lbl">TICKER</div><input value={pT} onChange={e => setPT(e.target.value)} placeholder="AAPL" style={iS} /></div>
                    <div><div className="lbl">NAME</div><input value={pN} onChange={e => setPN(e.target.value)} placeholder="Apple Inc." style={iS} /></div>
                    <div><div className="lbl">PRICE</div><input type="number" step="0.01" value={pP} onChange={e => setPP(e.target.value)} style={iS} /></div>
                    <div><div className="lbl">SECTOR</div><input value={pSe} onChange={e => setPSe(e.target.value)} style={iS} /></div>
                  </div>
                  <div className="ig2" style={{ marginBottom: 12 }}>
                    <div>
                      <div className="lbl">SCORE: <span style={{ color: pSc >= 66 ? T.green : pSc >= 33 ? T.amber : T.red, fontWeight: 700 }}>{pSc}</span></div>
                      <input type="range" min="0" max="100" value={pSc} onChange={e => setPSc(+e.target.value)} style={{ width: "100%", height: 4, appearance: "none", background: `linear-gradient(to right, ${T.red}, ${T.amber}, ${T.green})`, borderRadius: 2, outline: "none", cursor: "pointer" }} />
                    </div>
                    <div><div className="lbl">RATING</div><select value={pR} onChange={e => setPR(e.target.value)} style={iS}><option value="BUY">BUY</option><option value="HOLD">HOLD</option><option value="SELL">SELL</option></select></div>
                  </div>
                  <div style={{ marginBottom: 12 }}><div className="lbl">NOTES</div><textarea value={pNo} onChange={e => setPNo(e.target.value)} rows={3} style={{ ...iS, resize: "vertical", lineHeight: 1.6 }} /></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addPick} style={bS(T.green)}>{editP ? "Update" : "Publish"}</button>
                    {editP && <button onClick={clearPF} style={bS(T.textDim)}>Cancel</button>}
                  </div>
                </div>
                {stockPicks.length > 0 && (
                  <div className="ryzn-table-wrap">
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <TH cols={["Ticker", "Price", "Rating", "Status", "Actions"]} />
                      <tbody>{stockPicks.map(s => (
                        <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 13, fontFamily: T.mono }}>{s.ticker}</td>
                          <td style={{ padding: "10px 14px", fontSize: 12, fontFamily: T.mono }}>${s.price?.toFixed(2)}</td>
                          <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: (s.rating === "BUY" ? T.green : s.rating === "HOLD" ? T.amber : T.red) + "10", color: s.rating === "BUY" ? T.green : s.rating === "HOLD" ? T.amber : T.red, fontFamily: T.mono }}>{s.rating}</span></td>
                          <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: s.published ? `${T.green}08` : "rgba(255,255,255,0.03)", color: s.published ? T.green : T.textDim, fontFamily: T.mono }}>{s.published ? "LIVE" : "DRAFT"}</span></td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button onClick={() => epk(s)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer", fontFamily: T.mono }}>Edit</button>
                              <button onClick={() => setStockPicks(p => p.map(x => x.id === s.id ? { ...x, published: !x.published } : x))} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: s.published ? `${T.red}08` : `${T.green}08`, color: s.published ? T.red : T.green, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: T.mono }}>{s.published ? "Hide" : "Publish"}</button>
                              <button onClick={() => { setStockPicks(p => p.filter(x => x.id !== s.id)); notify("Removed"); }} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>{"\u2715"}</button>
                            </div>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* CASE STUDIES TAB */}
            {adminTab === "casestudies" && (
              <div>
                <div style={{ padding: 20, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono }}>{editCS ? "EDIT ARTICLE" : "NEW ARTICLE"}</div>
                    <button onClick={loadTemplate} style={bS(T.amber)}>Load Template</button>
                  </div>
                  <div className="ig2" style={{ marginBottom: 12 }}>
                    <div><div className="lbl">TITLE</div><input value={csTitle} onChange={e => setCsTitle(e.target.value)} placeholder="Article title..." style={iS} /></div>
                    <div><div className="lbl">CATEGORY</div><select value={csCat} onChange={e => setCsCat(e.target.value)} style={iS}>{["Analysis", "Case Study", "Market Commentary", "Sector Research", "Earnings Review", "Strategy"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div style={{ marginBottom: 12 }}><div className="lbl">COVER IMAGE URL (optional)</div><input value={csCover} onChange={e => setCsCover(e.target.value)} placeholder="https://..." style={iS} /></div>
                  <div style={{ marginBottom: 12 }}><div className="lbl">SUMMARY</div><textarea value={csSummary} onChange={e => setCsSummary(e.target.value)} rows={2} style={{ ...iS, resize: "vertical", lineHeight: 1.6 }} placeholder="Brief preview shown on card..." /></div>

                  {/* BLOCK EDITOR */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 6 }}>
                      <div className="lbl" style={{ marginBottom: 0 }}>CONTENT BLOCKS</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => addBlock("heading")} style={{ ...bS(T.text), fontSize: 9, padding: "4px 10px" }}>+ Bold Heading</button>
                        <button onClick={() => addBlock("text")} style={{ ...bS(T.textMuted), fontSize: 9, padding: "4px 10px" }}>+ Text</button>
                        <button onClick={() => addBlock("image")} style={{ ...bS(T.cyan), fontSize: 9, padding: "4px 10px" }}>+ Image</button>
                      </div>
                    </div>
                    {csBlocks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: T.textDim, fontSize: 12, border: `1px dashed ${T.border}`, borderRadius: 8 }}>No blocks yet. Add blocks above or use "Load Template".</div>}
                    {csBlocks.map((b, i) => (
                      <div key={i} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: `1px solid ${b.type === "heading" ? "rgba(255,255,255,0.12)" : b.type === "image" ? `${T.cyan}20` : T.border}`, marginBottom: 8, position: "relative" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: b.type === "heading" ? T.text : b.type === "image" ? T.cyan : T.textMuted, fontFamily: T.mono, textTransform: "uppercase" }}>
                            {b.type === "heading" ? "\u2726 BOLD HEADING" : b.type === "image" ? "\u25A3 IMAGE" : "\u2261 TEXT BLOCK"}
                          </span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {i > 0 && <button onClick={() => moveBlock(i, -1)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, cursor: "pointer", fontSize: 10, borderRadius: 4, padding: "1px 6px", fontFamily: T.mono }}>{"\u25B2"}</button>}
                            {i < csBlocks.length - 1 && <button onClick={() => moveBlock(i, 1)} style={{ background: "none", border: `1px solid ${T.border}`, color: T.textDim, cursor: "pointer", fontSize: 10, borderRadius: 4, padding: "1px 6px", fontFamily: T.mono }}>{"\u25BC"}</button>}
                            <button onClick={() => rmBlock(i)} style={{ background: `${T.red}08`, border: `1px solid ${T.red}20`, color: T.red, cursor: "pointer", fontSize: 10, borderRadius: 4, padding: "1px 6px", fontFamily: T.mono }}>{"\u2715"}</button>
                          </div>
                        </div>
                        {b.type === "heading" && <input value={b.content} onChange={e => updBlock(i, "content", e.target.value)} placeholder="Section heading (renders bold)..." style={{ ...iS, fontWeight: 800, fontSize: 15 }} />}
                        {b.type === "text" && <textarea value={b.content} onChange={e => updBlock(i, "content", e.target.value)} rows={4} placeholder="Paragraph text..." style={{ ...iS, resize: "vertical", lineHeight: 1.7 }} />}
                        {b.type === "image" && (
                          <div>
                            <input value={b.url} onChange={e => updBlock(i, "url", e.target.value)} placeholder="Paste image URL..." style={{ ...iS, marginBottom: 6 }} />
                            <input value={b.caption || ""} onChange={e => updBlock(i, "caption", e.target.value)} placeholder="Caption (optional)" style={{ ...iS, fontSize: 11 }} />
                            {b.url && (
                              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, maxHeight: 120, position: "relative" }}>
                                <img src={b.url} alt="" style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 120 }} onError={e => e.target.style.display = "none"} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={addCS} style={bS(T.green)}>{editCS ? "Update" : "Publish"}</button>
                    {editCS && <button onClick={clearCSF} style={bS(T.textDim)}>Cancel</button>}
                  </div>
                </div>
                {caseStudies.length > 0 && (
                  <div className="ryzn-table-wrap">
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <TH cols={["Title", "Category", "Status", "Actions"]} />
                      <tbody>{caseStudies.map(cs => (
                        <tr key={cs.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cs.title}</td>
                          <td style={{ padding: "10px 14px", fontSize: 11, color: T.textMuted }}>{cs.category}</td>
                          <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: cs.published ? `${T.green}08` : "rgba(255,255,255,0.03)", color: cs.published ? T.green : T.textDim, fontFamily: T.mono }}>{cs.published ? "LIVE" : "DRAFT"}</span></td>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <button onClick={() => ecsF(cs)} style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer", fontFamily: T.mono }}>Edit</button>
                              <button onClick={() => setCaseStudies(p => p.map(x => x.id === cs.id ? { ...x, published: !x.published } : x))} style={{ padding: "4px 10px", borderRadius: 4, border: "none", background: cs.published ? `${T.red}08` : `${T.green}08`, color: cs.published ? T.red : T.green, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: T.mono }}>{cs.published ? "Hide" : "Publish"}</button>
                              <button onClick={() => { setCaseStudies(p => p.filter(x => x.id !== cs.id)); notify("Removed"); }} style={{ padding: "4px 8px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.textDim, fontSize: 10, cursor: "pointer" }}>{"\u2715"}</button>
                            </div>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {adminTab === "settings" && (
              <div style={{ padding: 24, borderRadius: 14, background: T.bgCard, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textDim, fontFamily: T.mono, marginBottom: 14 }}>DATA MANAGEMENT</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => { if (confirm("Clear all stock picks?")) { setStockPicks([]); notify("Cleared"); } }} style={bS(T.red)}>Clear Picks</button>
                  <button onClick={() => { if (confirm("Clear all articles?")) { setCaseStudies([]); notify("Cleared"); } }} style={bS(T.red)}>Clear Articles</button>
                </div>
              </div>
            )}
          </div>
        )}
        {page === "admin" && !isAdmin && (
          <div style={{ textAlign: "center", padding: "80px 16px" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.textDim, marginTop: 16 }}>Admin Access Required</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ position: "relative", zIndex: 1, borderTop: `1px solid ${T.border}`, padding: "24px 16px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textDim, fontFamily: T.mono }}>ryzn.io</span>
        </div>
        <div style={{ fontSize: 9, color: T.textDim, fontFamily: T.mono }}>AI-Powered Stock Analysis | Not Financial Advice | Educational Purposes Only</div>
      </footer>

      {/* MODALS */}
      {selectedStock && <StockPreview stock={selectedStock} onClose={() => setSelectedStock(null)} />}
      {showRpt && dcfRes && <DCFReport inp={dcf} res={dcfRes} onClose={() => setShowRpt(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap');
        @keyframes slideIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
        ::selection{background:rgba(255,255,255,0.15)}
        select{appearance:none;-webkit-appearance:none}input[type="date"]{color-scheme:dark}
        input[type="range"]::-webkit-slider-thumb{appearance:none;width:14px;height:14px;border-radius:50%;background:white;cursor:pointer;border:2px solid rgba(255,255,255,0.3)}
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
        @media(max-width:768px){.ryzn-nav{flex-wrap:wrap;gap:10px;padding:12px 16px}.ryzn-nav-links{width:100%;order:3;gap:2px;padding-bottom:4px}.ryzn-content{padding:16px 14px 60px}.ryzn-home-grid{grid-template-columns:1fr!important}.ryzn-cards-grid{grid-template-columns:1fr!important}.ryzn-table-wrap{font-size:11px}.ryzn-table-wrap table{min-width:400px}.ig2,.ig3,.ig4{grid-template-columns:1fr!important}.ryzn-dcf-layout{grid-template-columns:1fr!important}}
        @media(max-width:480px){.ryzn-nav-links button{padding:5px 8px!important;font-size:9px!important}.ryzn-logo-text{font-size:15px!important}}
      `}</style>
    </div>
  );
}
