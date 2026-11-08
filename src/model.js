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
// ---------------------------------------------------------------------------
// Solar PPA and Solar + Battery
//
// Same structure as the BESS sheet: size × unit cost → investment, and
// energy × tariff → annual revenue. Solar PPA is simply the hybrid model with
// no battery, so both products share one formula.
//
// Default values are estimates for Thai C&I rooftop projects and should be
// replaced with project / EGAT figures when available. Tariffs and the BESS
// cost per kWh come from "BESS Feasibility Model_rev01.xlsx".
// ---------------------------------------------------------------------------
const SOLAR_DEFAULTS = {
  sizeKwp: 240, // installed PV capacity
  pvCostPerKwp: { min: 20000, max: 26000 }, // panels + inverter + installation (THB/kWp)
  entryFee: 120000, // same as BESS sheet
  yieldKwhPerKwp: 1350, // annual output per kWp in Thailand (approx. 1,300–1,450)
  degradation: 0.005, // PV output loss per year
  peakRate: BESS_DEFAULTS.peakRate, // TOU Peak (THB/kWh)
  offpeakRate: BESS_DEFAULTS.offpeakRate, // TOU Off-peak (THB/kWh)
  solarPeakShare: 0.71, // share of solar output in Peak hours (weekdays ≈ 5/7)
  ppaDiscount: 0.15, // PPA price discount vs. the grid tariff the customer avoids
  daytimeLoadKwhDay: null, // customer daytime use; null = all solar is used on site
  exportRate: 0, // THB/kWh for solar the site cannot use (0 = curtailed)
  tariffEscalation: 0.02, // yearly tariff growth (BESS sheet uses 2%)
  pvOmPerKwp: 400, // O&M per kWp per year
  omGrowth: 0.01,
  otherCostPct: 0.005, // insurance and other costs, share of capex per year
  otherGrowth: 0.01,
  inverterCostPerKwp: 3000, // inverter replacement cost
  inverterReplacementYear: 12,
  salvagePct: 0.05,
  projectLife: 25,
  // Battery part (used when batteryKwh > 0) — costs from BESS sheet
  batteryKwh: 0,
  batterySystemCostPerKwh: BESS_DEFAULTS.systemCostPerKwh,
  batteryInstallCostPerKwh: BESS_DEFAULTS.installCostPerKwh,
  depthOfDischarge: 0.9,
  roundTripEfficiency: 0.9,
  cycleDaysPerYear: BESS_DEFAULTS.daysPerYear,
  batteryOmPerYear: 8000, // BESS sheet O&M
  batteryReplacementPct: 0.6, // battery replacement, share of battery system cost
  batteryReplacementYear: 10,
  demandChargePerKw: BESS_DEFAULTS.demandChargePerKw,
  demandKw: BESS_DEFAULTS.demandKw,
  demandMonthsPerYear: BESS_DEFAULTS.demandMonthsPerYear,
};
const HYBRID_DEFAULTS = {
  ...SOLAR_DEFAULTS,
  sizeKwp: 500,
  daytimeLoadKwhDay: 1400, // solar above this is stored in the battery
  batteryKwh: 500,
  projectLife: 20,
};

// Grid tariff a customer avoids per solar kWh (weighted Peak / Off-peak)
const solarAvoidedRate = (peakRate, offpeakRate, peakShare = SOLAR_DEFAULTS.solarPeakShare) =>
  peakShare * peakRate + (1 - peakShare) * offpeakRate;

function calcSolarStorage(level = "min", overrides = {}, base = SOLAR_DEFAULTS) {
  const a = { ...base, ...overrides };
  const hasBattery = a.batteryKwh > 0;

  // Investment
  const pvCapex = a.sizeKwp * pickLevel(a.pvCostPerKwp, level);
  const batterySystemCost = a.batteryKwh * pickLevel(a.batterySystemCostPerKwh, level);
  const batteryCapex = batterySystemCost + a.batteryKwh * pickLevel(a.batteryInstallCostPerKwh, level);
  const capex = pvCapex + batteryCapex;
  const investment = capex + a.entryFee;

  // Energy (year 1)
  const solarKwhYear = a.sizeKwp * a.yieldKwhPerKwp;
  const solarKwhDay = solarKwhYear / 365;
  const loadKwhDay = a.daytimeLoadKwhDay ?? Infinity;
  const excessKwhDay = Math.max(0, solarKwhDay - loadKwhDay);
  const storedKwhDay = hasBattery ? Math.min(excessKwhDay, a.batteryKwh * a.depthOfDischarge) : 0;
  const deliveredKwhDay = storedKwhDay * a.roundTripEfficiency;
  const storedKwhYear = storedKwhDay * a.cycleDaysPerYear;
  const batteryKwhYear = deliveredKwhDay * a.cycleDaysPerYear;
  const exportKwhYear = excessKwhDay * 365 - storedKwhYear;
  const directKwhYear = solarKwhYear - excessKwhDay * 365;

  // Prices
  const avoidedRate = solarAvoidedRate(a.peakRate, a.offpeakRate, a.solarPeakShare);
  const ppaRate = avoidedRate * (1 - a.ppaDiscount); // daytime solar
  const ppaPeakRate = a.peakRate * (1 - a.ppaDiscount); // battery output in evening Peak

  // Revenue (year 1)
  const directRevenue = directKwhYear * ppaRate;
  const batteryRevenue = batteryKwhYear * ppaPeakRate;
  const demandCharge = hasBattery ? a.demandChargePerKw * a.demandKw * a.demandMonthsPerYear : 0;
  const exportRevenue = exportKwhYear * a.exportRate;
  const annualRevenue = directRevenue + batteryRevenue + demandCharge + exportRevenue;

  // Customer saving vs. buying the same energy from the grid
  const customerSaving =
    directKwhYear * (avoidedRate - ppaRate) + batteryKwhYear * (a.peakRate - ppaPeakRate);

  // Costs
  const omY1 = a.sizeKwp * a.pvOmPerKwp + (hasBattery ? a.batteryOmPerYear : 0);
  const otherY1 = capex * a.otherCostPct;
  // One replacement event: battery (hybrid) or inverter (solar); hybrid replaces both together
  const inverterCost = a.sizeKwp * a.inverterCostPerKwp;
  const replacementYear = hasBattery ? a.batteryReplacementYear : a.inverterReplacementYear;
  const replacementCost = (hasBattery ? batterySystemCost * a.batteryReplacementPct : 0) + inverterCost;

  return {
    level,
    pvCapex,
    batteryCapex,
    capex,
    investment,
    solarKwhYear,
    directKwhYear,
    storedKwhYear,
    batteryKwhYear,
    exportKwhYear,
    deliveredKwhDay,
    avoidedRate,
    ppaRate,
    ppaPeakRate,
    directRevenue,
    batteryRevenue,
    demandCharge,
    exportRevenue,
    annualRevenue,
    customerSaving,
    // Revenue changes with tariff growth and PV degradation together
    revenueGrowth: (1 + a.tariffEscalation) * (1 - a.degradation) - 1,
    omY1,
    otherY1,
    replacementYear: replacementYear < a.projectLife ? replacementYear : 0,
    replacementCost: replacementYear < a.projectLife ? replacementCost : 0,
    salvage: investment * a.salvagePct,
    assumptions: a,
  };
}
const calcSolar = (level = "min", overrides = {}) =>
  calcSolarStorage(level, overrides, SOLAR_DEFAULTS);
const calcHybrid = (level = "min", overrides = {}) =>
  calcSolarStorage(level, overrides, HYBRID_DEFAULTS);

function toScenario(r, extra) {
  return {
    ...SCENARIO_DEFAULTS,
    project_life: r.assumptions.projectLife,
    initial_investment: r.investment,
    revenue_y1: r.annualRevenue,
    revenue_growth: r.revenueGrowth,
    om_y1: r.omY1,
    om_growth: r.assumptions.omGrowth,
    other_y1: r.otherY1,
    other_growth: r.assumptions.otherGrowth,
    salvage_value: r.salvage,
    replacement_year: r.replacementYear,
    replacement_cost: r.replacementCost,
    energy_y1_kwh: r.solarKwhYear,
    peak_rate: r.assumptions.peakRate,
    offpeak_rate: r.assumptions.offpeakRate,
    decision_override: "auto",
    ...extra,
  };
}
const buildSolarScenario = (level = "min", overrides = {}, extra = {}) => {
  const r = calcSolar(level, overrides);
  return toScenario(r, extra);
};
const buildHybridScenario = (level = "min", overrides = {}, extra = {}) => {
  const r = calcHybrid(level, overrides);
  return toScenario(r, { peak_energy_kwh_day: Math.round(r.deliveredKwhDay), ...extra });
};

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
  SOLAR_DEFAULTS,
  HYBRID_DEFAULTS,
  calcBess,
  buildBessScenario,
  solarAvoidedRate,
  calcSolarStorage,
  calcSolar,
  calcHybrid,
  buildSolarScenario,
  buildHybridScenario,
  npvAt,
  irr,
  paybackYears,
  discountedPayback,
  levelizedCost,
  buildCashflows,
  evaluateScenario,
};
