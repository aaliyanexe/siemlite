const repo = require('./analytics.repository');
const incidentsRepo = require('../incidents/incidents.repository');

function resolveDates(query) {
  if (query.date_from || query.date_to) {
    return { date_from: query.date_from, date_to: query.date_to };
  }
  if (query.days && Number(query.days) > 0) {
    const date_to = new Date().toISOString();
    const date_from = new Date(Date.now() - Number(query.days) * 86400000).toISOString();
    return { date_from, date_to };
  }
  return { date_from: null, date_to: null };
}

async function threatFrequency(query) {
  const { date_from, date_to } = resolveDates(query);
  return repo.threatFrequency(date_from, date_to);
}

async function analystWorkload(query) {
  return repo.analystWorkload();
}

async function assetExposure(query) {
  return repo.assetExposure();
}

async function incidentTrends(query) {
  const period = query.groupBy || query.period || 'daily';
  const { date_from, date_to } = resolveDates(query);
  return repo.incidentTrends(period.toLowerCase(), date_from, date_to);
}

async function slaCompliance(query) {
  try { await incidentsRepo.refreshSlaBreachedFlags(); } catch (_) {}
  return repo.slaCompliance();
}

// ── NEW ──
async function incidentHeatmap() {
  return repo.incidentHeatmap();
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
  incidentHeatmap,
  adminDashboard,
  analystDashboard,
};