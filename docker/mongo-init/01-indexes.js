db = db.getSiblingDB('messenger');

db.users.createIndex({ login: 1 }, { unique: true });
db.users.createIndex({ seq_id: 1 }, { unique: true });

db.group_chats.createIndex({ seq_id: 1 }, { unique: true });
db.group_chats.createIndex({ 'members.user_id': 1 });

db.group_messages.createIndex({ seq_id: 1 }, { unique: true });
db.group_messages.createIndex({ chat_id: 1, created_at: 1 });

db.p2p_messages.createIndex({ seq_id: 1 }, { unique: true });
db.p2p_messages.createIndex({ sender_id: 1, recipient_id: 1, created_at: 1 });
db.p2p_messages.createIndex({ recipient_id: 1, sender_id: 1, created_at: 1 });

print('Indexes created');
