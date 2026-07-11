(function () {
  function cfg() {
    return window.SITE_CONFIG || {};
  }

  function hasSupabase() {
    const c = cfg();
    return Boolean(c.supabaseUrl && c.supabaseAnonKey);
  }

  function hasApiBase() {
    const base = (cfg().apiBase || "").replace(/\/$/, "");
    return Boolean(base);
  }

  function apiReportsUrl() {
    const base = (cfg().apiBase || "").replace(/\/$/, "");
    if (!base) return "/api/reports";
    return `${base}/api/reports`;
  }

  function rowToReport(row) {
    return {
      id: row.id,
      location: row.location,
      locationLabel: row.location_label,
      pollutionType: row.pollution_type,
      description: row.description,
      imageEvidence: row.image_evidence,
      coordinates: {
        latitude: row.latitude,
        longitude: row.longitude
      },
      timestamp: row.created_at
    };
  }

  async function geocodeLocation(location) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      location
    )}`;
    const response = await fetch(url, {
      headers: { "Accept-Language": "en" }
    });
    if (!response.ok) {
      throw new Error(`Geocoding failed (${response.status})`);
    }
    const results = await response.json();
    const first = Array.isArray(results) ? results[0] : null;
    if (!first?.lat || !first?.lon) {
      throw new Error("Unable to geocode location. Please be more specific.");
    }
    return {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name || location
    };
  }

  async function submitReportSupabase(report) {
    const c = cfg();
    const url = `${c.supabaseUrl.replace(/\/$/, "")}/rest/v1/pollution_reports`;
    const body = {
      location: report.location,
      location_label: report.locationLabel,
      pollution_type: report.pollutionType,
      description: report.description,
      image_evidence: report.imageEvidence,
      latitude: report.coordinates.latitude,
      longitude: report.coordinates.longitude
    };
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: c.supabaseAnonKey,
        Authorization: `Bearer ${c.supabaseAnonKey}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      const msg = data?.message || data?.hint || text || `Save failed (${res.status})`;
      throw new Error(msg);
    }
    const row = Array.isArray(data) ? data[0] : data;
    return rowToReport(row);
  }

  async function submitReportExpress(payload) {
    const res = await fetch(apiReportsUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(result?.error || "Failed to submit report.");
    }
    return result;
  }

  async function listReportsSupabase() {
    const c = cfg();
    const url = `${c.supabaseUrl.replace(/\/$/, "")}/rest/v1/pollution_reports?select=*&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        apikey: c.supabaseAnonKey,
        Authorization: `Bearer ${c.supabaseAnonKey}`
      }
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "Failed to load reports.");
    }
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];
    return rows.map(rowToReport);
  }

  async function listReportsExpress() {
    const res = await fetch(apiReportsUrl());
    if (!res.ok) {
      throw new Error("Failed to load reports.");
    }
    return res.json();
  }

  /**
   * @param {{ location: string, pollutionType: string, description: string, imageEvidence: string | null }} input
   */
  async function submitReport(input) {
    if (!hasSupabase() && !hasApiBase() && typeof window.location !== "undefined") {
      const isLocal =
        window.location.protocol === "file:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";
      if (!isLocal) {
        throw new Error(
          "Pollution reports are not configured for this site. Add Supabase URL and anon key in js/site-config.js (see README)."
        );
      }
    }

    const geo = await geocodeLocation(input.location.trim());
    const report = {
      location: input.location.trim(),
      pollutionType: input.pollutionType.trim(),
      description: input.description.trim(),
      imageEvidence: input.imageEvidence,
      locationLabel: geo.displayName,
      coordinates: {
        latitude: geo.latitude,
        longitude: geo.longitude
      }
    };

    if (hasSupabase()) {
      return submitReportSupabase(report);
    }

    const payload = {
      location: report.location,
      pollutionType: report.pollutionType,
      description: report.description,
      imageEvidence: report.imageEvidence
    };

    if (hasApiBase() || !hasSupabase()) {
      return submitReportExpress(payload);
    }

    throw new Error("Configure js/site-config.js with Supabase or apiBase.");
  }

  async function listReports() {
    if (hasSupabase()) {
      return listReportsSupabase();
    }
    if (!hasApiBase() && typeof window !== "undefined") {
      const h = window.location.hostname;
      const isLocal =
        window.location.protocol === "file:" || h === "localhost" || h === "127.0.0.1";
      if (!isLocal) {
        throw new Error(
          "Pollution map needs Supabase. Set supabaseUrl and supabaseAnonKey in js/site-config.js (see README)."
        );
      }
    }
    return listReportsExpress();
  }

  window.PollutionApi = {
    geocodeLocation,
    submitReport,
    listReports,
    isConfigured() {
      return hasSupabase() || hasApiBase();
    }
  };
})();
