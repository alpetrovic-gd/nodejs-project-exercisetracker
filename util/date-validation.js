const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export function isDateInValidFormat(date) {
  return dateRegex.test(date) && !isNaN(new Date(date).getTime());
}
