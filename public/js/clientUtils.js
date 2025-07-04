// client side data is in locale selected at signup which is then converted
// on the server side.  this allows all client data to be in locale and the
// client side functions can just use that data, when its sent to the server
// a simple conversion function will process it.  that way it doesnt need to
// check if its in the locale or not.. it assumes (or knows) its in client locale
// -------------------------- CONSTANTS ---------------------------- //
const nextForm = document.getElementById("initial-form");
const variableForm = document.getElementById("variable-form");
const fixedForm = document.getElementById("fixed-form");
const addRowButton = document.querySelector("#add-row");

// data for custom report validity messages
const inputNames = [
  {
    id: "name-input",
    errorMessage: "Please enter a name (max 15 characters).",
  },
  {
    id: "cost-input",
    errorMessage: "Please enter a cost.",
  },
  {
    id: "month-input",
    errorMessage:
      "Please select a month (Each Month/Year pair must be unique.)",
  },
  {
    id: "year-input",
    errorMessage: "Please select a year (Each Month/Year pair must be unique.)",
  },
];

// initialize let variables
let rowIndex = 1; // set to 1 for new forms (table starts with 1 row index 0)
let combinations = []; // for tracking month year combo inputs so no dupes

// sets rowIndex and pushes dates to combinations array for tracking in client locale
if (expense.historical && expense.historical.length > 0) {
  rowIndex = expense.historical.length - 1; // set rowIndex based on existing data length
  const dates = expense.historical.map((entry) => new Date(entry.date));
  dates.forEach((date) => {
    const month = date.getUTCMonth();
    const year = date.getUTCFullYear();
    const formattedYear = new Date(year, 0).toLocaleString(currency.locale, {
      year: "numeric",
      timeZone: "UTC",
    });
    const formattedMonth = new Date(0, month).toLocaleString(currency.locale, {
      month: "long",
      timeZone: "UTC",
    });
    combinations.push(`${formattedYear}-${formattedMonth}`);
  });
  reindexRows();
}

// -------------------------- FUNCTIONS --------------------------- //

// extremely vital function to reindex items in variable forms as rows are added and removed
function reindexRows() {
  return new Promise((resolve) => {
    // const defined as the tables rows only, queries all rows
    const rows = document.querySelectorAll("#payment-table tbody tr");
    let idx = 0;
    rows.forEach((row) => {
      // update name and id attributes for all inputs/selects in this row
      row.querySelectorAll("select, input").forEach((input) => {
        if (input.name && input.name.includes("month"))
          input.name = `historical[${idx}][month]`;
        if (input.name && input.name.includes("year"))
          input.name = `historical[${idx}][year]`;
        if (input.name && input.name.includes("cost"))
          input.name = `historical[${idx}][cost]`;
        if (input.id && input.id.includes("month")) input.id = `month[${idx}]`;
        if (input.id && input.id.includes("year")) input.id = `year[${idx}]`;
        if (input.id && input.id.includes("cost")) input.id = `cost[${idx}]`;
      });
      // also updates index of the remove button (used in removeRow function - vital)
      const removeButton = row.querySelector("button.remove-btn");
      if (removeButton) {
        removeButton.id = `remove[${idx}]`;
        removeButton.dataset.index = idx;
      }
      // reIndexes the parent that groups month and year when its set to readonly in the setRowReadOnly()
      // it removes the entire div for selects and re-adds them as inputs with the data
      row.querySelector(
        ".month-year-group"
      ).parentElement.id = `month-year[${idx}]`;
      idx++;
    });
    rowIndex = idx;
    resolve();
  });
}

// removed current row after add row is clicked and inputs a new div with the values
// and sets to read only so user cannot access and change (prevents user mistakes)
function setRowReadOnly(index, month, year) {
  return new Promise((resolve) => {
    const lastRow = document.getElementById(`month-year[${index}]`);
    const childToRemove = lastRow.querySelector(".month-year-group");
    lastRow.removeChild(childToRemove);
    const childToAdd = document.createElement("div");
    childToAdd.classList.add("field", "is-grouped", "month-year-group");
    const rowReadOnly = `
    <div class="field is-grouped is-grouped-centered is-flex is-justify-content-center" style="margin-bottom: 0;">
        <div class="control">
            <input
                class="input has-text-centered"
                type="text"
                name="historical[${index}][month]"
                id="month[${index}]"
                value="${month}"
                readonly
                style="width: 130px; text-align: center;"
                tabindex="-1" />
        </div>
        <div class="control">
            <input
                class="input has-text-centered"
                type="text"
                name="historical[${index}][year]"
                id="year[${index}]"
                value="${year}"
                readonly
                style="width: 87px; text-align: center;"
                tabindex="-1" />
        </div>
    </div>`;
    childToAdd.innerHTML = rowReadOnly;
    lastRow.appendChild(childToAdd);
    resolve();
  });
}

// adds new table row on historical data variable forms
// set up as a promise so it resolves before addRow() continues
function addRowData() {
  return new Promise((resolve) => {
    const table = document.getElementById("payment-table");
    const row = table.insertRow();
    // getting current year and formatted to client locale then pushes to an array and adds under
    // select class as options to populate dropdown
    const currentYear = new Date().getUTCFullYear();
    let yearOptions = '<option value="" disabled selected>Year</option>';
    for (let year = currentYear; year >= currentYear - 4; year--) {
      const formattedYear = new Date(year, 0).toLocaleString(currency.locale, {
        year: "numeric",
        timeZone: "UTC",
      });
      yearOptions += `<option value="${formattedYear}">${formattedYear}</option>`;
    }
    // same as the yearOptions excepts generates an array of months in client locale by iterating 0 to 11
    // because how the Date function works is 0 is the first month and 11 the last...
    let monthOptions = '<option value="" disabled selected>Month</option>';
    for (let i = 0; i < 12; i++) {
      const month = new Date(0, i).toLocaleString(currency.locale, {
        month: "long",
        timeZone: "UTC",
      });
      monthOptions += `<option value="${month}">${month}</option>`;
    }
    // html added for the row, includes the next index available for id's and classes that are used
    // in other functions and adds the months and years options in the select fields
    row.innerHTML = `
    <td>
        <div id="month-year[${rowIndex}]">
            <div class="field is-grouped month-year-group">
                <div class="control">
                    <div class="select">
                      <select class="month-input has-text-centered" name="historical[${rowIndex}][month]" id="month[${rowIndex}]" style="width: 130px" required>
                        ${monthOptions}
                      </select>
                    </div>
                </div>
                <div class="control">
                    <div class="select">
                      <select class="year-input has-text-centered" name="historical[${rowIndex}][year]" id="year[${rowIndex}]" required>
                        ${yearOptions}
                      </select>
                    </div>
                </div>
            </div>
        </div>
    </td>
    <td><input type="text"
        class="input cost-input has-text-centered"
        id="cost[${rowIndex}]" 
        name="historical[${rowIndex}][cost]" min="0" required>
    </td>
    <td class="has-text-centered align-middle" style="vertical-align: middle">
        <button id="remove[${rowIndex}" data-index="${rowIndex}" type="button"
        class="button is-small is-primary remove-btn has-text-white has-text-weight-extrabold" onclick="removeRow(this)">
                <span class="icon"><i class="fa-solid fa-x fa-xl" style="color: #ffffff;"></i></span>
        </button>
    </td>`;
    addErrorMessageListeners(row);
    resolve();
  });
}

// add row function set up as async and awaits addRowData and setRowReadOnly for
// proper functioning, multiple steps are taken that must be completed in order
async function addRow() {
  const currentRowIndex = document.querySelector("tbody").rows.length - 1;
  const monthSelected = document.getElementById(`month[${currentRowIndex}]`);
  const yearSelected = document.getElementById(`year[${currentRowIndex}]`);
  const costSelected = document.getElementById(`cost[${currentRowIndex}]`);
  const errorMessage = document.querySelector("#year-month-error-message");
  const yearMonth = `${yearSelected.value}-${monthSelected.value}`;
  console.log(currentRowIndex);

  // adds row if there is no row for data input to start (used on edits)
  // could check month or year also, but doesnt matter which it checks
  if (costSelected.readOnly) {
    console.log("row is already readonly adding new row");
    await addRowData();
    return;
  }
  // if yearMonth is in combinations array, returns and shows the error message
  if (monthSelected.value && yearSelected.value && costSelected.value) {
    if (combinations.includes(yearMonth)) {
      return (errorMessage.hidden = false);
    } else {
      errorMessage.hidden = true; // hides error message just in case (has delete button also)
      combinations.push(yearMonth);
      // awaits setting the row just submitted readOnly this functions removes the select
      // fields and changes to input using the passed values
      await setRowReadOnly(
        currentRowIndex, //
        monthSelected.value,
        yearSelected.value
      );
      costSelected.readOnly = true; // sets cost to read only (not handled in setRowReadOnly())
      await addRowData(); // awaits adding next rows data before continuing
      await reindexRows(); // awaits reindexing rows and buttons
      updatePlaceholders(); // formats cost input to client locale
    }
  }
}

// removes rows on new and edit variable forms for historical data
// uses dataset-index on buttons that matches each row to track
async function removeRow(button) {
  const currentRows = document.querySelector("tbody").rows.length;
  const monthSelected = document.getElementById(
    `month[${button.dataset.index}]`
  );
  const yearSelected = document.getElementById(`year[${button.dataset.index}]`);
  let yearMonth;
  if (currentRows > 1) {
    if (yearSelected.value && monthSelected.value) {
      yearMonth = `${yearSelected.value}-${monthSelected.value}`;
    }
    const comboIdx = combinations.indexOf(yearMonth);
    if (
      comboIdx >= 0 &&
      combinations.includes(yearMonth) &&
      monthSelected.readOnly
    ) {
      combinations.splice(comboIdx, 1);
    }
    button.parentNode.parentNode.remove();
    await reindexRows();
  }
}

// go back button for new expense form (step form)
function goBack() {
  document.getElementById("fixed-form").classList.remove("active");
  document.getElementById("variable-form").classList.remove("active");
  document.getElementById("initial-form").classList.add("active");
}

// initially formats all cost input fields to user locale then called as needed
function updatePlaceholders() {
  const costInputs = document.querySelectorAll(".cost-input");
  costInputs.forEach((input) => {
    input.placeholder = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
    }).format(currency.placeholder);
  });
}

// script to change error messages for input and select fields
// called on initial dom load
function updateErrorMessages() {
  inputNames.forEach((input) => {
    document.querySelectorAll(`.${input.id}`).forEach((selector) => {
      selector.addEventListener("invalid", function () {
        this.setCustomValidity(input.errorMessage);
      });
      selector.addEventListener("input", function () {
        this.setCustomValidity("");
      });
    });
  });
}

// updates error message for new rows as added
function addErrorMessageListeners(row) {
  inputNames.forEach((input) => {
    const newInput = row.querySelector(`.${input.id}`);
    if (newInput) {
      newInput.addEventListener("invalid", function () {
        this.setCustomValidity(input.errorMessage);
      });
      newInput.addEventListener("input", function () {
        this.setCustomValidity("");
      });
    }
  });
}

// updates elements innerHTML for data.ejs estimates
// basic switch statements handling which text shows
function changeSchedule(type) {
  const totalCosts = document.querySelector("#total-cost");
  const estimatedCosts = document.querySelector("#estimate-cost");
  let message = "";
  let confidenceMessage = "";
  let formattedTotal;
  let formattedHigh;
  let formattedLow;

  if (!totalCosts || !estimatedCosts) {
    return;
  }
  switch (type) {
    case "Weekly":
      formattedTotal = scheduleData.weeklyTotal;
      formattedHigh = scheduleData.weeklyHigh;
      formattedLow = scheduleData.weeklyLow;
      break;
    case "Monthly":
      formattedTotal = scheduleData.monthlyTotal;
      formattedHigh = scheduleData.monthlyHigh;
      formattedLow = scheduleData.monthlyLow;
      break;
    case "Quarterly":
      formattedTotal = scheduleData.quarterlyTotal;
      formattedHigh = scheduleData.quarterlyHigh;
      formattedLow = scheduleData.quarterlyLow;
      break;
    case "Annually":
      formattedTotal = scheduleData.annuallyTotal;
      formattedHigh = scheduleData.annuallyHigh;
      formattedLow = scheduleData.annuallyLow;
      break;
  }

  switch (type) {
    case "Weekly":
      message = `<span class="has-text-weight-bold">Weekly Estimate: </span> ${formattedTotal}`;
      break;
    case "Monthly":
      message = `<span class="has-text-weight-bold">Monthly Estimate: </span> ${formattedTotal}`;
      break;
    case "Quarterly":
      message = `<span class="has-text-weight-bold">Quarterly Estimate: </span> ${formattedTotal}`;
      break;
    case "Annually":
      message = `<span class="has-text-weight-bold">Annual Estimate: </span> ${formattedTotal}`;
      break;
  }
  confidenceMessage = `<span class="has-text-weight-bold">Confidence Estimate: </span> ${formattedLow} to ${formattedHigh}`;
  totalCosts.innerHTML = message;
  estimatedCosts.innerHTML = confidenceMessage;
}

// -------------------------- EVENT LISTENERS ---------------------------- //

// Listen for input events on cost fields to format currency and add symbol where needed as user types
document.addEventListener("input", (e) => {
  if (e.target.classList.contains("cost-input")) {
    // Remove all non-numeric characters and update the input value immediately
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    let value = e.target.value;

    // allows backspace when symbol position is on right of input or back
    if (
      e.inputType === "deleteContentBackward" &&
      currency.symbolPosition === "back"
    ) {
      value = value.slice(0, -1);
    }

    // If input is empty or not a number, show placeholder format
    if (!value || isNaN(parseFloat(value))) {
      return currency.symbolPosition === "front"
        ? `${currency.symbol}${currency.placeholder}`
        : `${currency.placeholder}${currency.symbol}`;
    }

    // Limit input to 8 digits, pad with zeros if needed
    value = value.slice(-8).padStart(8, "0");
    let integerPart = value.slice(0, 6);
    let decimalPart = value.slice(-2);

    // Cap integer part at 100000 and reset decimals if exceeded
    if (parseInt(integerPart) >= 100000) {
      integerPart = "100000";
      decimalPart = "00";
    }
    // Cap total value at 10000000
    if (parseInt(value) >= 10000000) {
      value = "10000000";
    }
    // Remove leading zeros for formatting
    const nonZeroValue = value.replace(/^0+/, "") || "0";
    let formattedValue;
    // Format value as currency string
    if (nonZeroValue.length <= 3) {
      formattedValue = `${integerPart.slice(-1)}.${decimalPart}`;
    } else {
      const trimmedInteger = parseInt(integerPart).toString();
      formattedValue = `${trimmedInteger}.${decimalPart}`;
    }

    // Use Intl.NumberFormat to format value as currency
    const inputFormat = new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.code,
    });
    let formattedInput;
    // if the placeholder is "0", format the input value directly
    // otherwise, format the formatted value
    if (currency.placeholder === "0") {
      formattedInput = inputFormat.format(value);
    } else {
      formattedInput = inputFormat.format(formattedValue);
    }

    // Set formatted value back to input
    e.target.value = formattedInput;
  }
});

// Handle navigation between forms based on payment type selection
if (nextForm) {
  nextForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const paymentType = document.getElementById("costType").value;
    nextForm.classList.remove("active");

    if (paymentType === "Fixed") {
      fixedForm.classList.add("active");
    } else if (paymentType === "Variable") {
      variableForm.classList.add("active");
    } else {
      nextForm.classList.add("active");
    }
  });
}

// ---------------- RUN ON DOM LOAD ------------------ //
updatePlaceholders(); // formats cost input fields to show as client locale
updateErrorMessages(); // changes validity messages to custum ones
changeSchedule("Monthly"); // sets initial values for estimate field in data/charts ejs to monthly
