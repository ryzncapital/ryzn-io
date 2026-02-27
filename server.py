"""
ryzn.io Backend — yfinance-powered market data server
Run:  pip install flask flask-cors yfinance
      python server.py
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import threading, time, traceback

app = Flask(__name__)
CORS(app)

_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 60


def _get_cached(key):
    with _cache_lock:
        entry = _cache.get(key)
        if entry and (time.time() - entry["ts"]) < CACHE_TTL:
            return entry["data"]
    return None


def _set_cached(key, data):
    with _cache_lock:
        _cache[key] = {"data": data, "ts": time.time()}


@app.route("/api/quotes")
def quotes():
    raw = request.args.get("symbols", "")
    if not raw:
        return jsonify([])

    symbols = [s.strip().upper() for s in raw.split(",") if s.strip()]
    cache_key = "quotes:" + ",".join(sorted(symbols))
    cached = _get_cached(cache_key)
    if cached is not None:
        return jsonify(cached)

    results = []
    for sym in symbols:
        try:
            t = yf.Ticker(sym)
            info = t.fast_info
            hist = t.history(period="2d")

            last_price = float(info.get("last_price", 0) or 0)
            prev_close = float(info.get("previous_close", 0) or 0)
            day_high = float(info.get("day_high", 0) or 0)
            day_low = float(info.get("day_low", 0) or 0)

            if last_price == 0 and len(hist) > 0:
                last_price = float(hist["Close"].iloc[-1])
            if prev_close == 0 and len(hist) > 1:
                prev_close = float(hist["Close"].iloc[-2])
            if day_high == 0 and len(hist) > 0:
                day_high = float(hist["High"].iloc[-1])
            if day_low == 0 and len(hist) > 0:
                day_low = float(hist["Low"].iloc[-1])

            change = last_price - prev_close if prev_close else 0
            change_pct = (change / prev_close * 100) if prev_close else 0

            volume = 0
            try:
                volume = int(info.get("last_volume", 0) or 0)
            except Exception:
                if len(hist) > 0:
                    volume = int(hist["Volume"].iloc[-1])

            name = sym
            try:
                full_info = t.info
                name = full_info.get("shortName") or full_info.get("longName") or sym
            except Exception:
                pass

            results.append({
                "symbol": sym,
                "name": name,
                "price": round(last_price, 2),
                "change": round(change, 2),
                "changesPercentage": round(change_pct, 2),
                "dayHigh": round(day_high, 2),
                "dayLow": round(day_low, 2),
                "previousClose": round(prev_close, 2),
                "volume": volume,
            })
        except Exception:
            traceback.print_exc()
            results.append({
                "symbol": sym, "name": sym, "price": 0,
                "change": 0, "changesPercentage": 0,
                "dayHigh": 0, "dayLow": 0, "previousClose": 0, "volume": 0,
            })

    _set_cached(cache_key, results)
    return jsonify(results)


@app.route("/api/ticker")
def ticker_info():
    sym = request.args.get("symbol", "").strip().upper()
    if not sym:
        return jsonify({"error": "No symbol provided"}), 400

    cache_key = f"ticker:{sym}"
    cached = _get_cached(cache_key)
    if cached is not None:
        return jsonify(cached)

    try:
        t = yf.Ticker(sym)
        info = t.info or {}
        fi = t.fast_info

        price = float(fi.get("last_price", 0) or 0)
        if price == 0:
            price = float(info.get("currentPrice", 0) or info.get("regularMarketPrice", 0) or 0)
        if price == 0:
            hist = t.history(period="1d")
            if len(hist) > 0:
                price = float(hist["Close"].iloc[-1])

        result = {
            "symbol": sym,
            "name": info.get("shortName") or info.get("longName") or sym,
            "price": round(price, 2),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "marketCap": info.get("marketCap", 0),
            "currency": info.get("currency", "USD"),
        }
        _set_cached(cache_key, result)
        return jsonify(result)
    except Exception:
        traceback.print_exc()
        return jsonify({"symbol": sym, "name": sym, "price": 0, "sector": "", "error": "Lookup failed"}), 404


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "source": "yfinance", "cache_ttl": CACHE_TTL})


@app.route("/api/clear-cache", methods=["POST"])
def clear_cache():
    with _cache_lock:
        _cache.clear()
    return jsonify({"status": "cache_cleared"})


if __name__ == "__main__":
    print("\n  ryzn.io backend running on http://localhost:5000")
    print("  Data source: Yahoo Finance (yfinance)")
    print("  No API key required!\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
