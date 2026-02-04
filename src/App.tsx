import { useState } from "react";

interface LineItem {
  rate: string;
  qty: string;
}

interface StoneRow {
  id: string;
  stoneSetting: string;
  stonePrice: string;
  qty: string;
}

const STONE_PROFIT_MULTIPLIER = 1.5; // 50% net profit on stone
const ESTIMATE_14K_PROFIT = 15; // 14k estimate uses fixed 15% profit
const ESTIMATE_14K_GOLD_OFFSET = 1000; // subtract from price of gold for 14k

// Loss % added to grams (accommodate process loss)
const GOLD_LOSS: Record<"yellow" | "whiteRose", number> = {
  yellow: 0.1,   // Yellow Gold 10%
  whiteRose: 0.2, // White Gold & Rose Gold 20%
};

const LINE_ITEMS = [
  { id: "goldsmith", label: "Labor: Goldsmith" },
  { id: "polishPlating", label: "Polish & Gold Plating" },
  { id: "laserEngrave", label: "Laser Engrave" },
] as const;

const QUOTATION_PASSWORD = "feliz&co2025";
const UNLOCK_KEY = "feliz_quotation_unlocked";

function parseNum(s: string): number {
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function App() {
  const [unlocked, setUnlocked] = useState(() =>
    typeof sessionStorage !== "undefined" && sessionStorage.getItem(UNLOCK_KEY) === "true"
  );
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [priceOfGold, setPriceOfGold] = useState("");
  const [grams, setGrams] = useState("");
  const [goldType, setGoldType] = useState<"yellow" | "whiteRose">("yellow");
  const [lines, setLines] = useState<Record<string, LineItem>>(() =>
    LINE_ITEMS.reduce(
      (acc, { id }) => ({ ...acc, [id]: { rate: "", qty: "" } }),
      {} as Record<string, LineItem>
    )
  );
  const [stones, setStones] = useState<StoneRow[]>([
    { id: crypto.randomUUID(), stoneSetting: "", stonePrice: "", qty: "" },
  ]);

  const priceGold = parseNum(priceOfGold);
  const gramsNum = parseNum(grams);
  const gramsWithLoss = gramsNum * (1 + GOLD_LOSS[goldType]);
  const lineTotals = LINE_ITEMS.map(({ id }) => {
    const { rate, qty } = lines[id] ?? { rate: "", qty: "" };
    return parseNum(rate) * parseNum(qty);
  });
  const fixedLinesSum = lineTotals.reduce((a, b) => a + b, 0);
  const stoneTotalRaw = stones.reduce(
    (sum, row) =>
      sum + (parseNum(row.stoneSetting) + parseNum(row.stonePrice)) * parseNum(row.qty),
    0
  );
  const stoneTotalWithProfit = stoneTotalRaw * STONE_PROFIT_MULTIPLIER;

  // Raw cost = gold + services only (no stones). Margin applied to raw; stones have own margin.
  const goldTotal14k = Math.max(0, priceGold - ESTIMATE_14K_GOLD_OFFSET) * gramsWithLoss;
  const rawCost14k = goldTotal14k + fixedLinesSum;
  const withMargin14k = rawCost14k * (1 + ESTIMATE_14K_PROFIT / 100);
  const final14k = withMargin14k + stoneTotalWithProfit;
  const downpayment14k = final14k * (final14k > 50000 ? 0.7 : 0.5);

  const goldTotal18k = priceGold * gramsWithLoss;
  const rawCost18k = goldTotal18k + fixedLinesSum;
  const withMargin18k = rawCost18k * 1.25;
  const final18k = withMargin18k + stoneTotalWithProfit;
  const downpayment18k = final18k * (final18k > 50000 ? 0.7 : 0.5);

  function updateLine(id: string, field: "rate" | "qty", value: string) {
    setLines((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  function addStone() {
    setStones((prev) => [
      ...prev,
      { id: crypto.randomUUID(), stoneSetting: "", stonePrice: "", qty: "" },
    ]);
  }

  function updateStone(id: string, field: keyof Omit<StoneRow, "id">, value: string) {
    setStones((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  }

  function removeStone(id: string) {
    setStones((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (passwordInput === QUOTATION_PASSWORD) {
      sessionStorage.setItem(UNLOCK_KEY, "true");
      setUnlocked(true);
    } else {
      setPasswordError("Incorrect password");
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-black mb-1">Feliz — Quotation</h1>
          <p className="text-sm text-neutral-600 mb-4">Enter password to access</p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
              autoFocus
            />
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full rounded border border-black bg-black text-white py-2 text-sm font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              Access quotation
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold text-black">
          Feliz — Quotation
        </h1>

        <div className="w-full rounded-lg border border-neutral-200 bg-white overflow-hidden">
          <section>
            <h2 className="text-sm font-semibold text-black border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              1. Gold
            </h2>
            <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Price of gold
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={priceOfGold}
                  onChange={(e) => setPriceOfGold(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Grams
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full rounded border border-neutral-300 bg-white px-3 py-2 text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="0"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-black mb-1">
                  Gold type (loss)
                </label>
                <select
                  value={goldType}
                  onChange={(e) => setGoldType(e.target.value as "yellow" | "whiteRose")}
                  className="w-full max-w-xs rounded border border-neutral-300 bg-white px-3 py-2 text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                >
                  <option value="yellow">Yellow Gold (10% loss)</option>
                  <option value="whiteRose">White Gold & Rose Gold (20% loss)</option>
                </select>
              </div>
            </div>
          </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-black border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              2. Services
            </h2>
            <div className="p-4 sm:p-6">
            <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider mb-3">
              Rate × Qty
            </p>
            <div className="space-y-3">
              {LINE_ITEMS.map(({ id, label }) => (
                <div
                  key={id}
                  className="grid grid-cols-[1fr_80px_80px_80px] sm:grid-cols-[1fr_100px_100px_100px] gap-2 items-end"
                >
                  <label className="text-sm text-black truncate pr-2">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={lines[id]?.rate ?? ""}
                    onChange={(e) => updateLine(id, "rate", e.target.value)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Rate"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={lines[id]?.qty ?? ""}
                    onChange={(e) => updateLine(id, "qty", e.target.value)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Qty"
                  />
                  <div className="text-sm font-medium text-black tabular-nums">
                    {(parseNum(lines[id]?.rate ?? "") * parseNum(lines[id]?.qty ?? "")).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-black border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              3. Stones
            </h2>
            <div className="p-4 sm:p-6">
            <p className="text-xs font-medium text-neutral-600 uppercase tracking-wider mb-3">
              Stone Setting · Stone Price · Qty (50% margin)
            </p>
            <div className="space-y-2">
              {stones.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[1fr_80px_80px_auto] sm:grid-cols-[1fr_100px_100px_auto] gap-2 items-end"
                >
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.stoneSetting}
                    onChange={(e) => updateStone(row.id, "stoneSetting", e.target.value)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Stone Setting"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.stonePrice}
                    onChange={(e) => updateStone(row.id, "stonePrice", e.target.value)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Price"
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={row.qty}
                    onChange={(e) => updateStone(row.id, "qty", e.target.value)}
                    className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder="Qty"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black tabular-nums min-w-[3rem]">
                      {((parseNum(row.stoneSetting) + parseNum(row.stonePrice)) * parseNum(row.qty) * STONE_PROFIT_MULTIPLIER).toFixed(2)}
                      <span className="text-neutral-500 text-xs ml-0.5">(50%)</span>
                    </span>
                    {stones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStone(row.id)}
                        className="text-neutral-500 hover:text-black text-xs underline focus:outline-none"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addStone}
              className="text-sm mt-2 font-medium text-black border border-neutral-300 rounded px-3 py-1.5 hover:bg-neutral-100 focus:outline-none focus:ring-1 focus:ring-black"
            >
              Add stone
            </button>
          </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-black border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              Summary
            </h2>
            <div className="p-4 sm:p-6 space-y-1">
            <div className="flex justify-between text-sm text-neutral-800">
              <span>Services total (raw)</span>
              <span className="tabular-nums font-medium">{fixedLinesSum.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-neutral-800">
              <span>Stone cost (50% margin)</span>
              <span className="tabular-nums font-medium">{stoneTotalWithProfit.toFixed(2)}</span>
            </div>
          </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-black border-b border-neutral-200 px-4 py-3 bg-neutral-50">
              Quotation (14k · 18k)
            </h2>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2 shadow-sm">
                  <h3 className="text-sm font-semibold text-amber-800">14k estimate</h3>
                  <p className="text-xs text-neutral-500">Gold: (price − 1,000) × grams · 15% on raw</p>
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>Raw cost (gold + services)</span>
                    <span className="tabular-nums font-medium text-neutral-800">{rawCost14k.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">Profit (15%)</span>
                    <span className="tabular-nums font-medium text-emerald-700">+{(withMargin14k - rawCost14k).toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm text-teal-700">
                    <span>Stone cost (50% margin)</span>
                    <span className="tabular-nums font-medium">{stoneTotalWithProfit.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-black py-1.5 px-2 rounded bg-neutral-100">
                    <span>Final quote</span>
                    <span className="tabular-nums">{final14k.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Downpayment ({final14k > 50000 ? "70" : "50"}%)</span>
                    <span className="tabular-nums font-medium text-blue-700">{downpayment14k.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-neutral-200">
                    <span className="text-amber-700">Balance due</span>
                    <span className="tabular-nums text-amber-700">{(final14k - downpayment14k).toFixed(2)} PHP</span>
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-4 space-y-2 shadow-sm">
                  <h3 className="text-sm font-semibold text-amber-800">18k</h3>
                  <p className="text-xs text-neutral-500">Gold: price × grams · 25% on raw</p>
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>Raw cost (gold + services)</span>
                    <span className="tabular-nums font-medium text-neutral-800">{rawCost18k.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">Profit (25%)</span>
                    <span className="tabular-nums font-medium text-emerald-700">+{(withMargin18k - rawCost18k).toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm text-teal-700">
                    <span>Stone cost (50% margin)</span>
                    <span className="tabular-nums font-medium">{stoneTotalWithProfit.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-black py-1.5 px-2 rounded bg-neutral-100">
                    <span>Final quote</span>
                    <span className="tabular-nums">{final18k.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">Downpayment ({final18k > 50000 ? "70" : "50"}%)</span>
                    <span className="tabular-nums font-medium text-blue-700">{downpayment18k.toFixed(2)} PHP</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-neutral-200">
                    <span className="text-amber-700">Balance due</span>
                    <span className="tabular-nums text-amber-700">{(final18k - downpayment18k).toFixed(2)} PHP</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default App;
