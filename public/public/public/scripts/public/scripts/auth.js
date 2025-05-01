import { initAdmin } from './admin.js';
import { initUser } from './user.js';

document.getElementById('btn-admin').addEventListener('click', () => {
  const pwd = prompt('Enter admin password:');
  if (pwd === '0404') {
    document.getElementById('mode-selection').hidden = true;
    initAdmin();
  } else {
    alert('Incorrect password.');
  }
});

document.getElementById('btn-user').addEventListener('click', () => {
  document.getElementById('mode-selection').hidden = true;
  initUser();
});
