const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Подключение к in-memory БД
const db = new sqlite3.Database(':memory:');

// Инициализация тестовой БД
function initDb() {
  db.serialize(() => {
    db.run('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, is_admin INTEGER)');
    db.run("INSERT INTO users (username, password, is_admin) VALUES ('admin', 'secret123', 1)");
    db.run("INSERT INTO users (username, password, is_admin) VALUES ('user1', 'qwerty', 0)");
    db.run("INSERT INTO users (username, password, is_admin) VALUES ('guest', 'guestpass', 0)");
  });
}

initDb();

// Логирование всех запросов + простое обнаружение попыток SQL-инъекций
app.use((req, res, next) => {
  const fullUrl = `${req.method} ${req.originalUrl}`;
  const suspectPattern = /(\bOR\b\s+\d+=\d+|--|;|\bUNION\b)/i;

  console.log(`[REQ] ${new Date().toISOString()} ${fullUrl}`);
  if (req.query.username && suspectPattern.test(req.query.username)) {
    console.warn(`[WARN] Возможная SQL-инъекция: username="${req.query.username}"`);
  }

  next();
});

app.get('/', (_req, res) => {
  res.type('html').send(`
    <h1>ЛР4: SQL-инъекции</h1>
    <p>Уязвимая версия: <a href="/search-vuln-page">/search-vuln-page</a></p>
    <p>Защищенная версия: <a href="/search-safe-page">/search-safe-page</a></p>
  `);
});

app.get('/search-vuln-page', (req, res) => {
  const username = req.query.username || '';
  res.type('html').send(`
    <h2>Уязвимый поиск</h2>
    <form method="GET" action="/search-vuln">
      <input name="username" value="${username}" placeholder="username" />
      <button type="submit">Найти</button>
    </form>
    <p>Пример атаки: <code>' OR 1=1 --</code></p>
  `);
});

app.get('/search-safe-page', (req, res) => {
  const username = req.query.username || '';
  res.type('html').send(`
    <h2>Защищенный поиск</h2>
    <form method="GET" action="/search">
      <input name="username" value="${username}" placeholder="username" />
      <button type="submit">Найти</button>
    </form>
    <p>Допустимы только буквы и цифры.</p>
  `);
});

// ЧАСТЬ 1: Уязвимый поиск (конкатенация строк)
app.get('/search-vuln', (req, res) => {
  const username = req.query.username || '';
  const sql = `SELECT * FROM users WHERE username = '${username}'`;

  db.all(sql, (err, rows) => {
    if (err) return res.status(500).send('Ошибка БД');
    // Вывод без дополнительной обработки
    res.json({ mode: 'vulnerable', sql, rows });
  });
});

// ЧАСТЬ 3: Защищенный поиск (валидация + параметризованный запрос)
app.get('/search', (req, res) => {
  const username = req.query.username || '';

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).send('Недопустимые символы в имени');
  }

  db.all('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
    if (err) return res.status(500).send('Ошибка БД');
    res.json({ mode: 'safe', rows });
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Уязвимая страница: /search-vuln-page');
  console.log('Защищенная страница: /search-safe-page');
  console.log('API уязвимый: /search-vuln?username=...');
  console.log('API защищенный: /search?username=...');
});
