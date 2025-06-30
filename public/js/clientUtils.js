// static const variables set
const nextForm = document.getElementById("initial-form");
const variableForm = document.getElementById("variable-form");
const fixedForm = document.getElementById("fixed-form");
const addRowButton = document.querySelector("#add-row")

// initialize let variables
let rowIndex = 1; // set to 1 for new forms (table starts with 1 row index 0)
let combinations = [];

if (expense.historical && expense.historical.length > 0) {
    rowIndex = expense.historical.length - 1; // set rowIndex based on existing data length
    const dates = expense.historical.map(entry => new Date(entry.date));
    dates.forEach(date => {
        const month = date.getUTCMonth() + 1
        const year = date.getUTCFullYear()
        combinations.push(`${year}-${month}`) // adds historical data to combinations to track
    })
    reindexRows();
}

function monthFromLocale(monthName, locale) {
    let months = [];
    for (let i = 0; i < 12; i++) {
        const month = new Date(0, i).toLocaleString(locale, {
            month: 'long',
            timeZone: 'UTC'
        })
        months.push(month)
    }
    return months.indexOf(monthName);
}

function reindexRows() {
    const rows = document.querySelectorAll("#payment-table tbody tr");
    let idx = 0;
    rows.forEach(row => {
        // update name and id attributes for all inputs/selects in this row
        row.querySelectorAll("select, input").forEach(input => {
            if (input.name && input.name.includes("month")) input.name = `historical[${idx}][month]`;
            if (input.name && input.name.includes("year")) input.name = `historical[${idx}][year]`;
            if (input.name && input.name.includes("cost")) input.name = `historical[${idx}][cost]`;
            if (input.id && input.id.includes("month")) input.id = `month[${idx}]`;
            if (input.id && input.id.includes("year")) input.id = `year[${idx}]`;
            if (input.id && input.id.includes("cost")) input.id = `cost[${idx}]`;
        });
        const removeButton = row.querySelector('button.is-danger');
        if (removeButton) {
            removeButton.id = `remove[${idx}]`
            removeButton.dataset.index = idx;
        }
        idx++;
    });
    rowIndex = idx;
}

function setRowReadOnly(index, month, year) {
    const lastRow = document.getElementById(`month-year[${index}]`)
    const childToRemove = lastRow.querySelector('.month-year-group')
    lastRow.removeChild(childToRemove)
    const childToAdd = document.createElement('div')
    childToAdd.classList.add("field", "is-grouped", "month-year-group")
    formattedMonth = new Date(0, (month - 1)).toLocaleString(currency.locale, {
        month: 'long',
        timeZone: 'UTC'
    })
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
    </div>`

    childToAdd.innerHTML = rowReadOnly
    console.log(childToAdd)
    lastRow.appendChild(childToAdd)
}

function addRow() {
    const tbody = document.querySelector('tbody')
    const rowCount = tbody.rows.length - 1

    const monthSelected = document.getElementById(`month[${rowCount}]`)
    const yearSelected = document.getElementById(`year[${rowCount}]`)
    const costSelected = document.getElementById(`cost[${rowCount}]`)
    const errorMessage = document.querySelector('#year-month-error-message');

    let yearMonth = ''

    if (costSelected.readOnly) {
        return addRowData()
    }

    if (monthSelected.value && yearSelected.value && costSelected.value) {
        errorMessage.hidden = true;
        yearMonth = `${yearSelected.value}-${monthSelected.value}`
        if (combinations.includes(yearMonth)) {
            return errorMessage.hidden = false;
        }
        combinations.push(yearMonth)

        setRowReadOnly(rowCount, monthSelected.value, yearSelected.value)
        monthSelected.readOnly = true;
        yearSelected.readOnly = true;
        costSelected.readOnly = true;

        addRowData();
        updatePlaceholders(currency);
    }
}

function addRowData() {
    const table = document.getElementById("payment-table");
    const row = table.insertRow();
    const currentYear = new Date().getUTCFullYear();
    let yearOptions = '<option value="" disabled selected>Year</option>';
    for (let year = currentYear; year >= currentYear - 4; year--) {
        yearOptions += `<option value="${year}">${year}</option>`;
    }
    let monthOptions = '<option value="" disabled selected>Month</option>';
    for (let i = 0; i < 12; i++) {
        const month = (new Date(0, i)).toLocaleString(currency.locale, { month: 'long', timeZone: 'UTC' })
        monthOptions += `<option value="${i + 1}">${month}</option>`
    }
    row.innerHTML = `
    <td>
    <div id="month-year[${rowIndex}]">
        <div class="field is-grouped month-year-group">
            <div class="control">
                <div class="select">
                      <select class="month-input has-text-centered" name="historical[${rowIndex}][month]" id="month[${rowIndex}]" required>
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
        name="historical[${rowIndex}][cost]" min="0" required
    ></td>
    <td class="has-text-centered align-middle" style="vertical-align: middle">
        <button id="remove[${rowIndex}" data-index="${rowIndex}" type="button"
        class="button is-small is-danger remove-btn has-text-white has-text-weight-extrabold" onclick="removeRow(this)">
                <span class="icon"><i class="fa-solid fa-x fa-xl" style="color: #ffffff;"></i></span>
        </button>
    </td>`;
    reindexRows();
    addErrorMessageListeners(row);
}

// need to reset rowIndexes function
function removeRow(button) {
    const monthSelected = document.getElementById(`month[${button.dataset.index}]`);
    const yearSelected = document.getElementById(`year[${button.dataset.index}]`);
    let yearMonth = '';
        if (rowIndex >= 1) {
            let month = monthSelected.value
            if (month && month.length > 2) {
                month = monthFromLocale(month, currency.locale) + 1
            }
            if (month && yearSelected.value) {
                yearMonth = `${yearSelected.value}-${month}`
            }
            const comboIdx = combinations.indexOf(yearMonth)
            if (comboIdx && combinations.includes(yearMonth)) {
                combinations.splice(comboIdx, 1)
            }
            button.parentNode.parentNode.remove();
        }
        reindexRows();
}

function goBack() {
    document.getElementById("fixed-form").classList.remove("active");
    document.getElementById("variable-form").classList.remove("active");
    document.getElementById("initial-form").classList.add("active");
}

function updatePlaceholders(currency) {
    const costInputs = document.querySelectorAll(".cost-input");
    costInputs.forEach((input) => {
        input.placeholder =
            new Intl.NumberFormat(currency.locale, {
                style: "currency",
                currency: currency.code,
            }).format(currency.placeholder);
    });
}

// Listen for input events on cost fields to format currency as user types
document.addEventListener("input", (e) => {
    if (e.target.classList.contains("cost-input")) {

        // Remove all non-numeric characters and update the input value immediately
        e.target.value = e.target.value.replace(/[^0-9]/g, "");
        let value = e.target.value;

        // allows backspace
        if (e.inputType === "deleteContentBackward") {
            value = value.slice(0, -1)
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
        let formattedInput
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
// data for error messages
const inputNames = [
    {
        id: 'name-input',
        errorMessage: 'Please enter a name (max 15 characters).',
    },
    {
        id: 'cost-input',
        errorMessage: 'Please enter a cost.'
    },
    {
        id: 'month-input',
        errorMessage: 'Please select a month (Each Month/Year pair must be unique.)'
    },
    {
        id: 'year-input',
        errorMessage: 'Please select a year (Each Month/Year pair must be unique.)'
    },
]
// script to change error messages for input and select fields
function updateErrorMessages() {
    inputNames.forEach(input => {
        document.querySelectorAll(`.${input.id}`).forEach(selector => {
            selector.addEventListener('invalid', function () {
                this.setCustomValidity(input.errorMessage)
            });
            selector.addEventListener('input', function () {
                this.setCustomValidity('')
            });
        })
    })
}
// updates error message for new rows as added
function addErrorMessageListeners(row) {
    inputNames.forEach(input => {
        const newInput = row.querySelector(`.${input.id}`)
        if (newInput) {
            newInput.addEventListener('invalid', function () {
                this.setCustomValidity(input.errorMessage)
            });
            newInput.addEventListener('input', function () {
                this.setCustomValidity('')
            });
        }
    })
}
// Set initial placeholders for all cost input fields
updatePlaceholders(currency);
updateErrorMessages();