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
} = require("../public/js/serverUtils.js");
const parseCurrency = require("parsecurrency");

// parseCurrency is used to parse currency strings into numbers
// Example usage:
// const newValue = '5.000,00 €'
// const formattedValue = parseCurrency(newValue);

router.get("/", async (req, res) => {
  try {
    const { username, expense, currency, path } = await getUserData(User, req);
    res.render("budgeo/index.ejs", { expense, path, username, currency });
  } catch (error) {
    console.log(error);
    res.redirect("/budgeo");
  }
});

router.get("/new", async (req, res) => {
  try {
    const { expense, currency, path } = await getUserData(User, req);
    res.render("budgeo/new.ejs", { path, expense, currency });
  } catch (error) {
    console.log(error);
    res.redirect("/budgeo");
  }
});

router.get("/data", async (req, res) => {
  try {
    const { username, expense, currency, path } = await getUserData(User, req);
    const pieData = await pieChart(expense);
    const {
      formattedTotal: weeklyTotal,
      formattedHigh: weeklyHigh,
      formattedLow: weeklyLow,
    } = getSchedulesFormatted(expense, "Weekly", currency);
    const {
      formattedTotal: monthlyTotal,
      formattedHigh: monthlyHigh,
      formattedLow: monthlyLow,
    } = getSchedulesFormatted(expense, "Monthly", currency);
    const {
      formattedTotal: quarterlyTotal,
      formattedHigh: quarterlyHigh,
      formattedLow: quarterlyLow,
    } = getSchedulesFormatted(expense, "Quarterly", currency);
    const {
      formattedTotal: annuallyTotal,
      formattedHigh: annuallyHigh,
      formattedLow: annuallyLow,
    } = getSchedulesFormatted(expense, "Annually", currency);
    const scheduleData = {
      weeklyTotal,
      weeklyHigh,
      weeklyLow,
      monthlyTotal,
      monthlyHigh,
      monthlyLow,
      quarterlyTotal,
      quarterlyHigh,
      quarterlyLow,
      annuallyTotal,
      annuallyHigh,
      annuallyLow,
    };
    res.render("budgeo/data.ejs", {
      expense,
      path,
      pieData,
      scheduleData,
      username,
      currency,
    });
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo`);
  }
});

router.post("/", async (req, res) => {
  try {
    const { currentUser } = await getUserData(User, req);
    if (!req.body.cost) {
      req.body.cost = "0";
    }
    const expenseData = {
      name: req.body.name,
      type: req.body.type,
      schedule: req.body.schedule,
      cost: parseCurrency(req.body.cost).value,
      costType: req.body.costType,
      notes: req.body.notes || "", // Ensure notes is a string, default to empty if not provided
      historical: req.body.historical,
    };
    // maps historical data to a date and cost format
    // and calculates the variable cost if historical data is provided
    // and adds it to the expenseData object for later use
    // server uses UTC date and time for normalization
    if (expenseData.historical && expenseData.historical.length > 0) {
      expenseData.historical.forEach((entry) => {
        entry.month = monthFromLocale(entry.month, currentUser.currency.locale);
        entry.year = yearFromLocale(entry.year, currentUser.currency.locale);
      });
      const historical = expenseData.historical.map((entry) => ({
        date: new Date(Date.UTC(`${entry.year}`, `${entry.month}`, 1, 0, 0, 0)),
        cost: parseCurrency(entry.cost).value,
      }));
      const { cost, high, low } = calculateVariableCost(historical);
      expenseData.cost = cost;
      expenseData.costHigh = high;
      expenseData.costLow = low;
      expenseData.historical = historical.sort((a, b) => a.date - b.date);
    }
    currentUser.budget.push(expenseData);
    await currentUser.save();

    res.redirect(`/budgeo`);
  } catch (error) {
    console.log(error);
    res.redirect("/budgeo");
  }
});

router.get("/:expenseId/edit", async (req, res, next) => {
  try {
    const { expense, currency, path } = await getUserData(User, req, "getId");
    if (!expense) {
      return next();
    }
    res.render("budgeo/edit.ejs", { expense, currency, path });
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo`);
  }
});

router.get("/:expenseId", async (req, res, next) => {
  try {
    const { expense, currency, path } = await getUserData(User, req, "getId");
    if (!expense) {
      return next();
    }
    res.render("budgeo/show.ejs", { expense, path, currency });
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo`);
  }
});

router.put("/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      return next();
    }
    if (!req.body.cost) {
      req.body.cost = "0";
    }
    req.body.cost = parseCurrency(req.body.cost).value;
    req.body.notes = req.body.notes || ""; // Ensure notes is a string, default to empty if not provided

    // If historical data is provided, update it
    if (req.body.historical && req.body.historical.length > 0) {
      req.body.historical.forEach((entry) => {
        entry.month = monthFromLocale(entry.month, currentUser.currency.locale);
        entry.year = yearFromLocale(entry.year, currentUser.currency.locale);
      });
      const historical = req.body.historical.map((entry) => ({
        date: new Date(Date.UTC(`${entry.year}`, `${entry.month}`, 1, 0, 0, 0)),
        cost: parseCurrency(entry.cost).value,
      }));
      const { cost, high, low } = calculateVariableCost(historical);
      req.body.cost = cost;
      req.body.costHigh = high;
      req.body.costLow = low;
      req.body.historical = historical.sort((a, b) => a.date - b.date);
    }
    expense.set(req.body);
    await currentUser.save();
    res.redirect(`/budgeo/${expense._id}`);
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo/${req.params.expenseId}`);
  }
});

router.delete("/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      return next();
    }
    expense.deleteOne();
    await currentUser.save();
    res.redirect(`/budgeo`);
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo`);
  }
});

module.exports = router;
