const toDateKey = (date = new Date()) => date.toISOString().split("T")[0];

const formatHHMM = (date) =>
  new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const round2 = (value) => Math.round(value * 100) / 100;

module.exports = { toDateKey, formatHHMM, round2 };
