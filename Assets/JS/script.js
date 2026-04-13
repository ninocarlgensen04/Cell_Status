const DEFAULT_DATA = [
  { cell: "Cell 1",  cable_status: "Not so Good, Mess-up Wire", need: "Dust Cleaning, Organize Wire", break_time: "10:00 am" },
  { cell: "Cell 2",  cable_status: "Average",                   need: "HDMI, Dust cleaning",          break_time: "9:10 am"  },
  { cell: "Cell 3",  cable_status: "Good",                      need: "Dust cleaning",                break_time: "10:15 am" },
  { cell: "Cell 4",  cable_status: "Average",                   need: "Dust cleaning",                break_time: "10:30 am" },
  { cell: "Cell 5",  cable_status: "Average, Mess-Up Wire",     need: "Organize Wire",                break_time: "9:30 am"  },
  { cell: "Cell 6",  cable_status: "Bad, Mess-Up Wire",         need: "Dust cleaning, Organize Wire", break_time: "9:30 am"  },
  { cell: "Cell 7",  cable_status: "Good",                      need: "Dust cleaning",                break_time: "Night Shift" },
  { cell: "Cell 8",  cable_status: "Good",                      need: "Dust cleaning",                break_time: "Unknown"  },
  { cell: "Cell 9",  cable_status: "Good",                      need: "Dust cleaning",                break_time: "9:00 am"  },
  { cell: "Cell 10", cable_status: "None",                      need: "None",                         break_time: "None"     },
  { cell: "Cell 11", cable_status: "Bad",                       need: "Dust cleaning",                break_time: "9:00 am"  },
  { cell: "Cell 12", cable_status: "Bad",                       need: "Dust cleaning",                break_time: "9:00 am"  },
  { cell: "Cell 13", cable_status: "Good",                      need: "",                             break_time: "Unknown"  },
  { cell: "Cell 14", cable_status: "Good",                      need: "",                             break_time: "9:00 am"  },
  { cell: "Cell 15", cable_status: "Good",                      need: "Dust cleaning",                break_time: "9:00 am"  },
  { cell: "Cell 16", cable_status: "Good",                      need: "",                             break_time: "9:30 am"  },
  { cell: "Cell 17", cable_status: "Good",                      need: "Dust cleaning",                break_time: "9:30 am"  },
  { cell: "Cell 18", cable_status: "Good",                      need: "Dust cleaning",                break_time: "10:30 am" },
  { cell: "Cell 19", cable_status: "Good",                      need: "Dust cleaning",                break_time: "Unknown"  },
  { cell: "Cell 20", cable_status: "Good",                      need: "",                             break_time: "10:00 am" },
  { cell: "Cell 21", cable_status: "Good",                      need: "",                             break_time: "9:45 am"  },
  { cell: "Cell 22", cable_status: "",                          need: "",                             break_time: ""         },
];

let data        = [];
let selectedIdx = null;
let editingIdx  = null;
let sortCol     = null;
let sortAsc     = true;

const API_URL = "https://script.google.com/macros/s/AKfycbx6KSWCaLgK5BEJ5fTA3ZgC9KSxKqqIz_-R083oQBTGw0BOwzuaq8bLRkweWPTfZtvT/exec";

// ── Initialize: Load data from Google Sheet ───────────────────────────────────
async function init() {
  try {
    console.log("Fetching data from Google Sheet...");
    const res = await fetch(API_URL, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    console.log("✓ Loaded from Google Sheet:", data.length, "rows");
  } catch (e) {
    console.warn("⚠ Failed to fetch. Using defaults:", e.message);
    data = DEFAULT_DATA.map(r => ({ ...r }));
  }
  renderTable();
}

// ── Status color logic ────────────────────────────────────────────────────────
function statusColor(s) {
  const l = (s || "").toLowerCase();
  if (l.includes("not so good")) return "var(--notgood)";
  if (l.includes("bad"))         return "var(--bad)";
  if (l.includes("average"))     return "var(--average)";
  if (l.includes("good"))        return "var(--good)";
  if (l === "none")              return "var(--none-c)";
  return "var(--muted)";
}

// ── Escape HTML ───────────────────────────────────────────────────────────────
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Render table ──────────────────────────────────────────────────────────────
function renderTable() {
  const q    = document.getElementById("searchInput").value.toLowerCase();
  const body = document.getElementById("tableBody");

  let rows = data.map((r, i) => ({ ...r, _orig: i }));

  if (q) {
    rows = rows.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(q))
    );
  }

  if (sortCol) {
    rows.sort((a, b) => {
      const av = (a[sortCol] || "").toLowerCase();
      const bv = (b[sortCol] || "").toLowerCase();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div>🔍</div>No matching cells found.</div></td></tr>`;
    updateFooter(0);
    return;
  }

  body.innerHTML = rows.map(r => {
    const color = statusColor(r.cable_status);
    const sel   = r._orig === selectedIdx ? "selected" : "";
    return `<tr class="${sel}" onclick="selectRow(${r._orig})" ondblclick="editSelected()">
      <td><span class="cell-name">${esc(r.cell) || "—"}</span></td>
      <td>
        <span class="status-pill">
          <span class="status-dot" style="background:${color}"></span>
          <span style="color:${color}">${esc(r.cable_status) || "—"}</span>
        </span>
      </td>
      <td><span class="need-text">${esc(r.need) || "<span style='color:var(--border)'>—</span>"}</span></td>
      <td><span class="break-text">${esc(r.break_time) || "—"}</span></td>
    </tr>`;
  }).join("");

  document.getElementById("rowCount").textContent =
    `${data.length} cell${data.length !== 1 ? "s" : ""}`;
  updateFooter(rows.length);
}

function updateFooter(visible) {
  document.getElementById("footerInfo").textContent =
    `${visible} of ${data.length} rows shown · Synced with Google Sheet`;
  document.getElementById("selInfo").textContent =
    selectedIdx !== null
      ? `Selected: ${data[selectedIdx]?.cell || "Row " + selectedIdx}`
      : "No row selected";
}

// ── Row selection ─────────────────────────────────────────────────────────────
function selectRow(idx) {
  selectedIdx = selectedIdx === idx ? null : idx;
  renderTable();
}

// ── Column sort ───────────────────────────────────────────────────────────────
function sortBy(col) {
  sortAsc = sortCol === col ? !sortAsc : true;
  sortCol = col;
  document.querySelectorAll("thead th").forEach(th => {
    th.classList.toggle("sorted", th.dataset.col === col);
    const icon = th.querySelector(".sort-icon");
    if (icon) icon.textContent =
      th.dataset.col === col ? (sortAsc ? "↑" : "↓") : "↕";
  });
  renderTable();
}

// ── Modal open / close ────────────────────────────────────────────────────────
function openModal(idx = null) {
  editingIdx = idx;
  document.getElementById("modalTitle").textContent =
    idx !== null ? "Edit Row" : "Add New Row";
  const r = idx !== null
    ? data[idx]
    : { cell: "", cable_status: "", need: "", break_time: "" };
  document.getElementById("f_cell").value  = r.cell;
  document.getElementById("f_cable").value = r.cable_status;
  document.getElementById("f_need").value  = r.need;
  document.getElementById("f_break").value = r.break_time;
  document.getElementById("modalBg").classList.add("open");
  setTimeout(() => document.getElementById("f_cell").focus(), 50);
}

function closeModal() {
  document.getElementById("modalBg").classList.remove("open");
  editingIdx = null;
}

function closeModalOnBg(e) {
  if (e.target === document.getElementById("modalBg")) closeModal();
}

// ── Save row from modal ───────────────────────────────────────────────────────
function saveRow() {
  const row = {
    cell:         document.getElementById("f_cell").value.trim(),
    cable_status: document.getElementById("f_cable").value.trim(),
    need:         document.getElementById("f_need").value.trim(),
    break_time:   document.getElementById("f_break").value.trim(),
  };
  if (!row.cell) { alert("Cell name is required."); return; }

  if (editingIdx !== null) {
    data[editingIdx] = row;
    flash("✔ Row updated");
  } else {
    data.push(row);
    flash("✔ Row added");
  }
  autoSave();
  closeModal();
  renderTable();
}

// ── Edit / Delete selected ────────────────────────────────────────────────────
function editSelected() {
  if (selectedIdx === null) return alert("Please select a row to edit.");
  openModal(selectedIdx);
}

function deleteSelected() {
  if (selectedIdx === null) return alert("Please select a row to delete.");
  if (!confirm(`Delete "${data[selectedIdx].cell}"?`)) return;
  data.splice(selectedIdx, 1);
  selectedIdx = null;
  autoSave();
  flash("✔ Row deleted");
  renderTable();
}

// ── Persist data to Google Sheet ──────────────────────────────────────────────
async function autoSave() {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log("✓ Saved to Google Sheet");
  } catch (e) {
    console.error("✗ Save failed:", e.message);
    flash("⚠ Save failed");
  }
}

function saveData() {
  autoSave();
  flash("💾 Saving...");
}

function resetData() {
  if (!confirm("Reset all data to defaults? This cannot be undone.")) return;
  data = DEFAULT_DATA.map(r => ({ ...r }));
  selectedIdx = null;
  autoSave();
  renderTable();
  flash("✔ Data reset to defaults");
}

// ── Flash status message ──────────────────────────────────────────────────────
let flashTimer;
function flash(msg) {
  const el = document.getElementById("statusMsg");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove("show"), 3000);
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  const modalOpen = document.getElementById("modalBg").classList.contains("open");
  if (modalOpen) {
    if (e.key === "Escape") closeModal();
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveRow(); }
    return;
  }
  if (e.key === "Escape")  { selectedIdx = null; renderTable(); }
  if (e.key === "Delete" && selectedIdx !== null) deleteSelected();
  if (e.key === "n" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openModal(); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
init();