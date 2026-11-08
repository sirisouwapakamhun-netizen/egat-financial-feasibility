// Solar PPA and Solar + Battery formulas (src/model.js), checked step by step
// against the same arithmetic written out by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcSolar, calcHybrid, buildSolarScenario, evaluateScenario } from "../src/model.js";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const avoided = 0.71 * 4.1839 + 0.29 * 2.6037; // weighted grid tariff ≈ 3.7256

test("Solar PPA (min): investment, energy, revenue, costs", () => {
  const r = calcSolar("min");
  close(r.investment, 240 * 20000 + 120000, 0.01, "investment");
  close(r.solarKwhYear, 240 * 1350, 0.01, "energy");
  close(r.ppaRate, avoided * 0.85, 1e-9, "PPA rate");
  close(r.annualRevenue, 240 * 1350 * avoided * 0.85, 0.01, "revenue");
  close(r.customerSaving, 240 * 1350 * avoided * 0.15, 0.01, "customer saving");
  close(r.omY1, 240 * 400, 0.01, "O&M");
  close(r.otherY1, 240 * 20000 * 0.005, 0.01, "other");
  close(r.revenueGrowth, 1.02 * 0.995 - 1, 1e-12, "growth");
  assert.equal(r.replacementYear, 12);
  close(r.replacementCost, 240 * 3000, 0.01, "inverter");
  assert.equal(r.batteryCapex, 0);
  assert.equal(r.demandCharge, 0);
});

test("Solar + Battery (min): energy split and revenue", () => {
  const r = calcHybrid("min");
  const solarDay = (500 * 1350) / 365;
  const excessDay = solarDay - 1400;
  const storedDay = Math.min(excessDay, 500 * 0.9);
  close(r.investment, 500 * 20000 + 500 * (3630 + 5000) + 120000, 0.01, "investment");
  close(r.directKwhYear, 1400 * 365, 0.01, "direct kWh");
  close(r.batteryKwhYear, storedDay * 0.9 * 360, 0.01, "battery kWh");
  close(
    r.annualRevenue,
    1400 * 365 * avoided * 0.85 + storedDay * 0.9 * 360 * 4.1839 * 0.85 + 196.26 * 400,
    0.01,
    "revenue",
  );
  assert.equal(r.replacementYear, 10);
  close(r.replacementCost, 500 * 3630 * 0.6 + 500 * 3000, 0.01, "battery + inverter");
});

test("All solar is used on site when there is no load limit", () => {
  const r = calcSolar("min");
  assert.equal(r.exportKwhYear, 0);
  assert.equal(r.directKwhYear, r.solarKwhYear);
});

test("Solar PPA scenario runs through the cash-flow engine", () => {
  const s = buildSolarScenario("min");
  const r = evaluateScenario(s);
  assert.equal(r.cashflows.length, 26); // year 0..25
  close(r.cashflows[12].replacement, 720000, 0.01, "year-12 inverter");
  assert.ok(r.irr > 0.15 && r.irr < 0.25, `IRR ${r.irr}`);
});
