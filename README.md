Лабораторная работа 4: SQL-инъекции (Node.js + Express + SQLite)
Проект теперь полностью покрывает требования задания: уязвимый поиск (конкатенация SQL), атаки (OR 1=1, UNION), защищенный поиск (валидация + параметризованные запросы), логирование подозрительных запросов.
Установка
npm init -y
npm install express sqlite3
Запуск
npm start
Сервер: http://localhost:3000
Страницы
Главная: http://localhost:3000/
Уязвимая страница поиска: http://localhost:3000/search-vuln-page
Защищенная страница поиска: http://localhost:3000/search-safe-page
Часть 1: Уязвимое приложение
Нормальное поведение
http://localhost:3000/search-vuln?username=admin
SQL-инъекция (вывод всех пользователей)
http://localhost:3000/search-vuln?username=' OR 1=1 --
UNION-атака (доступ к скрытым данным)
http://localhost:3000/search-vuln?username=' UNION SELECT id, username, password, is_admin FROM users --
Часть 3: Защита
Защищенный эндпоинт:
http://localhost:3000/search?username=admin
Атаки теперь не проходят:
при символах инъекций срабатывает валидация и возвращается 400,
запрос выполняется через SELECT * FROM users WHERE username = ?.
Дополнительно: логирование
Логируется:
каждый запрос,
подозрительные шаблоны в username (OR 1=1, UNION, --, ;).

