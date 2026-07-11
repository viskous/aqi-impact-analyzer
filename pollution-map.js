const mapStatusEl = document.getElementById("mapStatus");
const reportListEl = document.getElementById("reportList");
const map = L.map("pollutionMap").setView([20.5937, 78.9629], 5);
const markersLayer = L.layerGroup().addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message) {
  mapStatusEl.textContent = message;
}

function listItemTemplate(report) {
  const time = new Date(report.timestamp).toLocaleString();
  return `
    <li>
      <div class="report-list-location">${escapeHtml(report.locationLabel || report.location)}</div>
      <div class="report-list-type">${escapeHtml(report.pollutionType)}</div>
      <div class="report-list-meta">${escapeHtml(time)}</div>
    </li>
  `;
}

function renderReportList(reports) {
  if (!reportListEl) return;
  if (!reports.length) {
    reportListEl.innerHTML = '<li class="report-list-empty">No mapped reports yet.</li>';
    return;
  }
  reportListEl.innerHTML = reports.map(listItemTemplate).join("");
}

function markerPopup(report) {
  const time = new Date(report.timestamp).toLocaleString();
  const imageHtml = report.imageEvidence
    ? `<img class="popup-image" src="${report.imageEvidence}" alt="Evidence image">`
    : "";

  return `
    <div class="popup-wrap">
      <div><strong>${escapeHtml(report.pollutionType)}</strong></div>
      <div>${escapeHtml(report.locationLabel || report.location)}</div>
      <div class="popup-meta">${escapeHtml(time)}</div>
      <p>${escapeHtml(report.description)}</p>
      ${imageHtml}
    </div>
  `;
}

async function refreshMapReports() {
  try {
    const reports = await window.PollutionApi.listReports();
    markersLayer.clearLayers();
    const mappedReports = [];
    reports.forEach((report) => {
      const lat = report?.coordinates?.latitude;
      const lon = report?.coordinates?.longitude;
      if (typeof lat !== "number" || typeof lon !== "number") return;

      const marker = L.marker([lat, lon]).bindPopup(markerPopup(report));
      marker.addTo(markersLayer);
      mappedReports.push(report);
    });
    renderReportList(mappedReports);

    if (mappedReports.length > 0) {
      setStatus(`${mappedReports.length} report(s) mapped. Auto-refreshing every 10 seconds.`);
    } else {
      setStatus("No reports yet. Submit one from the Report Pollution page.");
    }
  } catch (error) {
    renderReportList([]);
    setStatus(error?.message || "Could not refresh pollution map.");
  }
}

refreshMapReports();
setInterval(refreshMapReports, 10000);
