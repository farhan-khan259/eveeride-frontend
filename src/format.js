export const rupees = (n) =>
  `Rs ${((n || 0) / 100).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const when = (x) =>
  x
    ? new Date(x).toLocaleString("en-PK", {
        timeZone: "Asia/Karachi",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
