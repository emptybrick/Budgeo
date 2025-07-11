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

router.get("/:username/expenses", async (req, res) => {
  try {
    const { username, expense, currency, path } = await getUserData(User, req);
    res.render("budgeo/index.ejs", { expense, path, username, currency });
  } catch (error) {
    console.log(error);
    // res.redirect("/budgeo");
    const err = {
      statusCode: 500,
      reason: "UNABLE TO ACCESS EXPENSES!",
    };
    return next(err);
  }
});

router.get("/:username/expenses/new", async (req, res) => {
  try {
    const { expense, currency, path, username } = await getUserData(User, req);
    res.render("budgeo/new.ejs", { path, expense, currency, username });
  } catch (error) {
    console.log(error);
    // res.redirect(`/budgeo/${req.params.username}/expenses`);
    const err = {
      statusCode: 500,
      reason: "UNABLE ACCESS THE NEW EXPENSE FORM!",
    };
    return next(err);
  }
});

router.get("/:username/data", async (req, res) => {
  try {
    const { username, expense, currency, path } = await getUserData(User, req);
    // functions to get data for piechart and totals for estimates
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
    // sets an object with all the formatted totals to use in data.ejs
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
    // res.redirect(`/budgeo/${req.params.username}/expenses`);
    const err = {
      statusCode: 500,
      reason: "UNABLE TO ACCESS FINANCIAL DATA!",
    };
    return next(err);
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
    // parseCurrency is used to return a number from locale string
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
          throw new Error("DUPLICATE MONTH AND YEAR IN FORM!");
        }
        if (entry.cost < 0 || !Number(entry.cost) || entry.cost > 100000000) {
          throw new Error("INVALID COST IN FORM!");
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
    let e;
    if (
      error === "DUPLICATE MONTH AND YEAR IN FORM!" ||
      error === "INVALID COST IN FORM!"
    ) {
      e = error;
    } else {
      e = "FAILED TO ADD NEW EXPENSE!";
    }
    const err = {
      statusCode: 500,
      reason: e,
    };
    return next(err);
    // res.redirect(`/budgeo/${req.params.username}/expenses`);
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
        reason: reasons404Expenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    res.render("budgeo/edit.ejs", { expense, currency, path, username });
  } catch (error) {
    console.log(error);
    // res.redirect(`/budgeo/${req.params.username}/expenses/${req.params.expenseId}`);
    const err = {
      statusCode: 500,
      reason: "FAILED TO FIND EXPENSE FORM FOR EDITTING!",
    };
    return next(err);
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
        reason: reasons404Expenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    res.render("budgeo/show.ejs", { expense, path, currency, username });
  } catch (error) {
    console.log(error);
    // res.redirect(`/budgeo/${req.params.username}/expenses`);
    const err = {
      statusCode: 500,
      reason: "FAILED TO LOCATED THE EXPENSE DETAILS PAGE!",
    };
    return next(err);
  }
});

router.put("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      const err = {
        statusCode: 404,
        reason: reasons404Expenses[[Math.floor(Math.random() * 10)]],
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
        // server side validation of month and year and cost recieved
        const monthYear = `${entry.month}-${entry.year}`;
        if (!monthYearCombinations.includes(monthYear)) {
          monthYearCombinations.push(monthYear);
        } else {
          throw new Error("DUPLICATE MONTH AND YEAR IN DATA!");
        }
        if (entry.cost < 0 || !Number(entry.cost) || entry.cost > 100000000) {
          throw new Error("INVALID COST!");
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
    // res.redirect(`/budgeo/${req.params.username}/expenses/${req.params.expenseId}`);
    let e;
    if (
      error === "DUPLICATE MONTH AND YEAR IN FORM!" ||
      error === "INVALID COST IN FORM!"
    ) {
      e = error;
    } else {
      e = "FAILED TO UPDATE EXPENSE!";
    }
    const err = {
      statusCode: 500,
      reason: e,
    };
    return next(err);
  }
});

router.delete("/:username/expenses/:expenseId", async (req, res, next) => {
  try {
    const { expense, currentUser } = await getUserData(User, req, "getId");
    if (!expense) {
      const err = {
        statusCode: 404,
        reason: reasons404Expenses[[Math.floor(Math.random() * 10)]],
      };
      return next(err);
    }
    expense.deleteOne();
    await currentUser.save();
    res.redirect(`/budgeo/${req.params.username}/expenses`);
  } catch (error) {
    console.log(error);
    // res.redirect(`/budgeo/${req.params.username}/expenses`);
    const err = {
      statusCode: 500,
      reason: "FAILED TO DELETE EXPENSE!",
    };
    return next(err);
  }
});

router.delete("/accountdeletion", async (req, res, next) => {
  try {
    const username = req.session.user.username;
    await User.findByIdAndDelete(req.session.user._id);
    try {
      req.session.destroy();
      res.clearCookie("budgeo.sid"); // Clear the session cookie
      res.render("thankyou.ejs", { username });
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
