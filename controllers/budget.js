const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const { calculateVariableCost, monthFromLocale } = require('../public/js/serverUtils.js');
const parseCurrency = require('parsecurrency');

// parseCurrency is used to parse currency strings into numbers
// Example usage:
// const newValue = '5.000,00 €'
// const formattedValue = parseCurrency(newValue);

router.get('/', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const expenses = currentUser.budget;
        const path = req.path
        res.render('budget/index.ejs', { expenses, currentUser, path })
    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
});

router.get('/new', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const path = req.path
        res.render('budget/new.ejs', { currentUser, path });
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
});

router.get('/data', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const expense = currentUser.budget;
        const path = req.path
        res.render('budget/data.ejs', { currentUser, expense, path });
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${req.session.user._id}/budget`);
    }
});

router.post('/', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        if (!req.body.cost) {
            req.body.cost = '0';
        }

        const expenseData = {
            name: req.body.name,
            type: req.body.type,
            schedule: req.body.schedule,
            cost: parseCurrency(req.body.cost).value,
            costType: req.body.costType,
            notes: req.body.notes || '', // Ensure notes is a string, default to empty if not provided
            historical: req.body.historical,
        }

        // maps historical data to a date and cost format
        // and calculates the variable cost if historical data is provided
        // and adds it to the expenseData object for later use
        if (expenseData.historical && expenseData.historical.length > 0) {
            expenseData.historical.forEach(entry => {
                // checking if server recieved month as a locale string, if so converts it to number
                if (entry.month.length > 2) {
                    entry.month = monthFromLocale(entry.month, currentUser.currency.locale) + 1
                }
            });
            const historical = expenseData.historical.map(entry => ({
                date: new Date(Date.UTC(`${entry.year}`, `${entry.month - 1}`, 1, 0, 0, 0)),
                cost: parseCurrency(entry.cost).value,
            }));
           const { cost, high, low } = calculateVariableCost(historical);
            expenseData.cost = cost
            expenseData.costHigh = high
            expenseData.costLow = low
            expenseData.historical = historical.sort((a, b) => a.date - b.date);
        }

        currentUser.budget.push(expenseData)

        await currentUser.save()

        res.redirect(`/users/${currentUser._id}/budget`)

    } catch (error) {
        console.log(error)
        res.redirect('/')
    }
})

router.get('/:expenseId', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const expense = currentUser.budget.id(req.params.expenseId)
        const path = req.path

        if (!expense) {
            return res.status(404).send('Expense not found');
        }

        res.render('budget/show.ejs', { expense, currentUser, path });
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${req.session.user._id}/budget`);
    }
});

router.delete('/:expenseId', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const expense = currentUser.budget.id(req.params.expenseId)

        if (!expense) {
            return res.status(404).send('Expense not found');
        }

        expense.deleteOne();
        await currentUser.save();
        res.redirect(`/users/${currentUser._id}/budget`);
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${req.session.user._id}/budget`);
    }
});

router.get('/:expenseId/edit', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const expense = currentUser.budget.id(req.params.expenseId)
        const path = req.path

        if (!expense) {
            return res.status(404).send('Expense not found');
        }

        res.render('budget/edit.ejs', { expense, currentUser, path });
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${req.session.user._id}/budget`);
    }
})

router.put('/:expenseId', async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.user._id)
        const expense = currentUser.budget.id(req.params.expenseId)

        if (!expense) {
            return res.status(404).send('Expense not found');
        }

        if (!req.body.cost) {
            req.body.cost = '0';
        }

        req.body.cost = parseCurrency(req.body.cost).value;
        req.body.notes = req.body.notes || ''; // Ensure notes is a string, default to empty if not provided

        // If historical data is provided, update it
        if (req.body.historical && req.body.historical.length > 0) {
            req.body.historical.forEach(entry => {
                // checking if server recieved month as a locale string, if so converts it to number
                if (entry.month.length > 2) {
                    entry.month = monthFromLocale(entry.month, currentUser.currency.locale) + 1
                }
            });
            const historical = req.body.historical.map(entry => ({
                date: new Date(Date.UTC(`${entry.year}`, `${entry.month - 1}`, 1, 0, 0, 0)),
                cost: parseCurrency(entry.cost).value,
            }));

            const { cost, high, low } = calculateVariableCost(historical);
            req.body.cost = cost
            req.body.costHigh = high
            req.body.costLow = low
            req.body.historical = historical.sort((a, b) => a.date - b.date);
        }
        expense.set(req.body)
        await currentUser.save();
        res.redirect(`/users/${currentUser._id}/budget/${expense._id}`);
    } catch (error) {
        console.log(error);
        res.redirect(`/users/${req.session.user._id}/budget/${req.params.expenseId}`);
    }
});

module.exports = router;
