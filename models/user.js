const mongoose = require("mongoose");

const historicalSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    max: 100000000,
  },
});

const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Credit Card", "Loan", "Utility", "Subscription", "Other"],
    required: true,
  },
  schedule: {
    type: String,
    enum: [
      "Weekly",
      "Bi-Weekly",
      "Monthly",
      "Bi-Monthly",
      "Quarterly",
      "Semi-Annually",
      "Annually",
    ],
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
    max: 100000000,
  },
  costHigh: {
    type: Number,
    min: 0,
    max: 100000000,
  },
  costLow: {
    type: Number,
    min: 0,
    max: 100000000,
  },
  costType: {
    type: String,
    enum: ["Fixed", "Variable"],
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
  historical: [historicalSchema],
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    minLength: 3,
    maxLength: 15,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    minLength: 8,
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

const User = mongoose.model("User", userSchema);

module.exports = User;
