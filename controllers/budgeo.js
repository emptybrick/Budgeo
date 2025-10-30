// controllers/budgeo.js
const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const {
  calculateVariableCost,
  pieChart,
  getSchedulesFormatted,
  getUserData,
  monthFromLocale,
  yearFromLocale,
  reasons404Expenses,
} = require("../public/js/serverUtils.js");
const parseCurrency = require("parsecurrency");

// ──────────────────────────────────────────────────────────────
// GET /:username/expenses → Main Dashboard
// ──────────────────────────────────────────────────────────────
router.get("/:username/expenses", async (req, res, next) => {
  try {
    const { username, expense: expenses, currency, path } = await getUserData(User, req);
    res.render("budgeo/index.ejs", { expenses, path, username, currency, user: currentUser });
  } catch (err) {
    console.error("Expenses page error:", err);
    return next({ statusCode: 500, reason: "UNABLE TO ACCESS EXPENSES!" });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /:username/expenses/new → New Expense Form
// ──────────────────────────────────────────────────────────────
router.get("/:username/expenses/new", async (req, res, next) => {
  try {
    const { expense: _, currency, path, username } = await getUserData(User, req);
    res.render("budgeo/new.ejs", { path, currency, username });
  } catch (err) {
    console.error("New expense form error:", err);
    return next({ statusCode: 500, reason: "UNABLE TO LOAD NEW EXPENSE FORM!" });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /:username/data → Charts + Totals
// ──────────────────────────────────────────────────────────────
router.get("/:username/data", async (req, res, next) => {
  try {
    const { username, expense: expenses, currency, path } = await getUserData(User, req);

    const pieData = await pieChart(expenses);
    const scheduleData = {
      weekly: getSchedulesFormatted(expenses, "Weekly", currency),
      monthly: getSchedulesFormatted(expenses, "Monthly", currency),
      quarterly: getSchedulesFormatted(expenses, "Quarterly", currency),
      annually: getSchedulesFormatted(expenses, "Annually", currency),
    };

    res.render("budgeo/data.ejs", {
      expenses,
      path,
      pieData,
      scheduleData,
      username,
      currency,
    });
  } catch (err) {
    console.error("Data page error:", err);
    return next({ statusCode: 500, reason: "UNABLE TO ACCESS FINANCIAL DATA!" });
  }
});

// ──────────────────────────────────────────────────────────────
// POST /:username/expenses → Create Expense
// ──────────────────────────────────────────────────────────────
router.post("/:username/expenses", async (req, res, next) => {
  try {
    const { currentUser } = await getUserData(User, req);
    const cost = parseCurrency(req.body.cost || "0").value;

    const expenseData = {
      name: req.body.name,
      type: req.body.type,
      schedule: req.body.schedule,
      cost,
      costType: req.body.costType,
      notes: req.body.notes || "",
    };

    // Handle historical data
    if (req.body.historical && Array.isArray(req.body.historical) && req.body.historical.length > 0) {
      const seen = new Set();
      const historical = req.body.historical.map(entry => {
        const month = monthFromLocale(entry.month, currentUser.currency.locale);
        const year = yearFromLocale(entry.year, currentUser.currency.locale);
        const cost = parseCurrency(entry.cost).value;

        const key = `${ month }-${ year }`;
        if (seen.has(key)) throw new Error("DUPLICATE MONTH AND YEAR IN FORM!");
        if (cost < 0 || cost > 100000000) throw new Error("INVALID COST IN FORM!");
        seen.add(key);

        return { date: new Date(Date.UTC(year, month, 1)), cost };
      }).sort((a, b) => a.date - b.date);

      const { cost: avg, high, low } = calculateVariableCost(historical);
      expenseData.cost = avg;
      expenseData.costHigh = high;
      expenseData.costLow = low;
      expenseData.historical = historical;
    }

    currentUser.budget.push(expenseData);
    await currentUser.save();

    res.redirect(`/budgeo/${ req.params.username }/expenses`);
  } catch (err) {
    console.error("Create expense error:", err);
    const reason = err.message.includes("DUPLICATE") || err.message.includes("INVALID")
      ? err.message
      : "FAILED TO ADD NEW EXPENSE!";
    return next({ statusCode: 500, reason });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /:username/expenses/:expenseId/edit
// ──────────────────────────────────────────────────────────────
router.get("/:username/expenses/:expenseId/edit", async (req, res, next) => {
  try {
    const { expense, currency, path, username } = await getUserData(User, req, "getId");
    if (!expense) {
      const reason = reasons404Expenses[ Math.floor(Math.random() * reasons404Expenses.length) ];
      return next({ statusCode: 404, reason });
    }
    res.render("budgeo/edit.ejs", { expense, currency, path, username });
  } catch (err) {
    console.error("Edit form error:", err);
    return next({ statusCode: 500, reason: "FAILED TO LOAD EDIT FORM!" });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /:username/expenses/:expenseId → Show One
// ──────────────────────────────────────────────────────────────
router.get("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currency, path, username } = await getUserData(User, req, "getId");
    if (!expense) {
      const reason = reasons404Expenses[ Math.floor(Math.random() * reasons404Expenses.length) ];
      return next({ statusCode: 404, reason });
    }
    res.render("budgeo/show.ejs", { expense, path, currency, username });
  } catch (err) {
    console.error("Show expense error:", err);
    return next({ statusCode: 500, reason: "FAILED TO LOAD EXPENSE DETAILS!" });
  }
});

// ──────────────────────────────────────────────────────────────
// PUT /:username/expenses/:expenseId → Update
// ──────────────────────────────────────────────────────────────
router.put("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      const reason = reasons404Expenses[ Math.floor(Math.random() * reasons404Expenses.length) ];
      return next({ statusCode: 404, reason });
    }

    const cost = parseCurrency(req.body.cost || "0").value;
    req.body.cost = cost;
    req.body.notes = req.body.notes || "";

    if (req.body.historical && Array.isArray(req.body.historical) && req.body.historical.length > 0) {
      const seen = new Set();
      const historical = req.body.historical.map(entry => {
        const month = monthFromLocale(entry.month, currentUser.currency.locale);
        const year = yearFromLocale(entry.year, currentUser.currency.locale);
        const cost = parseCurrency(entry.cost).value;

        const key = `${ month }-${ year }`;
        if (seen.has(key)) throw new Error("DUPLICATE MONTH AND YEAR IN DATA!");
        if (cost < 0 || cost > 100000000) throw new Error("INVALID COST!");
        seen.add(key);

        return { date: new Date(Date.UTC(year, month, 1)), cost };
      }).sort((a, b) => a.date - b.date);

      const { cost: avg, high, low } = calculateVariableCost(historical);
      req.body.cost = avg;
      req.body.costHigh = high;
      req.body.costLow = low;
      req.body.historical = historical;
    }

    expense.set(req.body);
    await currentUser.save();
    res.redirect(`/budgeo/${ req.params.username }/expenses/${ expense._id }`);
  } catch (err) {
    console.error("Update expense error:", err);
    const reason = err.message.includes("DUPLICATE") || err.message.includes("INVALID")
      ? err.message
      : "FAILED TO UPDATE EXPENSE!";
    return next({ statusCode: 500, reason });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /:username/expenses/:expenseId
// ──────────────────────────────────────────────────────────────
router.delete("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { currentUser } = await getUserData(User, req, "getId");
    const result = await currentUser.budget.pull({ _id: req.params.expenseId });
    if (!result) {
      const reason = reasons404Expenses[ Math.floor(Math.random() * reasons404Expenses.length) ];
      return next({ statusCode: 404, reason });
    }
    await currentUser.save();
    res.redirect(`/budgeo/${ req.params.username }/expenses`);
  } catch (err) {
    console.error("Delete expense error:", err);
    return next({ statusCode: 500, reason: "FAILED TO DELETE EXPENSE!" });
  }
});

// ──────────────────────────────────────────────────────────────
// DELETE /accountdeletion → Delete Account
// ──────────────────────────────────────────────────────────────
router.delete("/accountdeletion", async (req, res, next) => {
  try {
    if (!req.user) {
      return next({ statusCode: 401, reason: "NOT AUTHORIZED" });
    }

    await User.findByIdAndDelete(req.user._id);
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("budgeo.sid");
        res.render("thankyou.ejs", { username: req.user.username });
      });
    });
  } catch (err) {
    console.error("Account deletion error:", err);
    return next({
      statusCode: 500,
      reason: "FAILED TO DELETE ACCOUNT. PLEASE TRY AGAIN.",
    });
  }
});

module.exports = router;