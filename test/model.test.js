// Checks the financial model against "BESS Feasibility Model_rev01.xlsx"
// (values from the workbook's Summary_min / Summary_max sheets).
// Note: the workbook's "Simple Payback Period" cell is a hard-coded formula
// (=4+(580836/1013402)) that no longer matches its own Cash Flow sheet, so the
// expected payback here is recomputed from the Cash Flow sheet's net cash flows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calcBess, buildBessScenario, evaluateScenario } from "../src/model.js";

const close = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);

test("BESS sheet: investment and annual saving", () => {
  const min = calcBess("min");
  const max = calcBess("max");
  close(min.investment, 4_435_000, 0.01, "Inputs_min!B4");
  close(max.investment, 7_090_000, 0.01, "Inputs_max!B4");
  close(min.annualSaving, 1_055_918.4, 0.01, "BESS!B29");
  close(min.peakShaving, 602_481.6, 0.01, "BESS!B25");
  close(min.tariffManagement, 374_932.8, 0.01, "BESS!C27");
  close(min.demandCharge, 78_504, 0.01, "BESS!B28");
});

for (const [level, irr, npv, payback] of [
  ["min", 0.2101418024601196, 3133435.5502206367, 4.2342],
  ["max", 0.09711713544015721, 601413.4213071205, 6.606],
]) {
  test(`Summary_${level}: IRR, NPV, simple payback`, () => {
    const r = evaluateScenario(buildBessScenario(level));
    close(r.irr, irr, 1e-6, "IRR");
    close(r.npv, npv, 0.01, "NPV");
    close(r.payback, payback, 1e-3, "Simple payback");
  });
}
