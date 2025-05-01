import { machinesCol, bookingsCol, fs } from './firebase.js';
import { clearElement, formatDateTime, showModal, closeModal } from './ui-utils.js';

export function initUser() {
  const container = document.getElementById('app-container');
  container.hidden = false;
  container.innerHTML = `
    <h2>User Booking</h2>
    <section id="machine-selection">
      <h3>Select Machine</h3>
      <ul id="machine-list-user"></ul>
    </section>
    <section id="booking-form" hidden>
      <h3>New Booking</h3>
      <input id="user-name" placeholder="Your Name" />
      <input id="user-email" placeholder="Your Email" />
      <input type="datetime-local" id="start-datetime" />
      <input type="datetime-local" id="end-datetime" />
      <button id="btn-submit-booking">Submit</button>
    </section>
    <section id="active-bookings">
      <h3>Active Bookings</h3>
      <ul id="active-bookings-list"></ul>
    </section>
    <button id="btn-weekly-view-user">Toggle Weekly View</button>
    <div id="schedule-grid-user"></div>
  `;

  setupMachineSelection();
  setupBookingForm();
  setupActiveBookings();
  setupWeeklyViewUser();
}

let selectedMachine = null;
let userName = '';
let userEmail = '';
let unsubActive = null;

function setupMachineSelection() {
  const list = document.getElementById('machine-list-user');
  fs.onSnapshot(machinesCol, snap => {
    clearElement(list);
    snap.docs.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.data().name;
      li.onclick = () => {
        selectedMachine = doc.data().name;
        document.getElementById('booking-form').hidden = false;
      };
      list.appendChild(li);
    });
  });
}

function setupBookingForm() {
  document.getElementById('btn-submit-booking').addEventListener('click', async () => {
    userName = document.getElementById('user-name').value;
    userEmail = document.getElementById('user-email').value;
    const start = new Date(document.getElementById('start-datetime').value);
    const end = new Date(document.getElementById('end-datetime').value);
    if (!selectedMachine || !userName || !userEmail || !start || !end) return alert('Fill all fields');
    await fs.addDoc(bookingsCol, {
      machine: selectedMachine,
      user: userName,
      email: userEmail,
      start,
      end,
      physical: false,
      recipe: false,
      pressure: null,
      completed: false,
      physicalTime: null,
      recipeTime: null,
      pressureTime: null,
      completedTime: null
    });
    document.getElementById('booking-form').hidden = true;
    setupActiveBookings();
  });
}

function setupActiveBookings() {
  if (unsubActive) unsubActive();
  if (!userEmail) return;
  const q = fs.query(
    bookingsCol,
    fs.where('email', '==', userEmail),
    fs.where('completed', '==', false)
  );
  unsubActive = fs.onSnapshot(q, snap => {
    const list = document.getElementById('active-bookings-list');
    clearElement(list);
    snap.docs.forEach(doc => {
      const data = doc.data();
      const li = document.createElement('li');
      li.textContent = `${data.machine}: ${formatDateTime(data.start)} → ${formatDateTime(data.end)}`;
      li.onclick = () => showDetailPane(doc.id, data);
      list.appendChild(li);
    });
  });
}

function showDetailPane(id, data) {
  const html = `
    <h3>${data.machine}</h3>
    <p>${data.user} &lt;${data.email}&gt;</p>
    <p>${formatDateTime(data.start)} → ${formatDateTime(data.end)}</p>
    <label><input type="checkbox" id="chk-physical" ${data.physical ? 'checked' : ''}/> Physical Cleaning</label><br/>
    <label><input type="checkbox" id="chk-recipe" ${data.recipe ? 'checked' : ''}/> Recipe Cleaning</label><br/>
    <label>Recipe Used:
      <select id="sel-recipe">
        ${[1,2,3,4].map(r=>`<option value="${r}" ${data.recipeUsed==r?'selected':''}>${r}</option>`).join('')}
      </select>
    </label><br/>
    <label>Pressure: <input type="number" id="input-pressure" value="${data.pressure||''}"/></label><br/>
    <button id="btn-save-detail">Save</button>
    <button id="btn-complete-detail">Complete</button>
    <button id="btn-delete-detail">Delete</button>
    <button id="btn-close-detail">Close</button>
  `;
  showModal(html);

  document.getElementById('btn-close-detail').onclick = closeModal;
  document.getElementById('btn-delete-detail').onclick = async () => { await fs.deleteDoc(bookingsCol.doc(id)); closeModal(); };
  document.getElementById('btn-complete-detail').onclick = async () => { await fs.updateDoc(bookingsCol.doc(id), { completed: true, completedTime: new Date() }); closeModal(); };
  document.getElementById('btn-save-detail').onclick = async () => {
    const updates = {
      physical: document.getElementById('chk-physical').checked,
      recipe: document.getElementById('chk-recipe').checked,
      recipeUsed: document.getElementById('sel-recipe').value,
      pressure: parseFloat(document.getElementById('input-pressure').value),
      physicalTime: document.getElementById('chk-physical').checked ? new Date() : null,
      recipeTime: document.getElementById('chk-recipe').checked ? new Date() : null,
      pressureTime: document.getElementById('input-pressure').value ? new Date() : null
    };
    await fs.updateDoc(bookingsCol.doc(id), updates);
    closeModal();
  };
}

function setupWeeklyViewUser() {
  const btn = document.getElementById('btn-weekly-view-user');
  let shown = false, unsubscribe;
  btn.addEventListener('click', () => {
    const grid = document.getElementById('schedule-grid-user');
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
      unsubscribe = fs.onSnapshot(q, snap => renderUserWeekly(snap.docs.map(d => d.data())));
      btn.textContent = 'Hide Weekly View';
      shown = true;
    } else {
      unsubscribe && unsubscribe();
      document.getElementById('schedule-grid-user').innerHTML = '';
      btn.textContent = 'Toggle Weekly View';
      shown = false;
    }
  });
}

function renderUserWeekly(bookings) {
  const grid = document.getElementById('schedule-grid-user');
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
    row.innerHTML = `<td>${h}:00</td>` + '<td>'.repeat(7).split('').map(c=>`<td></td>`).join('');
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
