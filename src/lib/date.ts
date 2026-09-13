// Server clock in the company's timezone, formatted as YYYY-MM-DD so it
// matches `date` columns regardless of where the server is hosted.
export function todayInJakarta() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}
