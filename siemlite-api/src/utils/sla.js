const SLA_HOURS = {
  Critical: 1,
  High: 4,
  Medium: 24,
  Low: 72,
};

function calculateSlaDeadline(severity, fromDate = new Date()) {
  const hours = SLA_HOURS[severity];
  if (!hours) {
    throw new Error(`Invalid severity: ${severity}`);
  }
  const deadline = new Date(fromDate);
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
}

function isSlaBreached(slaDeadline, status) {
  if (status === 'Resolved') return false;
  return new Date() > new Date(slaDeadline);
}

module.exports = { calculateSlaDeadline, isSlaBreached, SLA_HOURS };
