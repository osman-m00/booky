// utils/cursor.js
export function encodeCursor(value) {
  // Convert to string and Base64 encode
  const str = typeof value === 'string' ? value : value.toISOString();
  return Buffer.from(str).toString('base64');
}

export function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('ascii');
    const date = new Date(decoded);
    // If valid date, return as Date object, else return string
    return isNaN(date.getTime()) ? decoded : date;
  } catch (err) {
    throw new Error('Invalid cursor');
  }
}
