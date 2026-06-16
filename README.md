Интернет Контент Коллектор

Клиент-серверное приложение для поиска и скачивания контента из интернета с сохранением в LocalStorage.
Быстрый запуск
Локальный запуск

1. Запустите сервер:
bash;
    cd server;
    npm install;
    npm start;

Сервер запустится на http://localhost:3000

2. Запустите клиент (в новом терминале):
bash;
    cd client;
    npm install;
    npm start;

Клиент запустится на http://localhost:8080

3. Откройте в браузере: http://localhost:8080
Запуск через Docker
bash

docker-compose up -d

    Сервер: http://localhost:3000

    Клиент: http://localhost:8080

🔑 Ключевые слова для поиска
javascript;
nodejs;
react;
docker;
python;
📖 Как использовать

    Введите ключевое слово (например, javascript) и нажмите "Найти"

    Выберите URL из списка и нажмите "Скачать"

    Следите за прогрессом загрузки

    Нажмите "Сохранить в LocalStorage" для офлайн-доступа

    Просматривайте сохраненный контент внизу страницы

🛠️ Добавление своих URL

Отредактируйте файл server/data/keywords.json:
json

{
  "ваше_слово": [
    "https://example.com/page1",
    "https://example.com/page2"
  ]
}

После изменения перезапустите сервер.
