const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Создание таблицы при старте
pool.query(`
  CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    room TEXT NOT NULL,
    ip TEXT NOT NULL
  );
`).catch(err => console.error('Ошибка создания таблицы:', err));

// === API ===

// Получить все устройства
app.get('/api/devices', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM devices ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка базы данных' });
  }
});

// Добавить устройство
app.post('/api/devices', async (req, res) => {
  const { room, lastOctet } = req.body;

  if (!room || !lastOctet) {
    return res.status(400).json({ error: 'Укажите кабинет и последнюю цифру IP' });
  }

  const num = parseInt(lastOctet, 10);
  if (isNaN(num) || num < 1 || num > 254) {
    return res.status(400).json({ error: 'Последняя цифра должна быть от 1 до 254' });
  }

  const ip = `172.25.1.${num}`;

  try {
    const result = await pool.query(
      'INSERT INTO devices (room, ip) VALUES ($1, $2) RETURNING *',
      [room, ip]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось сохранить' });
  }
});

// Удалить устройство
app.delete('/api/devices/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Некорректный ID' });
  }

  try {
    await pool.query('DELETE FROM devices WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Не удалось удалить' });
  }
});

// Обслуживание основной страницы
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});