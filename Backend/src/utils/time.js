const getAppTimezone = () => process.env.APP_TIMEZONE || "Asia/Kolkata";

const toDateKey = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: getAppTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
};

const formatHHMM = (date) =>
  new Date(date).toLocaleTimeString("en-US", {
    timeZone: getAppTimezone(),
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const round2 = (value) => Math.round(value * 100) / 100;

module.exports = { toDateKey, formatHHMM, round2, getAppTimezone };
