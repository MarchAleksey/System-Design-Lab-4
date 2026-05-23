# System-Design-Lab-4: Messenger + MongoDB

Домашнее задание 04 — проектирование документной модели и подключение **MongoDB** к REST API мессенджера (вариант 5, [Slack](https://slack.com/)) на **Yandex [userver](https://github.com/userver-framework/userver)** и **C++17**.

## Сущности

| Сущность | Коллекция | Описание |
|----------|-----------|----------|
| **User** | `users` | login, имя, фамилия, хэш пароля |
| **Group Chat** | `group_chats` | чат, embedded-участники `members[]` |
| **Group Message** | `group_messages` | сообщения (reference на чат) |
| **P2P Message** | `p2p_messages` | личная переписка |

Хранилище API: **MongoDB 7** (компонент userver `mongo-database`).

## Файлы задания

| Файл | Назначение |
|------|------------|
| [`schema_design.md`](schema_design.md) | модель данных, embedded vs references |
| [`data.js`](data.js) | тестовые данные (≥10 документов в каждой коллекции) |
| [`queries.js`](queries.js) | CRUD и aggregation pipeline |
| [`validation.js`](validation.js) | `$jsonSchema` для `users`, тесты невалидных вставок |
| [`docker-compose.yaml`](docker-compose.yaml) | MongoDB + API |
| [`Dockerfile`](Dockerfile) | сборка сервиса userver |

## API (`/api/v1`)

| Метод | URL | Auth | MongoDB |
|-------|-----|------|---------|
| GET | `/health` | — | — |
| POST | `/auth/register` | — | `users.insert` |
| POST | `/auth/login` | — | `users.find` + сессия в памяти |
| POST | `/users` | — | `users.insert` |
| GET | `/users/by-login/{login}` | — | `users.findOne` |
| GET | `/users/search` | — | `$regex` по маскам |
| POST | `/group-chats` | Bearer | `group_chats.insert` + embedded creator |
| POST | `/group-chats/{id}/members` | Bearer | `$push` в `members` |
| POST | `/group-chats/{id}/messages` | Bearer | `group_messages.insert` |
| GET | `/group-chats/{id}/messages` | Bearer | `find` + sort/limit |
| POST | `/p2p/messages` | Bearer | `p2p_messages.insert` |
| GET | `/p2p/messages` | Bearer | `$or` по участникам |

Спецификация: [`openapi.yaml`](openapi.yaml). Идентификаторы: `user-1`, `chat-1`, `gmsg-1`, `pmsg-1` (поле `seq_id` в документах).

## Запуск через Docker Compose

```bash
docker compose up --build
```

- MongoDB: `localhost:27017`, база `messenger`
- API: http://localhost:8080

При первом старте MongoDB выполняет скрипты из `docker/mongo-init/` и [`data.js`](data.js).

```bash
curl http://127.0.0.1:8080/health
curl -X POST http://127.0.0.1:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"login":"demo","first_name":"Demo","last_name":"User","password":"secret123"}'
```

## Только MongoDB

```bash
docker compose up -d mongodb
mongosh messenger data.js
mongosh messenger validation.js
mongosh messenger queries.js
```

## Локальная сборка и тесты (Linux / Docker userver)

```bash
make docker-test-debug
make docker-start-debug
```

Конфиг: `mongo-uri` в [`configs/config_vars.yaml`](configs/config_vars.yaml).

## Структура проекта

```
schema_design.md  data.js  queries.js  validation.js
docker/mongo-init/
src/
  storage/          # MongoDB через userver::components::Mongo
  auth/             # Bearer-сессии (in-memory)
  handlers/         # REST handlers
configs/
tests/
docker-compose.yaml
Dockerfile
```

## Тесты

```bash
make docker-test-debug
```

Используется `pytest_userver.plugins.mongo` — временная БД и индексы из `tests/conftest.py`.

## Документация по модели

Подробное обоснование embedded/references: [`schema_design.md`](schema_design.md).
