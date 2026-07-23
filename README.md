# Fragpunk Crosshairs

Галерея кодов прицелов для FragPunk с закрытой админ-панелью.

Интерфейс доступен на русском, английском, немецком, французском и китайском языках. Выбранный язык сохраняется в браузере.

Первый экран использует лениво загружаемую Three.js-сцену, а появление секций и карточек анимируется через GSAP ScrollTrigger.

## Запуск

```bash
npm install
copy .env.example .env
npm run dev
```

Откройте `http://localhost:5173`. Админ-панель доступна только по адресу `http://localhost:5173/admin`. API работает на `http://localhost:4173`.

Для production:

```bash
npm run build
npm start
```

Перед публикацией обязательно задайте длинные `ADMIN_PASSWORD` и `SESSION_SECRET`.
Если переменные не заданы, локальный тестовый пароль: `fragpunk-admin`.

Данные сохраняются в `data/crosshairs.json`, загруженные изображения — в `uploads/`.
