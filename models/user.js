const mongoose = require('mongoose');

const historicalSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
})

const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Credit Card', 'Loan', 'Utility', 'Subscription', 'Other'],
    required: true,
  },
  schedule: {
    type: String,
    enum: ['Weekly', 'Bi-Weekly', 'Monthly', 'Bi-Monthly', 'Quarterly', 'Semi-Annually', 'Annually'],
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  costHigh: {
    type: Number,
    min: 0,
  },
  costLow: {
    type: Number,
    min: 0,
  },
  costType: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: '',
  },
  historical: [historicalSchema],
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unqiue: true,
  },
  password: {
    type: String,
    required: true,
  },
  currency: {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    locale: {
      type: String,
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    symbolPosition: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      required: true,
    },
  },
  budget: [expenseSchema],
});

const User = mongoose.model('User', userSchema);

module.exports = User;