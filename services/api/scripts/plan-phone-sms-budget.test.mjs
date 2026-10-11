import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { planPhoneSmsBudget } from "./plan-phone-sms-budget.mjs";

test("keeps reviewed demand below both warning thresholds", () => {
    const plan = planPhoneSmsBudget({
        peakHourSends: 40,
        peakDaySends: 100,
        estimatedCentsPerSend: 12,
        maxHourCents: 1000,
        maxDayCents: 3000,
    });
    assert.deepEqual(plan.policy, {
        hourlySendLimit: 54,
        dailySendLimit: 134,
        estimatedCentsPerSend: 12,
        hourlyBudgetCents: 1000,
        dailyBudgetCents: 3000,
        monthlyBudgetCents: 10000,
        warningPercent: 75,
    });
    assert.equal(plan.hourly.firstWarningSend, 41);
    assert.equal(plan.daily.firstWarningSend, 101);
    assert.equal(plan.hourly.maximumEstimatedCents, 648);
});

test("refuses a spend allowance that pauses registration before planned demand", () => {
    assert.throws(
        () =>
            planPhoneSmsBudget({
                peakHourSends: 40,
                peakDaySends: 100,
                estimatedCentsPerSend: 12,
                maxHourCents: 500,
                maxDayCents: 3000,
            }),
        /Hourly plan:.*warning at send 32/,
    );
});

test("requires daily values to cover the hourly window and rejects integer overflow", () => {
    assert.throws(
        () =>
            planPhoneSmsBudget({
                peakHourSends: 10,
                peakDaySends: 9,
                estimatedCentsPerSend: 10,
                maxHourCents: 1000,
                maxDayCents: 1000,
            }),
        /Daily demand/,
    );
    assert.throws(
        () =>
            planPhoneSmsBudget({
                peakHourSends: 2_147_483_647,
                peakDaySends: 2_147_483_647,
                estimatedCentsPerSend: 1,
                maxHourCents: 2_147_483_647,
                maxDayCents: 2_147_483_647,
            }),
        /database integer range/,
    );
});

test("CLI has no side effects and emits a disabled policy insert only for feasible plans", () => {
    const command = [
        "scripts/plan-phone-sms-budget.mjs",
        "--peak-hour-sends",
        "40",
        "--peak-day-sends",
        "100",
        "--estimated-cents-per-send",
        "12",
        "--max-hour-cents",
        "1000",
        "--max-day-cents",
        "3000",
    ];
    const good = spawnSync(process.execPath, command, {
        cwd: import.meta.dirname + "/..",
        encoding: "utf8",
    });
    assert.equal(good.status, 0);
    assert.match(good.stdout, /1, false, 54, 134/);

    const bad = spawnSync(
        process.execPath,
        command.map((part, index) =>
            index === command.indexOf("--max-hour-cents") + 1 ? "500" : part,
        ),
        {
            cwd: import.meta.dirname + "/..",
            encoding: "utf8",
        },
    );
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /Hourly plan:/);
    assert.doesNotMatch(bad.stdout, /INSERT INTO/);
});

test("enforces an explicitly reviewed monthly forecast and emits the monthly ceiling", () => {
    const values = {
        peakHourSends: 2,
        peakDaySends: 4,
        estimatedCentsPerSend: 100,
        maxHourCents: 500,
        maxDayCents: 1000,
        maxMonthCents: 3000,
    };
    const plan = planPhoneSmsBudget({ ...values, peakMonthSends: 20 });
    assert.equal(plan.policy.monthlyBudgetCents, 3000);
    assert.equal(plan.monthly.firstWarningSend, 23);
    assert.equal(plan.monthly.maximumSends, 30);
    assert.throws(
        () => planPhoneSmsBudget({ ...values, peakMonthSends: 23 }),
        /Monthly plan:/,
    );
    assert.throws(
        () => planPhoneSmsBudget({ ...values, maxMonthCents: 0 }),
        /max-month-cents/,
    );
});
