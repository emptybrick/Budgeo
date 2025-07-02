const currencies = [
    { name: 'US Dollar', code: 'USD', locale: 'en-US', symbol: '$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Euro', code: 'EUR', locale: 'de-DE', symbol: '€', symbolPosition: 'back', placeholder: '0.00' },
    { name: 'Japanese Yen', code: 'JPY', locale: 'ja-JP', symbol: '¥', symbolPosition: 'front', placeholder: '0' },
    { name: 'British Pound Sterling', code: 'GBP', locale: 'en-GB', symbol: '£', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Chinese Yuan', code: 'CNY', locale: 'zh-CN', symbol: '¥', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Swiss Franc', code: 'CHF', locale: 'de-CH', symbol: 'CHF', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Canadian Dollar', code: 'CAD', locale: 'en-CA', symbol: 'CA$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Australian Dollar', code: 'AUD', locale: 'en-AU', symbol: 'AU$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Hong Kong Dollar', code: 'HKD', locale: 'zh-HK', symbol: 'HK$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Singapore Dollar', code: 'SGD', locale: 'en-SG', symbol: 'S$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'South Korean Won', code: 'KRW', locale: 'ko-KR', symbol: '₩', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Brazilian Real', code: 'BRL', locale: 'pt-BR', symbol: 'R$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Russian Ruble', code: 'RUB', locale: 'ru-RU', symbol: '₽', symbolPosition: 'back', placeholder: '0.00' },
    { name: 'South African Rand', code: 'ZAR', locale: 'en-ZA', symbol: 'R', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Mexican Peso', code: 'MXN', locale: 'es-MX', symbol: 'Mex$', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Swedish Krona', code: 'SEK', locale: 'sv-SE', symbol: 'kr', symbolPosition: 'back', placeholder: '0.00' },
    { name: 'Norwegian Krone', code: 'NOK', locale: 'no-NO', symbol: 'kr', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'Turkish Lira', code: 'TRY', locale: 'tr-TR', symbol: '₺', symbolPosition: 'front', placeholder: '0.00' },
    { name: 'New Zealand Dollar', code: 'NZD', locale: 'en-NZ', symbol: 'NZ$', symbolPosition: 'front', placeholder: '0.00' }
];

function calculateVariableCost(historical) {

    // calculating total amount of months between earliest and latest entries
    const dates = historical.map(entry => entry.date);
    const sortedDates = dates.sort((a, b) => a - b)
    const earliestDate = sortedDates.at(0);
    const latestDate = sortedDates.at(sortedDates.length - 1);
    const yearEarliest = earliestDate.getUTCFullYear()
    const monthEarliest = earliestDate.getUTCMonth() + 1
    const yearLatest = latestDate.getUTCFullYear()
    const monthLatest = latestDate.getUTCMonth() + 1
    const monthsLeftEarliest = (Math.abs(monthEarliest - 12))
    const MonthsCoveredLatest = monthLatest
    const yearDiff = (Math.abs(yearEarliest - yearLatest) - 1)
    const monthsOfYearDiff = yearDiff * 12
    const totalMonthsCovered = monthsOfYearDiff + monthsLeftEarliest + MonthsCoveredLatest

    // array of costs
    const costs = historical.map(entry => entry.cost)

    // if only 1 month of data to prevent issues
    if (totalMonthsCovered < 1) {
        return { cost: costs.reduce((sum, cost) => sum + cost, 0) }
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
            upper: sortedMeans[upperIndex]
        };
    }

    // Run bootstrapping with 1000 samples
    const numSamples = 1000;
    const means = bootstrapMeans(costs, numSamples);
    const ci = getConfidenceInterval(means);
    const ciHigh = Number(ci.upper.toFixed(2))
    const ciLow = Number(ci.lower.toFixed(2))
    const averageCI = Number(((ciLow + ciHigh) / 2).toFixed(2))

    return {
        cost: averageCI,
        low: ciLow,
        high: ciHigh
    }

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

module.exports = {
    calculateVariableCost,
    currencies,
    monthFromLocale
};