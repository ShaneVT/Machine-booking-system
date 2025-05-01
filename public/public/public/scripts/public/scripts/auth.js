import { initAdmin } from './admin.js';
import { initUser } from './user.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnAdmin = document.getElementById('btn-admin');
  const btnUser  = document.getElementById('btn-user');

  if (btnAdmin) {
    btnAdmin.addEventListener('click', () => {
      const pwd = prompt('Enter admin password:');
      if (pwd === '0404') {
        document.getElementById('mode-selection').hidden = true;
        initAdmin();
      } else {
        alert('Incorrect password.');
      }
    });
  }

  if (btnUser) {
    btnUser.addEventListener('click', () => {
      document.getElementById('mode-selection').hidden = true;
      initUser();
    });
  }
});
