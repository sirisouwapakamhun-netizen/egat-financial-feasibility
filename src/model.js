// Financial model — BESS sizing/saving (per "BESS Feasibility Model_rev01.xlsx")
// plus cash-flow, NPV, IRR and payback calculations.
const BESS_DEFAULTS = {
    sizeKwh: 500,
    systemCostPerKwh: {
      min: 3630,
      max: 5940,
    },
    installCostPerKwh: {
      min: 5e3,
      max: 8e3,
    },
    entryFee: 12e4,
    energyKwhPerDay: 400,
    peakRate: 4.1839,
    offpeakRate: 2.6037,
    daysPerYear: 360,
    demandChargePerKw: 196.26,
    demandKw: 400,
    demandMonthsPerYear: 1,
    salvagePct: 0.1,
  },
  SCENARIO_DEFAULTS = {
    project_life: 10,
    revenue_growth: 0.02,
    om_y1: 8e3,
    om_growth: 0.005,
    other_y1: 35e3,
    other_growth: 0.01,
    discount_rate: 0.08,
    replacement_year: 0,
    replacement_cost: 0,
  },
  pickLevel = (i, e) => (typeof i == "object" && i !== null ? i[e] : i);
function calcBess(i = "min", e = {}) {
  const t = {
      ...BESS_DEFAULTS,
      ...e,
    },
    n = t.sizeKwh * pickLevel(t.systemCostPerKwh, i),
    r = t.sizeKwh * pickLevel(t.installCostPerKwh, i),
    s = n + r,
    a = s + t.entryFee,
    o = t.peakRate * t.energyKwhPerDay * t.daysPerYear,
    c = t.offpeakRate * t.energyKwhPerDay * t.daysPerYear,
    l = t.demandChargePerKw * t.demandKw * t.demandMonthsPerYear,
    u = o + c + l;
  return {
    level: i,
    systemCost: n,
    installCost: r,
    capex: s,
    investment: a,
    peakShaving: o,
    tariffManagement: c,
    demandCharge: l,
    annualSaving: u,
    salvage: a * t.salvagePct,
    simplePaybackCapex: s / u,
    assumptions: t,
  };
}
function buildBessScenario(i = "min", e = {}, t = {}) {
  const n = calcBess(i, e);
  return {
    ...SCENARIO_DEFAULTS,
    initial_investment: n.investment,
    revenue_y1: n.annualSaving,
    salvage_value: n.salvage,
    energy_y1_kwh: n.assumptions.energyKwhPerDay * 365,
    peak_rate: n.assumptions.peakRate,
    offpeak_rate: n.assumptions.offpeakRate,
    peak_energy_kwh_day: n.assumptions.energyKwhPerDay,
    decision_override: "auto",
    ...t,
  };
}
function npvAt(i, e) {
  return e.reduce((t, n, r) => t + n / Math.pow(1 + i, r), 0);
}
function irr(i, e = -0.9, t = 1) {
  const n = (o) => npvAt(o, i);
  let r = n(e),
    s = n(t),
    a = 0;
  for (; r * s > 0 && t < 10 && a < 50;) ((t += 0.5), (s = n(t)), a++);
  if (r * s > 0) return null;
  for (let o = 0; o < 200; o++) {
    const c = (e + t) / 2,
      l = n(c);
    if (Math.abs(l) < 1e-7) return c;
    r * l < 0 ? ((t = c), (s = l)) : ((e = c), (r = l));
  }
  return (e + t) / 2;
}
function paybackYears(i) {
  if (!i.length || i.some((t) => !Number.isFinite(t))) return null;
  if (i[0] >= 0) return 0;
  let e = 0;
  for (let t = 0; t < i.length; t++) {
    const n = e;
    if (((e += i[t]), e >= 0 && t > 0)) {
      const r = i[t] !== 0 ? -n / i[t] : 0;
      return t - 1 + r;
    }
  }
  return null;
}
function discountedPayback(i, e) {
  const t = e.map((n, r) => n / Math.pow(1 + i, r));
  return paybackYears(t);
}
function levelizedCost(i, e, t) {
  const n = e.reduce((s, a, o) => s + a / Math.pow(1 + i, o), 0),
    r = t.reduce((s, a, o) => s + a / Math.pow(1 + i, o), 0);
  return r === 0 ? null : n / r;
}
function buildCashflows(i) {
  const e = [];
  e.push({
    year: 0,
    revenue: 0,
    om_cost: 0,
    other_cost: 0,
    replacement: 0,
    salvage: 0,
    net_cf: -i.initial_investment,
  });
  for (let r = 1; r <= i.project_life; r++) {
    const s = i.revenue_y1 * Math.pow(1 + i.revenue_growth, r - 1),
      a = i.om_y1 * Math.pow(1 + i.om_growth, r - 1),
      o = i.other_y1 * Math.pow(1 + i.other_growth, r - 1),
      c = i.replacement_year > 0 && r === i.replacement_year ? i.replacement_cost : 0,
      l = r === i.project_life ? i.salvage_value : 0,
      u = s - a - o - c + l;
    e.push({
      year: r,
      revenue: s,
      om_cost: a,
      other_cost: o,
      replacement: c,
      salvage: l,
      net_cf: u,
    });
  }
  let t = 0,
    n = 0;
  for (const r of e)
    ((r.discount_factor = 1 / Math.pow(1 + i.discount_rate, r.year)),
      (r.present_value = r.net_cf * r.discount_factor),
      (t += r.net_cf),
      (r.cumulative = t),
      (n += r.present_value),
      (r.discounted_cumulative = n));
  return e;
}
function evaluateScenario(i) {
  const e = buildCashflows(i),
    t = e.map((b) => b.net_cf),
    n = npvAt(i.discount_rate, t),
    r = irr(t),
    s = paybackYears(t),
    a = discountedPayback(i.discount_rate, t),
    o = e.map((b) =>
      b.year === 0 ? i.initial_investment : b.om_cost + b.other_cost + b.replacement,
    ),
    c = e.map((b) => (b.year === 0 ? 0 : i.energy_y1_kwh)),
    l = levelizedCost(i.discount_rate, o, c),
    u = r != null && r > i.discount_rate ? "accept" : "reject",
    p = i.decision_override || "auto",
    h = p === "auto" ? u : p,
    f = 365,
    _ = i.peak_rate ?? 4.1839,
    M = i.offpeak_rate ?? 2.6037,
    m = i.peak_energy_kwh_day ?? 400,
    d = m * _ * f,
    y = m * M * f,
    T = d - y,
    S = [];
  let R = 0;
  for (let b = 1; b <= i.project_life; b++)
    ((R += T),
      S.push({
        year: b,
        saving: T,
        cumulative: R,
      }));
  return {
    scenario: i,
    cashflows: e,
    npv: n,
    irr: r,
    payback: s,
    discounted_payback: a,
    break_even: {
      simple: s,
      discounted: a,
      simpleFallsBelowAgain: s != null && e.some((b) => b.year > s && b.cumulative < 0),
      discountedFallsBelowAgain:
        a != null && e.some((b) => b.year > a && b.discounted_cumulative < 0),
    },
    lcoe: l,
    recommendation: u,
    decisionFinal: h,
    customer: {
      peakRate: _,
      offRate: M,
      peakKwhDay: m,
      costBeforeYear: d,
      costAfterYear: y,
      savingYear: T,
      cumulative: S,
      savingTotal: T * i.project_life,
    },
  };
}

export {
  BESS_DEFAULTS,
  SCENARIO_DEFAULTS,
  calcBess,
  buildBessScenario,
  npvAt,
  irr,
  paybackYears,
  discountedPayback,
  levelizedCost,
  buildCashflows,
  evaluateScenario,
};
