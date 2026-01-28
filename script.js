async function loadTvs() {
  try {
    const res = await fetch('/api/tvs');
    const tvs = await res.json();
    const tbody = document.getElementById('tvList');
    tbody.innerHTML = '';
    tvs.forEach(tv => {
      const row = `<tr><td>${tv.room}</td><td>${tv.ip}</td></tr>`;
      tbody.innerHTML += row;
    });
  } catch (err) {
    console.error('Ошибка загрузки:', err);
  }
}

async function addTv() {
  const room = document.getElementById('room').value.trim();
  const lastOctet = document.getElementById('lastOctet').value.trim();
  const errorDiv = document.getElementById('error');
  errorDiv.textContent = '';

  if (!room || !lastOctet) {
    errorDiv.textContent = 'Заполните все поля';
    return;
  }

  const num = parseInt(lastOctet, 10);
  if (isNaN(num) || num < 1 || num > 254) {
    errorDiv.textContent = 'Последняя цифра от 1 до 254';
    return;
  }

  try {
    const res = await fetch('/api/tvs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room, lastOctet })
    });

    const data = await res.json();
    if (res.ok) {
      document.getElementById('room').value = '';
      document.getElementById('lastOctet').value = '';
      loadTvs(); // обновляем список
    } else {
      errorDiv.textContent = data.error || 'Ошибка сервера';
    }
  } catch (err) {
    errorDiv.textContent = 'Не удалось подключиться к серверу';
    console.error(err);
  }
}

// Загружаем при старте
loadTvs();