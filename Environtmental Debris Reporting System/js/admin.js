/* SIDEBAR NAVIGATION */
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    if (location.hash !== '#' + id) {
        history.replaceState(null, '', '#' + id);
    }

    if (id === 'dashboardSection') {
        setTimeout(() => {
            try {
                renderCharts(_lastReportsData || []);
            } catch (e) {
                console.error('Error rendering charts on show:', e);
            }
        }, 60);
    }

    if (id === 'reportsSection') {
        setTimeout(() => {
            try {
                if (typeof map !== 'undefined' && map && map.invalidateSize) map.invalidateSize();
            } catch (e) { console.error('Error invalidating map size', e); }
        }, 100);
    }
}

/* MAP */
const map = L.map('map').setView([10.3230, 123.9397], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

/* POPUP */
function openPopup(r) {
    document.getElementById("popupTitle").innerText = `Report ID ${r.id}`;
    document.getElementById("popupWaste").innerText = r.wasteType;
    document.getElementById("popupLocation").innerText = r.locationType;
    document.getElementById("popupSeverity").innerText = r.severity;
    document.getElementById("popupNotes").innerText = r.notes;
    document.getElementById("popupDate").innerText = r.dateAdded || "N/A";
    document.getElementById("popupCleanedDate").innerText = r.cleanedDateFormatted || "N/A";
    document.getElementById("popupImage").src = r.photo || "";
    document.getElementById("detailsPopup").style.display = "block";
}

function closePopup() {
    document.getElementById("detailsPopup").style.display = "none";
}

/* HELPERS */
function el(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html.trim();
    return tmp.firstChild;
}

/* API PATHS */
const API = {
    getReports: '../api/api_get_reports.php',
    deleteReport: '../api/api_delete_report.php',
    updateReport: '../api/api_update_report.php'
};

/* LOAD AND RENDER */
let _lastReportsData = [];
async function loadReports() {
    try {
        const res = await fetch(API.getReports, { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
            const txt = await res.text();
            console.error('Fetch reports failed', res.status, txt);
            alert('Failed to load reports: ' + (txt || res.status));
            return;
        }
        const data = await res.json();
        if (data.error) {
            console.error('API error', data);
            alert('Failed to load reports: ' + (data.error || JSON.stringify(data)));
            return;
        }

        _lastReportsData = data;

        renderCounts(data);
        renderKPIs(data);
        renderLists(data);
        renderTable(data);
        renderMarkers(data);
        renderCharts(data);
    } catch (err) {
        console.error('Failed to load reports', err);
        showToast('Network error while loading reports', 'error');
    }
}

/* KPIs */
function renderKPIs(data) {
    const total = data.length;
    const pending = data.filter(r => Number(r.cleaned) === 0).length;
    const cleaned = total - pending;

    const months = {}; 
    data.forEach(r => {
        const d = new Date(r.timestamp || r.dateAdded);
        if (!isNaN(d.getTime())) months[d.getFullYear() + '-' + (d.getMonth()+1)] = true;
    });
    const avg = months && Object.keys(months).length ? Math.round(total / Object.keys(months).length) : total;

    document.getElementById('kpiTotal').innerText = total;
    document.getElementById('kpiPending').innerText = pending;
    document.getElementById('kpiCleaned').innerText = cleaned;
    document.getElementById('kpiAvg').innerText = avg;
}

/* Toast notification */
function showToast(message, type = 'info', timeout = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.bottom = '20px';
        container.style.zIndex = 9999;
        document.body.appendChild(container);
    }
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerText = message;
    container.appendChild(t);
    setTimeout(()=>{ t.classList.add('show'); }, 10);
    setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=> t.remove(),400); }, timeout);
}

/* Export CSV */
function exportCsv(data) {
    if (!Array.isArray(data)) data = [];
    if (data.length === 0) { showToast('No data to export', 'info'); return; }
    const cols = ['id','wasteType','locationType','severity','latitude','longitude','notes','cleaned','dateAdded','reportedBy'];
    const lines = [cols.join(',')];
    data.forEach(r => {
        const row = cols.map(c => '"' + ((r[c] !== undefined && r[c] !== null) ? String(r[c]).replace(/"/g,'""') : '') + '"');
        lines.push(row.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'reports.csv'; a.click(); URL.revokeObjectURL(url);
}

const exportBtn = document.getElementById('exportCsvBtn');
if (exportBtn) exportBtn.addEventListener('click', ()=> exportCsv(_lastReportsData));

const searchInput = document.getElementById('reportSearch');
if (searchInput) {
    searchInput.addEventListener('input', function() {
        const q = this.value.toLowerCase().trim();
        const filtered = _lastReportsData.filter(r => {
            return ['wasteType','locationType','notes','id','reportedBy'].some(k => (String(r[k]||'')).toLowerCase().includes(q));
        });
        renderLists(filtered);
        renderTable(filtered);
        renderMarkers(filtered);
        renderKPIs(filtered);
        renderCharts(filtered);
    });
}

function renderRecentReports(data) {
    const container = document.getElementById('recentReportsList');
    if (!container) return;
    container.innerHTML = '';
    const rows = (data || []).slice(0,6);
    rows.forEach(r => {
        const div = document.createElement('div');
        div.className = 'recent-item';
        const img = document.createElement('img'); img.className = 'recent-thumb'; img.src = r.photo || '';
        const meta = document.createElement('div'); meta.className = 'recent-meta';
        meta.innerHTML = `<div><b>Report #${r.id}</b> - ${r.wasteType} (${r.locationType})</div><div class="small">${r.dateAdded || ''} • ${r.severity}</div>`;
        const viewBtn = document.createElement('button'); viewBtn.className = 'action small'; viewBtn.style.marginLeft = 'auto'; viewBtn.innerText = 'View';
        viewBtn.addEventListener('click', ()=> openPopup(r));
        div.appendChild(img); div.appendChild(meta); div.appendChild(viewBtn);
        container.appendChild(div);
    });
}

function renderCounts(data) {
    const pending = data.filter(r => Number(r.cleaned) === 0).length;
    const cleaned = data.filter(r => Number(r.cleaned) === 1).length;
    document.getElementById('countPending').innerText = pending;
    document.getElementById('countCleaned').innerText = cleaned;
}

function renderLists(data) {
    const pendingList = document.getElementById('pendingList');
    const cleanedList = document.getElementById('cleanedList');
    pendingList.innerHTML = '';
    cleanedList.innerHTML = '';

    data.forEach(r => {
        const item = el(`<div class="list-item"><div class="list-left"><b>ID ${r.id}</b> - ${r.wasteType} - ${r.locationType}</div> <div class="list-actions"><button data-id="${r.id}" class="btn btn-view view-btn" title="View report ${r.id}">👁️ View</button></div></div>`);
        item.querySelector('.view-btn').addEventListener('click', ()=> openPopup(r));
        if (Number(r.cleaned) === 0) pendingList.appendChild(item);
        else cleanedList.appendChild(item);
    });
}

function renderTable(data) {
    const tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '';

    data.forEach(r => {
        const row = document.createElement('tr');

        const img = `<img src="${r.photo}" alt="photo" style="height:40px;width:60px;object-fit:cover">`;
        const notes = r.notes ? (r.notes.length > 80 ? r.notes.substr(0,80) + '...' : r.notes) : '';
        const status = Number(r.cleaned) === 1 ? 'Cleaned' : 'Pending';

        row.innerHTML = `
            <td>${r.id}</td>
            <td>${img}</td>
            <td>${r.wasteType}</td>
            <td>${r.locationType}</td>
            <td>${r.severity}</td>
            <td>${notes}</td>
            <td>${status}</td>
            <td>${r.dateAdded}</td>
            <td>
                <button class="btn btn-view view" data-id="${r.id}" title="View report ${r.id}">👁️ View</button>
                ${Number(r.cleaned) === 0 ? `<button class="btn btn-clean mark-clean" data-id="${r.id}" title="Mark as cleaned ${r.id}">✅ Mark</button>` : `<span class="badge cleaned-badge">Cleaned</span>`}
                <button class="btn btn-delete delete" data-id="${r.id}" title="Delete report ${r.id}">🗑️ Delete</button>
            </td>
        `;

        row.querySelector('.view').addEventListener('click', () => openPopup(r));
        const delBtn = row.querySelector('.delete');
        delBtn.addEventListener('click', () => deleteReport(r.id));
        const markBtn = row.querySelector('.mark-clean');
        if (markBtn) markBtn.addEventListener('click', () => updateReportStatus(r, 1));

        tbody.appendChild(row);
    });
}

function renderMarkers(data) {
    clearMarkers();
    data.forEach(r => {
        const lat = parseFloat(r.latitude);
        const lng = parseFloat(r.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            const m = L.marker([lat, lng]).addTo(map).bindPopup(`<b>ID ${r.id}</b><br>${r.wasteType} - ${r.locationType}`);
            m.on('click', ()=> openPopup(r));
            markers.push(m);
        }
    });
}

/* ACTIONS */
async function deleteReport(id) {
    if (!confirm('Delete report ID ' + id + '?')) return;
    try {
        const form = new URLSearchParams(); form.append('id', id);
        const res = await fetch(API.deleteReport, { method: 'POST', body: form, credentials: 'include', headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        if (data.success) {
            alert('Deleted');
            loadReports();
        } else {
            alert('Delete error: ' + (data.error || JSON.stringify(data)));
        }
    } catch (err) {
        console.error(err);
        alert('Delete failed');
    }
}

async function updateReportStatus(report, cleaned) {
    try {
        const payload = {
            id: report.id,
            wasteType: report.wasteType,
            locationType: report.locationType,
            severity: report.severity,
            notes: report.notes,
            cleaned: cleaned ? 1 : 0
        };
        const res = await fetch(API.updateReport, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (data.success) {
            alert('Updated');
            loadReports();
        } else {
            alert('Update error: ' + (data.error || JSON.stringify(data)));
        }
    } catch (err) {
        console.error(err);
        alert('Update failed');
    }
}

/* FILTERS */
function applyDashboardFilters() {
    const status = document.getElementById('filterStatus')?.value || 'all';
    const range = document.getElementById('filterRange')?.value || 'monthly';
    renderCharts(_lastReportsData, { status, range });
}

/* CHARTS */
let charts = { line: null, bar: null, pie: null, wasteType: null };
function destroyCharts() {
    Object.keys(charts).forEach(k => {
        if (charts[k]) {
            charts[k].destroy();
            charts[k] = null;
        }
    });
}

function renderCharts(data, opts = {}) {
    if (!Array.isArray(data)) data = [];
    const status = opts.status || document.getElementById('filterStatus')?.value || 'all';
    const range = opts.range || document.getElementById('filterRange')?.value || 'monthly';

    let filtered = data.slice();
    if (status === 'pending') filtered = filtered.filter(r => Number(r.cleaned) === 0);
    if (status === 'cleaned') filtered = filtered.filter(r => Number(r.cleaned) === 1);

    // Line chart: reports over time
    const countsByPeriod = {};
    filtered.forEach(r => {
        const t = new Date(r.timestamp || r.dateAdded);
        if (isNaN(t.getTime())) return;
        let key;
        if (range === 'yearly') key = t.getFullYear();
        else key = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0');
        countsByPeriod[key] = (countsByPeriod[key] || 0) + 1;
    });
    const lineLabels = Object.keys(countsByPeriod).sort();
    const lineData = lineLabels.map(k => countsByPeriod[k]);

    // Bar chart: severity
    const severityCounts = { Low: 0, Moderate: 0, High: 0 };
    filtered.forEach(r => { const s = r.severity || 'Low'; severityCounts[s] = (severityCounts[s]||0)+1; });
    const barLabels = Object.keys(severityCounts);
    const barData = barLabels.map(k => severityCounts[k]);

    // Pie chart: pending vs cleaned
    const pending = data.filter(r => Number(r.cleaned) === 0).length;
    const cleaned = data.filter(r => Number(r.cleaned) === 1).length;

    // NEW: Waste Type chart
    const wasteTypeCounts = {};
    filtered.forEach(r => {
        const type = r.wasteType || 'Unknown';
        wasteTypeCounts[type] = (wasteTypeCounts[type] || 0) + 1;
    });
    const wasteTypeLabels = Object.keys(wasteTypeCounts);
    const wasteTypeData = wasteTypeLabels.map(k => wasteTypeCounts[k]);
    
    // Color palette for waste types
    const wasteTypeColors = [
        '#103246ff', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    destroyCharts();

    // Line
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    charts.line = new Chart(lineCtx, {
        type: 'line',
        data: { labels: lineLabels, datasets: [{ label: 'Reports', data: lineData, fill: true, backgroundColor: 'rgba(3,64,146,0.08)', borderColor: '#0361B0', tension: 0.3, pointRadius: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }, scales: { x: { grid: { display: false } } } }
    });

    // Bar (severity)
    const barCtx = document.getElementById('barChart').getContext('2d');
    charts.bar = new Chart(barCtx, {
        type: 'bar',
        data: { labels: barLabels, datasets: [{ label: 'Severity', data: barData, backgroundColor: ['#6BCB77','#FFB020','#FF6B6B'] }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { beginAtZero: true } } } }
    });

    // Pie (pending vs cleaned)
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    charts.pie = new Chart(pieCtx, {
        type: 'doughnut',
        data: { labels: ['Pending','Cleaned'], datasets: [{ data: [pending, cleaned], backgroundColor: ['#FF9800','#3ECF8E'] }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom' } } }
    });

    // NEW: Waste Type chart (horizontal bar)
    const wasteTypeCanvas = document.getElementById('wasteTypeChart');
    if (wasteTypeCanvas) {
        const wasteTypeCtx = wasteTypeCanvas.getContext('2d');
        charts.wasteType = new Chart(wasteTypeCtx, {
            type: 'bar',
            data: { 
                labels: wasteTypeLabels, 
                datasets: [{ 
                    label: 'Reports', 
                    data: wasteTypeData, 
                    backgroundColor: wasteTypeColors.slice(0, wasteTypeLabels.length),
                    borderRadius: 6,
                    borderWidth: 0
                }] 
            },
            options: { 
                indexAxis: 'y',
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' ' + context.parsed.x + ' reports';
                            }
                        }
                    }
                }, 
                scales: { 
                    x: { 
                        beginAtZero: true,
                        ticks: { 
                            stepSize: 1,
                            precision: 0
                        },
                        grid: { 
                            display: true, 
                            color: 'rgba(0,0,0,0.05)' 
                        }
                    },
                    y: {
                        grid: { display: false }
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 5,
                        bottom: 5
                    }
                }
            }
        });
        console.log('Waste Type Chart created with data:', wasteTypeLabels, wasteTypeData);
    } else {
        console.error('wasteTypeChart canvas not found!');
    }

    renderRecentReports(data);
}

/* INITIAL LOAD */
document.addEventListener('DOMContentLoaded', function() {
    const hash = (location.hash || '').replace('#', '');
    if (hash && document.getElementById(hash)) {
        showSection(hash);
    } else {
        showSection('reportsSection');
    }

    loadReports();
});