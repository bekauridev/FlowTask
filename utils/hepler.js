// Accepts only specific fields from objects; ignores others
exports.filterFieldsObj = (objInput, ...fields) => {
  const newObj = {};
  Object.keys(objInput).forEach((el) => {
    if (fields.includes(el)) newObj[el] = objInput[el];
  });
  return newObj;
};

// Function to calculate the next day for a given date filter
exports.getNextDayRange = (dateString) => {
  if (!dateString) return null; // Return null if no date is provided

  const date = new Date(dateString);
  const nextDay = new Date(date);
  nextDay.setDate(date.getDate() + 1);

  return { $gte: date, $lt: nextDay };
};

// Checks if a given string contains any non-ASCII characters.
exports.containsNonASCII = (str) => {
  return /[^\x00-\x7F]/.test(str);
};

// Function to format date with provided options
exports.formatDate = (date, options) => {
  return new Date(date).toLocaleString("ka-ge", options);
};
