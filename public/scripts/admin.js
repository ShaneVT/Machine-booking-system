import { machinesCol, bookingsCol, auditCol, fs } from './firebase.js';
import { clearElement, formatDateTime, showModal, closeModal } from './ui-utils.js';

export function initAdmin() {
  const container = document.getElementById('app-container');
  container.hidden = false;
  container.innerHTML = `
    <h2>Admin Panel</h2>
    <section id="manage-machines">
      <h3>Manage Machines</h3>
      <input id="machine-name" placeholder="Machine name" />
      <button id="btn-add-machine">Add Machine</button>
      <ul id="machine-list"></ul>
    </section>

    <section id="usage-logs">
      <h3>Usage Logs</h3>
      <input type="date" id="log-from" />
      <input type="date" id="log-to" />
      <button id="btn-filter-logs">Filter</button>
      <table id="logs-table">
        <thead><tr>
          <th>Machine</th><th>User</th><th>Start</th><th>End</th>
          <th>Physical</th><th>Recipe</th><th>Pressure</th><th>Completed</th><th>Actions</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </section>

    <section id="audit-log">
      <h3>Audit Log</h3>
      <button id="btn-view-audit">View Audit</button>
      <table id="audit-table">
        <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
        <tbody></tbody>
      </table>
    </section>

    <section id="weekly-schedule">
      <h3>Weekly Schedule View</h3>
      <button id="btn-weekly-view">Toggle Weekly View</button>
      <div id="schedule-grid"></div>
    </section>
  `;

  setupMachines();
  setupUsageLogs();
  setupAuditLog();
  setupWeeklySchedule();
}

function setupMachines() {
  const list = document.getElementById('machine-list');
  const nameInput = document.getElementById('machine-name');
  document.getElementById('btn-add-machine').addEventListener('click', async () => {
    if (!nameInput.value) return alert('Enter a name');
    await fs.addDoc(machinesCol, { name: nameInput.value });
    nameInput.value = '';
  });
  fs.onSnapshot(machinesCol, snapshot => {
    clearElement(list);
    snapshot.docs.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.data().name;
      const del = document.createElement('button');
      del.textContent = 'Delete';
      del.onclick = () => fs.deleteDoc(doc.ref);
      li.appendChild(del);
      list.appendChild(li);
    });
  });
}

function setupUsageLogs() {
  document.getElementById('btn-filter-logs').addEventListener('click', () => {
    const from = new Date(document.getElementById('log-from').value);
    const to = new Date(document.getElementById('log-to').value);
    const q = fs.query(
      bookingsCol,
      fs.where('start', '>=', from),
      fs.where('start', '<=', to)
    );
    fs.onSnapshot(q, snap => renderLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  });
}

function renderLogs(entries) {
  const tbody = document.querySelector('#logs-table tbody');
  clearElement(tbody);
  entries.forEach(e => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.machine}</td>
      <td>${e.user}</td>
      <td>${formatDateTime(e.start)}</td>
      <td>${formatDateTime(e.end)}</td>
      <td>${e.physical ? '✓' : '✘'}</td>
      <td>${e.recipe ? '✓' : '✘'}</td>
      <td>${e.pressure || ''}</td>
      <td>${e.completed ? '✓' : '✘'}</td>
      <td></td>
    `;
    const actionsTd = tr.children[8];
    const btnDel = document.createElement('button');
    btnDel.textContent = 'Delete';
    btnDel.onclick = () => fs.deleteDoc(bookingsCol.doc(e.id));
    const btnComp = document.createElement('button');
    btnComp.textContent = 'Complete';
    btnComp.onclick = () => fs.updateDoc(bookingsCol.doc(e.id), { completed: true, completedTime: new Date() });
    const btnPdf = document.createElement('button');
    btnPdf.textContent = 'Export PDF';
    btnPdf.onclick = () => window.print();
    actionsTd.append(btnDel, btnComp, btnPdf);
    tbody.appendChild(tr);
  });
}

function setupAuditLog() {
  document.getElementById('btn-view-audit').addEventListener('click', () => {
    const q = fs.query(auditCol, fs.orderBy('time', 'desc'));
    fs.onSnapshot(q, snap => {
      const tbody = document.querySelector('#audit-table tbody');
      clearElement(tbody);
      snap.docs.forEach(d => {
        const data = d.data();
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${formatDateTime(data.time)}</td>
          <td>${data.user}</td>
          <td>${data.action}</td>
          <td>${data.details}</td>
        `;
        tbody.appendChild(tr);
      });
    });
  });
}

function setupWeeklySchedule() {
  const btn = document.getElementById('btn-weekly-view');
  let shown = false, unsubscribe;
  btn.addEventListener('click', () => {
    const grid = document.getElementById('schedule-grid');
    if (!shown) {
      const now = new Date();
      const monday = new Date(now.setDate(now.getDate() - ((now.getDay() + 6) % 7)));
      monday.setHours(0,0,0,0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 7);
      const q = fs.query(
        bookingsCol,
        fs.where('start', '>=', monday),
        fs.where('start', '<', sunday)
      );
      unsubscribe = fs.onSnapshot(q, snap => renderWeeklyGrid(snap.docs.map(d => d.data())));
      btn.textContent = 'Hide Weekly View';
      shown = true;
    } else {
      unsubscribe && unsubscribe();
      document.getElementById('schedule-grid').innerHTML = '';
      btn.textContent = 'Toggle Weekly View';
      shown = false;
    }
  });
}

function renderWeeklyGrid(bookings) {
  const grid = document.getElementById('schedule-grid');
  clearElement(grid);
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = '<th>Time</th>' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<th>${d}</th>`).join('');
  thead.appendChild(headerRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (let h=9; h<=17; h++) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${h}:00</td>` + '<td>'.repeat(7).split('').map(_=>'').map(c=>`<td></td>`).join('');
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  bookings.forEach(b => {
    const start = b.start.toDate ? b.start.toDate() : new Date(b.start);
    const dayIndex = (start.getDay()+6)%7;
    const hour = start.getHours();
    const row = tbody.children[hour - 9];
    if (row) row.children[dayIndex+1].textContent = 'X';
  });
  grid.appendChild(table);
}
