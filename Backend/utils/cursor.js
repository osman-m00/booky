// utils/cursor.js
function encodeCursor(value) {
  const str = typeof value === "string" ? value : value.toISOString();
  return Buffer.from(str).toString("base64");
}

function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("ascii");
    const date = new Date(decoded);
    return isNaN(date.getTime()) ? decoded : date;
  } catch (err) {
    throw new Error("Invalid cursor");
  }
}

module.exports = { encodeCursor, decodeCursor };
