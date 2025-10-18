"use strict";

const BASE_URL = "https://comp4537-lab5-server-e1um.onrender.com/";

const SQL = {
  isSelect: (s) => /^\s*select\b/i.test(s),
  isInsert: (s) => /^\s*insert\b/i.test(s),
  touchesPatient: (s) => /\bpatient\b/i.test(s),
  trimEndSemi: (s) => String(s || "").replace(/;\s*$/, ""),
};

function $(sel) {
  return document.querySelector(sel);
}

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.defaultHeaders = { Accept: "application/json" };
  }

  async seed() {
    const res = await fetch(`${this.baseUrl}/api/v1/seed`, {
      method: "POST",
      headers: this.defaultHeaders,
    });
    return this.readJson(res);
  }

  async runSelect(sql) {
    const encoded = encodeURIComponent(SQL.trimEndSemi(sql));
    const res = await fetch(`${this.baseUrl}/api/v1/sql/${encoded}`, {
      method: "GET",
      headers: this.defaultHeaders,
    });
    return this.readJson(res);
  }

  async runInsert(sql) {
    const res = await fetch(`${this.baseUrl}/api/v1/sql`, {
      method: "POST",
      headers: { ...this.defaultHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ query: SQL.trimEndSemi(sql) }),
    });
    return this.readJson(res);
  }

  async readJson(res) {
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: "Invalid JSON from server." };
    }
    if (!res.ok || (data && data.error)) {
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }
}

class UI {
  constructor() {
    this.txtTitle = document.getElementById("txtTitle");
    this.txtSubtitle = document.getElementById("txtSubtitle");
    this.txtPanelQueryTitle = document.getElementById("txtPanelQueryTitle");
    this.txtPanelQueryDesc = document.getElementById("txtPanelQueryDesc");
    this.txtSqlLabel = document.getElementById("txtSqlLabel");
    this.sqlHelp = document.getElementById("sqlHelp");
    this.txtBtnRun = document.getElementById("txtBtnRun");
    this.txtBtnSeed = document.getElementById("txtBtnSeed");
    this.txtAutoRefreshLabel = document.getElementById("txtAutoRefreshLabel");
    this.txtPanelResponseTitle = document.getElementById(
      "txtPanelResponseTitle"
    );
    this.txtPanelResponseDesc = document.getElementById("txtPanelResponseDesc");
    this.txtTableTitle = document.getElementById("txtTableTitle");
    this.txtTableDesc = document.getElementById("txtTableDesc");
    this.txtBtnRefresh = document.getElementById("txtBtnRefresh");
    this.txtFooter = document.getElementById("txtFooter");

    this.sqlInput = document.getElementById("sqlInput");
    this.btnRun = document.getElementById("btnRun");
    this.btnSeed = document.getElementById("btnSeed");
    this.btnRefresh = document.getElementById("btnRefresh");
    this.chkAutoRefresh = document.getElementById("chkAutoRefresh");
    this.alertArea = document.getElementById("alertArea");
    this.rawResponse = document.getElementById("rawResponse");
    this.patientTbody = document.getElementById("patientTbody");
    this.txtRowCount = document.getElementById("txtRowCount");
  }

  injectStrings(strings) {
    this.txtTitle.textContent = strings.title;
    this.txtSubtitle.textContent = strings.subtitle;
    this.txtPanelQueryTitle.textContent = strings.panelQueryTitle;
    this.txtPanelQueryDesc.textContent = strings.panelQueryDesc;
    this.txtSqlLabel.textContent = strings.sqlLabel;
    this.sqlHelp.textContent = strings.sqlHelp;
    this.txtBtnRun.textContent = strings.btnRun;
    this.txtBtnSeed.textContent = strings.btnSeed;
    this.txtAutoRefreshLabel.textContent = strings.autoRefreshLabel;
    this.txtPanelResponseTitle.textContent = strings.panelResponseTitle;
    this.txtPanelResponseDesc.textContent = strings.panelResponseDesc;
    this.txtTableTitle.textContent = strings.tableTitle;
    this.txtTableDesc.textContent = strings.tableDesc;
    this.txtBtnRefresh.textContent = strings.btnRefresh;
  }

  setRawResponse(data) {
    this.rawResponse.textContent = pretty(data);
  }

  showAlert(message, type = "success") {
    this.alertArea.innerHTML = `
      <div class="alert alert-${type} d-flex align-items-center mb-0" role="alert">
        <div>${message}</div>
      </div>`;
    setTimeout(() => {
      this.alertArea.innerHTML = "";
    }, 3500);
  }

  setButtonsLoading(isLoading) {
    const toggle = (btn, on) => {
      if (!btn) return;
      btn.disabled = on;
      btn.classList.toggle("disabled", on);
    };
    toggle(this.btnRun, isLoading);
    toggle(this.btnSeed, isLoading);
    toggle(this.btnRefresh, isLoading);
  }

  formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr; 
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}


renderPatients(rows = []) {
  const html = rows.map(r => {
    const formattedDate = this.formatDate(r.dateOfBirth);
    return `
      <tr>
        <td>${r.patientid ?? ""}</td>
        <td>${escapeHtml(r.name ?? "")}</td>
        <td>${formattedDate}</td>
      </tr>
    `;
  }).join("");

  this.patientTbody.innerHTML = html || `
    <tr><td colspan="3" class="text-center text-secondary py-4">No rows.</td></tr>
  `;
  this.txtRowCount.textContent = `${rows.length} row(s)`;
}

}

function escapeHtml(x) {
  return String(x)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

class App {
  constructor() {
    this.api = new ApiClient(BASE_URL);
    this.ui = new UI();
  }

  async init() {
    this.ui.injectStrings(window.STRINGS);

    this.ui.sqlInput.value = "SELECT * FROM patient;";

    this.ui.btnRun.addEventListener("click", () => this.onRun());
    this.ui.btnSeed.addEventListener("click", () => this.onSeed());
    this.ui.btnRefresh.addEventListener("click", () => this.refreshTable());

    await this.refreshTable();
  }

  async onSeed() {
    try {
      this.ui.setButtonsLoading(true);
      const data = await this.api.seed();
      this.ui.setRawResponse(data);
      this.ui.showAlert(STRINGS.alerts.seeded, "success");
      if (this.ui.chkAutoRefresh.checked) await this.refreshTable();
    } catch (err) {
      this.ui.setRawResponse({ error: err.message });
      this.ui.showAlert(`${STRINGS.alerts.error}: ${err.message}`, "danger");
    } finally {
      this.ui.setButtonsLoading(false);
    }
  }

  async onRun() {
    const sql = this.ui.sqlInput.value.trim();
    if (!sql) {
      this.ui.showAlert(STRINGS.alerts.emptySql, "warning");
      return;
    }
    if (!SQL.touchesPatient(sql)) {
      this.ui.showAlert(STRINGS.alerts.onlyPatient, "warning");
      return;
    }

    try {
      this.ui.setButtonsLoading(true);

      if (SQL.isSelect(sql)) {
        const data = await this.api.runSelect(sql);
        this.ui.setRawResponse(data);
        this.ui.showAlert(STRINGS.alerts.selectOk, "success");
        // If it's a SELECT * FROM patient, repaint table from response if rows present
        if (Array.isArray(data?.rows)) {
          this.ui.renderPatients(data.rows);
        } else if (this.ui.chkAutoRefresh.checked) {
          await this.refreshTable();
        }
      } else if (SQL.isInsert(sql)) {
        const data = await this.api.runInsert(sql);
        this.ui.setRawResponse(data);
        this.ui.showAlert(STRINGS.alerts.insertOk, "success");
        if (this.ui.chkAutoRefresh.checked) await this.refreshTable();
      } else {
        this.ui.showAlert(STRINGS.alerts.invalid, "danger");
      }
    } catch (err) {
      this.ui.setRawResponse({ error: err.message });
      this.ui.showAlert(`${STRINGS.alerts.error}: ${err.message}`, "danger");
    } finally {
      this.ui.setButtonsLoading(false);
    }
  }

  async refreshTable() {
    try {
      this.ui.setButtonsLoading(true);
      const data = await this.api.runSelect("SELECT * FROM patient");
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      this.ui.renderPatients(rows);
      if (!this.ui.rawResponse.textContent.trim()) this.ui.setRawResponse(data);
    } catch (err) {
      this.ui.renderPatients([]);
      this.ui.setRawResponse({ error: err.message });
    } finally {
      this.ui.setButtonsLoading(false);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const app = new App();
  app.init();
});
