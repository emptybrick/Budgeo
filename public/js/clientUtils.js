// client side needs access to expense(= currentUser.budget) - /new, /data, /edit
// client side needs access to currency(= currentUser.currency)

// static const variables set
const nextForm = document.getElementById("initial-form");
const variableForm = document.getElementById("variable-form");
const fixedForm = document.getElementById("fixed-form");
const addRowButton = document.querySelector("#add-row");

// initialize let variables
let rowIndex = 1; // set to 1 for new forms (table starts with 1 row index 0)
let combinations = [];

if (expense.historical && expense.historical.length > 0) {
    rowIndex = expense.historical.length - 1; // set rowIndex based on existing data length
    const dates = expense.historical.map((entry) => new Date(entry.date));
    dates.forEach((date) => {
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();
        combinations.push(`${year}-${month}`); // adds historical data to combinations to track
    });
    reindexRows();
}

// client side
function monthFromLocale(monthName, locale) {
    let months = [];
    for (let i = 0; i < 12; i++) {
        const month = new Date(0, i).toLocaleString(locale, {
            month: "long",
            timeZone: "UTC",
        });
        months.push(month);
    }
    return months.indexOf(monthName);
}

// client side
function reindexRows() {
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
        const removeButton = row.querySelector("button.remove-btn");
        if (removeButton) {
            removeButton.id = `remove[${idx}]`;
            removeButton.dataset.index = idx;
        }
        row.querySelector(
            ".month-year-group"
        ).parentElement.id = `month-year[${idx}]`;
        idx++;
    });
    rowIndex = idx;
}

// client side
function setRowReadOnly(index, month, year) {
    return new Promise((resolve) => {
        const lastRow = document.getElementById(`month-year[${index}]`);
        const childToRemove = lastRow.querySelector(".month-year-group");
        lastRow.removeChild(childToRemove);
        const childToAdd = document.createElement("div");
        childToAdd.classList.add("field", "is-grouped", "month-year-group");
        formattedMonth = new Date(0, month - 1).toLocaleString(currency.locale, {
            month: "long",
            timeZone: "UTC",
        });
        const rowReadOnly = `
    <div class="field is-grouped is-grouped-centered is-flex is-justify-content-center" style="margin-bottom: 0;">
        <div class="control">
            <input
                class="input has-text-centered"
                type="text"
                name="historical[${index}][month]"
                id="month[${index}]"
                value="${formattedMonth}"
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

// client side
async function addRow() {
    const tbody = document.querySelector("tbody");
    let currentRowIndex = tbody.rows.length - 1;

    const monthSelected = document.getElementById(`month[${currentRowIndex}]`);
    const yearSelected = document.getElementById(`year[${currentRowIndex}]`);
    const costSelected = document.getElementById(`cost[${currentRowIndex}]`);
    const errorMessage = document.querySelector("#year-month-error-message");

    let yearMonth = "";
    if (costSelected.readOnly) {
        await addRowData();
        return;
    }

    if (monthSelected.value && yearSelected.value && costSelected.value) {
        yearMonth = `${yearSelected.value}-${monthSelected.value}`;
        if (combinations.includes(yearMonth)) {
            errorMessage.hidden = false;
            return;
        } else {
            errorMessage.hidden = true;
            combinations.push(yearMonth);
            await addRowData();
            await setRowReadOnly(
                currentRowIndex,
                monthSelected.value,
                yearSelected.value
            );
            monthSelected.readOnly = true;
            yearSelected.readOnly = true;
            costSelected.readOnly = true;
            updatePlaceholders(currency);
        }
    }
}

// client side
function addRowData() {
    return new Promise((resolve) => {
        const table = document.getElementById("payment-table");
        const row = table.insertRow();
        const currentYear = new Date().getUTCFullYear();
        let yearOptions = '<option value="" disabled selected>Year</option>';
        for (let year = currentYear; year >= currentYear - 4; year--) {
            yearOptions += `<option value="${year}">${year}</option>`;
        }
        let monthOptions = '<option value="" disabled selected>Month</option>';
        for (let i = 0; i < 12; i++) {
            const month = new Date(0, i).toLocaleString(currency.locale, {
                month: "long",
                timeZone: "UTC",
            });
            monthOptions += `<option value="${i + 1}">${month}</option>`;
        }
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
        reindexRows();
        addErrorMessageListeners(row);
        resolve();
    });
}

// client side
// need to reset rowIndexes function
function removeRow(button) {
    const monthSelected = document.getElementById(
        `month[${button.dataset.index}]`
    );
    const yearSelected = document.getElementById(`year[${button.dataset.index}]`);
    let yearMonth = "";
    if (rowIndex > 1) {
        let month = monthSelected.value;
        if (!Number.isInteger(month)) {
            month = monthFromLocale(month, currency.locale) + 1;
        }
        if (month && yearSelected.value) {
            yearMonth = `${yearSelected.value}-${month}`;
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
        reindexRows();
    }
}

// client side
function goBack() {
    document.getElementById("fixed-form").classList.remove("active");
    document.getElementById("variable-form").classList.remove("active");
    document.getElementById("initial-form").classList.add("active");
}

// client side
function updatePlaceholders(currency) {
    const costInputs = document.querySelectorAll(".cost-input");
    costInputs.forEach((input) => {
        input.placeholder = new Intl.NumberFormat(currency.locale, {
            style: "currency",
            currency: currency.code,
        }).format(currency.placeholder);
    });
}

// client side
// Listen for input events on cost fields to format currency as user types
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
            console.log(value);
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

// client side
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

// client side
// data for error messages
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

// client side
// script to change error messages for input and select fields
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
};

// client side
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

// goes with changeschedule function can move to server
// simple move no changes needed
// function changeCost(payment, schedule, newSchedule) {
//     switch (schedule) {
//         case "Weekly":
//             payment = payment * 52;
//             break;
//         case "Bi-Weekly":
//             payment = payment * 26;
//             break;
//         case "Monthly":
//             payment = payment * 12;
//             break;
//         case "Bi-Monthly":
//             payment = payment * 6;
//             break;
//         case "Quarterly":
//             payment = payment * 4;
//             break;
//         case "Semi-Annually":
//             payment = payment * 2;
//             break;
//         case "Annually":
//             break;
//     }
//     switch (newSchedule) {
//         case "Weekly":
//             payment = (payment / 52).toFixed(2);
//             break;
//         case "Monthly":
//             payment = (payment / 12).toFixed(2);
//             break;
//         case "Quarterly":
//             payment = (payment / 4).toFixed(2);
//             break;
//         case "Annually":
//             break;
//     }
//     return payment;
// }

// can have server generate these values and send to client to switch as needed
// also updates elements innerHTML -- need to figure out
// need to pass all 4 schedule data sets from server
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

// can have server generate everything besides calling for the canvas and inputting new chart
// used only on data.ejs or /data
async function pieChart(pieData) {
    const chartElement = document.getElementById("pie-chart");
    if (!chartElement) {
        return;
    }
  
    new Chart(chartElement, {
        type: "pie",
        data: {
            labels: pieData.map((piece) => piece.label),
            datasets: [
                {
                    // label: "Categories",
                    data: pieData.map((piece) => piece.value),
                    backgroundColor: pieData.map((piece) => piece.color),
                    hoverOffset: 4,
                },
            ],
        },
        options: {
            // responsive: true,
            // maintainAspectRatio: false,
            locale: currency.locale,
            // cutout: 55,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 14,
                        },
                    },
                },
            },
        },
    });
}

// Set initial placeholders for all cost input fields
updatePlaceholders(currency);
updateErrorMessages();
changeSchedule("Monthly");
pieChart(pieData);
