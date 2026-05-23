const repo = require('./analytics.repository');
const incidentsRepo = require('../incidents/incidents.repository');

async function threatFrequency(query) {
  return repo.threatFrequency(query.date_from, query.date_to);
}

async function analystWorkload() {
  return repo.analystWorkload();
}

async function assetExposure() {
  return repo.assetExposure();
}

async function incidentTrends(query) {
  const period = query.groupBy || query.period || 'daily';
  return repo.incidentTrends(period.toLowerCase(), query.date_from, query.date_to);
}

async function slaCompliance() {
  try { await incidentsRepo.refreshSlaBreachedFlags(); } catch (_) {}
  return repo.slaCompliance();
}

async function adminDashboard() {
  try { await incidentsRepo.refreshSlaBreachedFlags(); } catch (_) {}
  return repo.adminDashboard();
}

async function analystDashboard(userId) {
  try { await incidentsRepo.refreshSlaBreachedFlags(); } catch (_) {}
  return repo.analystDashboard(userId);
}

module.exports = {
  threatFrequency,
  analystWorkload,
  assetExposure,
  slaCompliance,
  incidentTrends,
  adminDashboard,
  analystDashboard,
};
