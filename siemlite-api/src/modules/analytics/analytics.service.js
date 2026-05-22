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

async function slaCompliance() {
  await incidentsRepo.refreshSlaBreachedFlags();
  return repo.slaCompliance();
}

async function incidentTrends(query) {
  return repo.incidentTrends(query.period || 'daily', query.date_from, query.date_to);
}

async function adminDashboard() {
  await incidentsRepo.refreshSlaBreachedFlags();
  return repo.adminDashboard();
}

async function analystDashboard(userId) {
  await incidentsRepo.refreshSlaBreachedFlags();
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
