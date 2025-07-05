// and array of the top 20 used currencies that a user can choose at signup
const currencies = [
  {
    name: "US Dollar",
    code: "USD",
    locale: "en-US",
    symbol: "$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Euro",
    code: "EUR",
    locale: "de-DE",
    symbol: "€",
    symbolPosition: "back",
    placeholder: "0.00",
  },
  {
    name: "Japanese Yen",
    code: "JPY",
    locale: "ja-JP",
    symbol: "¥",
    symbolPosition: "front",
    placeholder: "0",
  },
  {
    name: "British Pound Sterling",
    code: "GBP",
    locale: "en-GB",
    symbol: "£",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Chinese Yuan",
    code: "CNY",
    locale: "zh-CN",
    symbol: "¥",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Swiss Franc",
    code: "CHF",
    locale: "de-CH",
    symbol: "CHF",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Canadian Dollar",
    code: "CAD",
    locale: "en-CA",
    symbol: "CA$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Australian Dollar",
    code: "AUD",
    locale: "en-AU",
    symbol: "AU$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Hong Kong Dollar",
    code: "HKD",
    locale: "zh-HK",
    symbol: "HK$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Singapore Dollar",
    code: "SGD",
    locale: "en-SG",
    symbol: "S$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "South Korean Won",
    code: "KRW",
    locale: "ko-KR",
    symbol: "₩",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Brazilian Real",
    code: "BRL",
    locale: "pt-BR",
    symbol: "R$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Russian Ruble",
    code: "RUB",
    locale: "ru-RU",
    symbol: "₽",
    symbolPosition: "back",
    placeholder: "0.00",
  },
  {
    name: "South African Rand",
    code: "ZAR",
    locale: "en-ZA",
    symbol: "R",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Mexican Peso",
    code: "MXN",
    locale: "es-MX",
    symbol: "Mex$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Swedish Krona",
    code: "SEK",
    locale: "sv-SE",
    symbol: "kr",
    symbolPosition: "back",
    placeholder: "0.00",
  },
  {
    name: "Norwegian Krone",
    code: "NOK",
    locale: "no-NO",
    symbol: "kr",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "Turkish Lira",
    code: "TRY",
    locale: "tr-TR",
    symbol: "₺",
    symbolPosition: "front",
    placeholder: "0.00",
  },
  {
    name: "New Zealand Dollar",
    code: "NZD",
    locale: "en-NZ",
    symbol: "NZ$",
    symbolPosition: "front",
    placeholder: "0.00",
  },
];

const reasonsByGrok = [
  `This URL just snorted a line of cosmic dust and moonwalked off the server."`,
  "Nope, nada, zilch! This page pulled a ninja smoke bomb and poofed into the digital abyss!",
  "This page just hijacked a UFO, flipped the bird, and zoomed off to party with aliens!",
  "Error? Nah, this page just snorted glitter, declared itself emperor of the void, and ghosted us!",
  "Page not found. It’s probably moshing in a digital rave, slamming shots with rogue pixels!",
  "This URL went feral, chewed through the server cables, and is now howling at the binary moon!",
  "Page not found. It’s out there riding a flaming comet, cackling like a mad scientist on bath salts!",
  "You broke it, genius! This page saw your URL, laughed, and noped out to join a cult in cyberspace!",
  "Congrats, you typed a URL so cursed it made the page scream 'I’M OUT!' and shred itself into digital confetti!",
  "Nice going, genius! You steered this page into a screaming dead end, and now it’s breakdancing in a digital dumpster!",
];

const reasonsByGrokExpenses = [
  "Oops, Where’s the Receipt? This expense has vanished faster than your coffee budget at a hipster café!",
  "Budget Item AWOL! This expense slipped through the cracks like spare change in a couch cushion.",
  "Expense Missing in Action! We searched high and low, but this expense is hiding better than your secret snack stash.",
  "Where’s the Money Gone? This expense ghosted your budget like a bad Tinder date.",
  "Expense Not in the Ledger! It’s either on a spending spree or got lost in the black hole of 'miscellaneous.'",
  "Financial Fugitive Alert! This expense is on the run, last seen fleeing your spreadsheet.",
  "Expense Evaporated! Poof! This item vanished like your paycheck on rent day.",
  "Not in the Budget! This expense is playing hide-and-seek, and it’s winning. Check under ‘impulse buys’?",
  "Expense Escaped! This line item bolted like it heard 'tax season' was coming early.",
  "Budget Black Hole! This expense got sucked into the void of 'I swear I didn’t spend that much on takeout.'",
];

// gets user data for server
async function getUserData(User, req, type) {
  const currentUser = await User.findById(req.session.user._id);
  const username = currentUser.username;
  const currency = currentUser.currency;
  const path = req.path;
  let expense;
  if (type === "getId") {
    expense = currentUser.budget.id(req.params.expenseId);
  } else {
    expense = currentUser.budget;
  }
  return { username, expense, currency, path, currentUser };
}

// simple function that gets the string of the month in a users locale and converts to number
// works by generating a complete list of month names in locale then finding index of the passed
// month in the array which corresponds to the 0-11 new Date method
function monthFromLocale(monthInLocale, locale) {
  let months = [];
  for (let i = 0; i < 12; i++) {
    const month = new Date(0, i).toLocaleString(locale, {
      month: "long",
      timeZone: "UTC",
    });
    months.push(month);
  }
  return months.indexOf(monthInLocale);
}

// same as the monthFromLocale returns the current year in a number server can use
// works by comparing 2 arrays 1 server uses and 1 in client locale
function yearFromLocale(yearInLocale, locale) {
  const currentYear = new Date().getUTCFullYear();
  let yearOptions = [];
  let formattedYearOptions = [];
  for (let year = currentYear; year >= currentYear - 4; year--) {
    yearOptions.push(year);
    formattedYearOptions.push(
      new Date(year, 0).toLocaleString(locale, {
        year: "numeric",
        timeZone: "UTC",
      })
    );
  }
  const yearLocaleIndex = formattedYearOptions.indexOf(yearInLocale);
  return yearOptions[yearLocaleIndex];
}

// calculates the historical payment data received from client and bootstraps
// to provide a robust estimate of monthly expenditures
function calculateVariableCost(historical) {
  // calculating total amount of months between earliest and latest entries
  const dates = historical.map((entry) => entry.date);
  const sortedDates = dates.sort((a, b) => a - b);
  const earliestDate = sortedDates.at(0);
  const latestDate = sortedDates.at(sortedDates.length - 1);
  const yearEarliest = earliestDate.getUTCFullYear();
  const monthEarliest = earliestDate.getUTCMonth() + 1;
  const yearLatest = latestDate.getUTCFullYear();
  const monthLatest = latestDate.getUTCMonth() + 1;
  const monthsLeftEarliest = Math.abs(monthEarliest - 12);
  const MonthsCoveredLatest = monthLatest;
  const yearDiff = Math.abs(yearEarliest - yearLatest) - 1;
  const monthsOfYearDiff = yearDiff * 12;
  const totalMonthsCovered =
    monthsOfYearDiff + monthsLeftEarliest + MonthsCoveredLatest;

  // array of costs
  const costs = historical.map((entry) => entry.cost);

  // if only 1 month of data to prevent issues
  if (totalMonthsCovered < 1) {
    return { cost: costs.reduce((sum, cost) => sum + cost, 0) };
  }

  //----- following is bootstapping for robust averaging and getting a 95% Confidence Interval ---//

  // Function to create a bootstrap sample
  function getBootstrapSample(data) {
    const sample = [];
    for (let i = 0; i < data.length; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      sample.push(data[randomIndex]);
    }
    return sample;
  }

  // Function to calculate the mean
  function calculateMean(array) {
    const sum = array.reduce((sum, value) => sum + value, 0);
    return sum / totalMonthsCovered; // Use totalMonthsCovered like original code
  }

  // Function to perform bootstrapping
  function bootstrapMeans(data, numSamples) {
    const bootstrapMeans = [];
    for (let i = 0; i < numSamples; i++) {
      const sample = getBootstrapSample(data);
      const mean = calculateMean(sample);
      bootstrapMeans.push(mean);
    }
    return bootstrapMeans;
  }

  // Function to calculate the 95% confidence interval (sets the 25th and 975th items in the array as lower and upper CI)
  function getConfidenceInterval(means, confidenceLevel = 0.95) {
    const sortedMeans = means.sort((a, b) => a - b);
    const lowerPercentile = (1 - confidenceLevel) / 2;
    const upperPercentile = 1 - lowerPercentile;
    const lowerIndex = Math.floor(lowerPercentile * sortedMeans.length);
    const upperIndex = Math.floor(upperPercentile * sortedMeans.length);
    return {
      lower: sortedMeans[lowerIndex],
      upper: sortedMeans[upperIndex],
    };
  }

  // Run bootstrapping with 1000 samples
  const numSamples = 1000;
  const means = bootstrapMeans(costs, numSamples);
  const ci = getConfidenceInterval(means);
  const ciHigh = Number(ci.upper.toFixed(2));
  const ciLow = Number(ci.lower.toFixed(2));
  const averageCI = Number(((ciLow + ciHigh) / 2).toFixed(2));

  return {
    cost: averageCI,
    low: ciLow,
    high: ciHigh,
  };
}

// used in conjuction with schedule and piechart functions to format payments as needed
function changeCost(payment, schedule, newSchedule) {
  switch (schedule) {
    case "Weekly":
      payment = payment * 52;
      break;
    case "Bi-Weekly":
      payment = payment * 26;
      break;
    case "Monthly":
      payment = payment * 12;
      break;
    case "Bi-Monthly":
      payment = payment * 6;
      break;
    case "Quarterly":
      payment = payment * 4;
      break;
    case "Semi-Annually":
      payment = payment * 2;
      break;
    case "Annually":
      break;
  }
  switch (newSchedule) {
    case "Weekly":
      payment = (payment / 52).toFixed(2);
      break;
    case "Monthly":
      payment = (payment / 12).toFixed(2);
      break;
    case "Quarterly":
      payment = (payment / 4).toFixed(2);
      break;
    case "Annually":
      break;
  }
  return payment;
}

// generates pieChart data that is passed to /data
async function pieChart(expense) {
  const newExpenses = JSON.parse(JSON.stringify(expense));
  newExpenses.forEach((expense) => {
    expense.cost = Number(
      changeCost(expense.cost, expense.schedule, "Monthly")
    );
  });

  const creditCards = newExpenses.filter(
    (expense) => expense.type === "Credit Card"
  );
  const loans = newExpenses.filter((expense) => expense.type === "Loan");
  const utilities = newExpenses.filter((expense) => expense.type === "Utility");
  const subscriptions = newExpenses.filter(
    (expense) => expense.type === "Subscription"
  );
  const others = newExpenses.filter((expense) => expense.type === "Other");

  const creditCardsTotal = Number(
    creditCards.reduce((sum, expense) => sum + expense.cost, 0).toFixed(2)
  );
  const loansTotal = Number(
    loans.reduce((sum, expense) => sum + expense.cost, 0).toFixed(2)
  );
  const utilitiesTotal = Number(
    utilities.reduce((sum, expense) => sum + expense.cost, 0).toFixed(2)
  );
  const subscriptionsTotal = Number(
    subscriptions.reduce((sum, expense) => sum + expense.cost, 0).toFixed(2)
  );
  const othersTotal = Number(
    others.reduce((sum, expense) => sum + expense.cost, 0).toFixed(2)
  );

  const pieData = [
    { label: "Credit Cards", value: creditCardsTotal, color: "#3D5A77" },
    { label: "Loans", value: loansTotal, color: "#88A1BA" },
    { label: "Utilities", value: utilitiesTotal, color: "#7F8E9D" },
    { label: "Subscriptions", value: subscriptionsTotal, color: "#23486E" },
    { label: "Other", value: othersTotal, color: "#436E99" },
  ];

  return pieData;
}

// formats expense data into 4 categories that are passed to /data for displaying
// estimates and the client side just presses a button to switch between them
function getSchedulesFormatted(expense, type, currency) {
  const newExpense = JSON.parse(JSON.stringify(expense));
  newExpense.forEach((expense) => {
    switch (type) {
      case "Weekly":
        if (expense.costHigh > 0 && expense.costLow > 0) {
          expense.costHigh = expense.costHigh - expense.cost;
          expense.costLow = expense.cost - expense.costLow;
          expense.costHigh = Number(
            changeCost(expense.costHigh, "Monthly", "Weekly")
          );
          expense.costLow = Number(
            changeCost(expense.costLow, "Monthly", "Weekly")
          );
        }
        expense.cost = Number(
          changeCost(expense.cost, expense.schedule, "Weekly")
        );
        break;
      case "Monthly":
        if (expense.costHigh > 0 && expense.costLow > 0) {
          expense.costHigh = expense.costHigh - expense.cost;
          expense.costLow = expense.cost - expense.costLow;
          expense.costHigh = Number(
            changeCost(expense.costHigh, "Monthly", "Monthly")
          );
          expense.costLow = Number(
            changeCost(expense.costLow, "Monthly", "Monthly")
          );
        }
        expense.cost = Number(
          changeCost(expense.cost, expense.schedule, "Monthly")
        );
        break;
      case "Quarterly":
        if (expense.costHigh > 0 && expense.costLow > 0) {
          expense.costHigh = expense.costHigh - expense.cost;
          expense.costLow = expense.cost - expense.costLow;
          expense.costHigh = Number(
            changeCost(expense.costHigh, "Monthly", "Quarterly")
          );
          expense.costLow = Number(
            changeCost(expense.costLow, "Monthly", "Quarterly")
          );
        }
        expense.cost = Number(
          changeCost(expense.cost, expense.schedule, "Quarterly")
        );
        break;
      case "Annually":
        if (expense.costHigh > 0 && expense.costLow > 0) {
          expense.costHigh = expense.costHigh - expense.cost;
          expense.costLow = expense.cost - expense.costLow;
          expense.costHigh = Number(
            changeCost(expense.costHigh, "Monthly", "Annually")
          );
          expense.costLow = Number(
            changeCost(expense.costLow, "Monthly", "Annually")
          );
        }
        expense.cost = Number(
          changeCost(expense.cost, expense.schedule, "Annually")
        );
        break;
    }
  });
  const newTotal = newExpense.reduce((sum, expense) => sum + expense.cost, 0);
  const newTotalHigh =
    newExpense.reduce(
      (sum, expense) => sum + (expense.costHigh > 0 ? expense.costHigh : 0),
      0
    ) + newTotal;
  const newTotalLow =
    newTotal -
    newExpense.reduce(
      (sum, expense) => sum + (expense.costLow > 0 ? expense.costLow : 0),
      0
    );
  const formattedTotal = Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).format(newTotal);
  const formattedHigh = Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).format(newTotalHigh);
  const formattedLow = Intl.NumberFormat(currency.locale, {
    style: "currency",
    currency: currency.code,
  }).format(newTotalLow);

  return { formattedTotal, formattedHigh, formattedLow };
}

module.exports = {
  calculateVariableCost,
  currencies,
  monthFromLocale,
  yearFromLocale,
  pieChart,
  getSchedulesFormatted,
  getUserData,
  reasonsByGrok,
  reasonsByGrokExpenses,
};
