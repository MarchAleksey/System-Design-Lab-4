# Проектирование документной модели MongoDB — Messenger (вариант 5)

Система: мессенджер по образцу Slack. Сущности: **User**, **Group Chat**, **P2P Message**.

База данных: `messenger`.

## Коллекции

| Коллекция | Назначение |
|-----------|------------|
| `users` | Пользователи |
| `group_chats` | Групповые чаты (метаданные + участники) |
| `group_messages` | Сообщения групповых чатов |
| `p2p_messages` | Личные сообщения |
| `counters` | Счётчики `seq_id` для внешних идентификаторов API (`user-1`, `chat-1`, …) |

## Структура документов

### `users`

```json
{
  "seq_id": 1,
  "login": "alice",
  "first_name": "Alice",
  "last_name": "Smith",
  "password_hash": "...",
  "created_at": ISODate("2025-01-10T10:00:00Z"),
  "tags": ["employee", "engineering"]
}
```

- `seq_id` (Number) — публичный числовой id для API (`user-{seq_id}`)
- `tags` (Array) — пример составного типа (массив строк)

### `group_chats`

```json
{
  "seq_id": 1,
  "name": "General",
  "created_by_id": 1,
  "created_at": ISODate("..."),
  "members": [
    { "user_id": 1, "joined_at": ISODate("..."), "role": "owner" },
    { "user_id": 2, "joined_at": ISODate("..."), "role": "member" }
  ]
}
```

- `members` (Array of Object) — **embedded** участники чата

### `group_messages`

```json
{
  "seq_id": 1,
  "chat_id": 1,
  "sender_id": 2,
  "content": "Hello",
  "created_at": ISODate("..."),
  "reactions": [{ "emoji": "thumbsup", "user_ids": [1, 3] }]
}
```

- `chat_id`, `sender_id` — **reference** на `users.seq_id` / `group_chats.seq_id`
- `reactions` (Array) — вложенные объекты для демонстрации типов

### `p2p_messages`

```json
{
  "seq_id": 1,
  "sender_id": 1,
  "recipient_id": 2,
  "content": "Hey",
  "created_at": ISODate("..."),
  "read_by": [2]
}
```

### `counters`

```json
{ "_id": "users", "seq": 12 }
```

## Embedded vs References

| Связь | Решение | Обоснование |
|-------|---------|-------------|
| User ↔ Group Chat (участник) | **Embedded** `members[]` в `group_chats` | Участников обычно немного; проверка членства и список участников читаются вместе с чатом без `$lookup`; атомарное добавление через `$push`. |
| Group Chat ↔ Group Message | **Reference** `chat_id` в `group_messages` | Сообщений неограниченно много; встраивание раздует документ чата и ухудшит обновления/индексацию. |
| User ↔ Group Message (автор) | **Reference** `sender_id` | Профиль пользователя меняется независимо; денормализация имени в каждое сообщение усложняет консистентность. |
| User ↔ P2P Message | **Reference** `sender_id`, `recipient_id` | Диалог — поток отдельных документов; удобна пагинация и индексы по паре участников. |
| User (сам по себе) | **Отдельная коллекция** | Глобальная уникальность `login`, независимый жизненный цикл, валидация `$jsonSchema`. |

## Индексы

- `users`: unique `{ login: 1 }`, unique `{ seq_id: 1 }`
- `group_chats`: unique `{ seq_id: 1 }`, `{ "members.user_id": 1 }`
- `group_messages`: `{ chat_id: 1, created_at: 1 }`, unique `{ seq_id: 1 }`
- `p2p_messages`: `{ sender_id: 1, recipient_id: 1, created_at: 1 }`, unique `{ seq_id: 1 }`

## Соответствие API (лаб. 02)

| Операция API | Коллекции |
|--------------|-----------|
| Создание пользователя | `users` insert |
| Поиск по login | `users` find `{ login }` |
| Поиск по маске имени/фамилии | `users` find + `$regex` |
| Создание группового чата | `group_chats` insert + embedded creator |
| Добавление в чат | `group_chats` `$push` members |
| Сообщение / список в чате | `group_messages` |
| P2P отправка / список | `p2p_messages` |
