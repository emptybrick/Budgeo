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
  reasonsByGrokExpenses,
} = require("../public/js/serverUtils.js");
const parseCurrency = require("parsecurrency");

// parseCurrency is used to parse currency strings into numbers
// Example usage:
// const newValue = '5.000,00 €'
// const formattedValue = parseCurrency(newValue);

// router.use(isSignedIn)

router.get("/:username/expenses", async (req, res, next) => {
  try {
    const { username, expense, currency, path } = await getUserData(User, req);
    res.render("budgeo/index.ejs", { expense, path, username, currency });
  } catch (error) {
    console.log(error);
    res.redirect("/budgeo");
  }
});

router.get("/:username/expenses/new", async (req, res) => {
  try {
    const { expense, currency, path, username } = await getUserData(User, req);
    res.render("budgeo/new.ejs", { path, expense, currency, username });
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  }
});

router.get("/:username/data", async (req, res) => {
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
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  }
});

router.post("/:username/expenses", async (req, res) => {
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
    // has a check to make sure no dupe month-year combos and cost field is valid
    if (expenseData.historical && expenseData.historical.length > 0) {
      let monthYearCombinations = [];
      expenseData.historical.forEach((entry) => {
        entry.month = monthFromLocale(entry.month, currentUser.currency.locale);
        entry.year = yearFromLocale(entry.year, currentUser.currency.locale);
        entry.cost = parseCurrency(entry.cost).value;
        const monthYear = `${entry.month}-${entry.year}`;
        if (!monthYearCombinations.includes(monthYear)) {
          monthYearCombinations.push(monthYear);
        } else {
          throw new Error("Duplicate month and year in data!");
        }
        if (entry.cost < 0 || !Number(entry.cost) || entry.cost > 100000000) {
          throw new Error("Invalid Cost!");
        }
      });
      const historical = expenseData.historical.map((entry) => ({
        date: new Date(Date.UTC(`${entry.year}`, `${entry.month}`, 1, 0, 0, 0)),
        cost: entry.cost,
      }));
      const { cost, high, low } = calculateVariableCost(historical);
      expenseData.cost = cost;
      expenseData.costHigh = high;
      expenseData.costLow = low;
      expenseData.historical = historical.sort((a, b) => a.date - b.date);
    }

    currentUser.budget.push(expenseData);
    await currentUser.save();

    res.redirect(`/budgeo/${req.params.username}/expenses`);
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  }
});

router.get("/:username/expenses/:expenseId/edit", async (req, res, next) => {
  try {
    const { expense, currency, path, username } = await getUserData(
      User,
      req,
      "getId"
    );
    if (!expense) {
      const err = {
        statusCode: 404,
        reason: reasonsByGrokExpenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    res.render("budgeo/edit.ejs", { expense, currency, path, username });
  } catch (error) {
    console.log(error);
    res.redirect(
      `/budgeo/${req.params.username}/expenses/${req.params.expenseId}`
    );
  }
});

router.get("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currency, path, username } = await getUserData(
      User,
      req,
      "getId"
    );
    if (!expense) {
      const err = {
        statusCode: 404,
        reason: reasonsByGrokExpenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    res.render("budgeo/show.ejs", { expense, path, currency, username });
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  }
});

router.put("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      const err = {
        statusCode: 404,
        reason: reasonsByGrokExpenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    if (!req.body.cost) {
      req.body.cost = "0";
    }
    req.body.cost = parseCurrency(req.body.cost).value;
    req.body.notes = req.body.notes || ""; // Ensure notes is a string, default to empty if not provided

    // If historical data is provided, update it
    // same setup as the post new code checks validity
    if (req.body.historical && req.body.historical.length > 0) {
      let monthYearCombinations = [];
      req.body.historical.forEach((entry) => {
        entry.month = monthFromLocale(entry.month, currentUser.currency.locale);
        entry.year = yearFromLocale(entry.year, currentUser.currency.locale);
        entry.cost = parseCurrency(entry.cost).value;
        const monthYear = `${entry.month}-${entry.year}`;
        if (!monthYearCombinations.includes(monthYear)) {
          monthYearCombinations.push(monthYear);
        } else {
          throw new Error("Duplicate month and year in data!");
        }
        if (entry.cost < 0 || !Number(entry.cost) || entry.cost > 100000000) {
          throw new Error("Invalid Cost!");
        }
      });
      const historical = req.body.historical.map((entry) => ({
        date: new Date(Date.UTC(`${entry.year}`, `${entry.month}`, 1, 0, 0, 0)),
        cost: entry.cost,
      }));
      const { cost, high, low } = calculateVariableCost(historical);
      req.body.cost = cost;
      req.body.costHigh = high;
      req.body.costLow = low;
      req.body.historical = historical.sort((a, b) => a.date - b.date);
    }
    expense.set(req.body);
    await currentUser.save();
    res.redirect(`/budgeo/${req.params.username}/expenses/${expense._id}`);
  } catch (error) {
    console.log(error);
    res.redirect(
      `/budgeo/${req.params.username}/expenses/${req.params.expenseId}`
    );
  }
});

router.delete("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      const err = {
        statusCode: 404,
        reason: reasonsByGrokExpenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    expense.deleteOne();
    await currentUser.save();
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  } catch (error) {
    console.log(error);
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  }
});

router.delete("/accountdeletion", async (req, res, next) => {
  try {
    const username = req.session.user.username;
    await User.findByIdAndDelete(req.session.user._id);
    
    try {
      req.session.destroy((err) => {
        if (err) {
          console.log("Session destruction error:", err);
        }
        res.clearCookie("budgeo.sid"); // Clear the session cookie
        res.render("thankyou.ejs", { username });
      });
    } catch (error) {
      console.log("Session destruction error:", error);
      const err = {
        statusCode: 500,
        reason:
          "SOMETHING WENT WRONG WITH TRYING TO DELETE YOUR ACCOUNT. PLEASE TRY AGAIN LATER.",
      };
      next(err);
    }
  } catch (error) {
    console.log("User find and delete error: ", error);
    const err = {
      statusCode: 404,
      reason: "USER DOES NOT EXIST",
    };
    next(err);
  }
});

module.exports = router;
