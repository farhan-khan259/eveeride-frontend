import { test } from "node:test";
import assert from "node:assert/strict";
import { rupees, when } from "../src/format.js";
test("PKR formatting keeps paisa and groups thousands", () => {
  assert.equal(rupees(4250), "Rs 42.50");
  assert.equal(rupees(119000), "Rs 1,190.00");
  assert.equal(rupees(0), "Rs 0.00");
});
test("transaction dates use Pakistan time regardless of host timezone", () => {
  assert.match(when("2026-10-31T01:00:00Z"), /6:00 am/);
  assert.equal(when(null), "—");
});
