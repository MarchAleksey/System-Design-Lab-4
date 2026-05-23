const dbName = 'messenger';
db = db.getSiblingDB(dbName);

function resetCollection(name) {
  db[name].deleteMany({});
}

['users', 'group_chats', 'group_messages', 'p2p_messages', 'counters'].forEach(resetCollection);

const users = [
  { seq_id: 1, login: 'alice', first_name: 'Alice', last_name: 'Smith', password_hash: 'seed_hash_01', created_at: ISODate('2025-01-10T10:00:00Z'), tags: ['employee', 'engineering'] },
  { seq_id: 2, login: 'bob', first_name: 'Bob', last_name: 'Johnson', password_hash: 'seed_hash_02', created_at: ISODate('2025-01-11T11:00:00Z'), tags: ['employee'] },
  { seq_id: 3, login: 'carol', first_name: 'Caroline', last_name: 'Brown', password_hash: 'seed_hash_03', created_at: ISODate('2025-01-12T12:00:00Z'), tags: ['contractor'] },
  { seq_id: 4, login: 'dave', first_name: 'David', last_name: 'Miller', password_hash: 'seed_hash_04', created_at: ISODate('2025-01-13T13:00:00Z'), tags: ['employee', 'design'] },
  { seq_id: 5, login: 'eve', first_name: 'Eve', last_name: 'Davis', password_hash: 'seed_hash_05', created_at: ISODate('2025-01-14T14:00:00Z'), tags: [] },
  { seq_id: 6, login: 'frank', first_name: 'Frank', last_name: 'Wilson', password_hash: 'seed_hash_06', created_at: ISODate('2025-01-15T15:00:00Z'), tags: ['support'] },
  { seq_id: 7, login: 'grace', first_name: 'Grace', last_name: 'Taylor', password_hash: 'seed_hash_07', created_at: ISODate('2025-01-16T16:00:00Z'), tags: ['employee', 'marketing'] },
  { seq_id: 8, login: 'henry', first_name: 'Henry', last_name: 'Anderson', password_hash: 'seed_hash_08', created_at: ISODate('2025-01-17T17:00:00Z'), tags: ['hr'] },
  { seq_id: 9, login: 'iris', first_name: 'Iris', last_name: 'Thomas', password_hash: 'seed_hash_09', created_at: ISODate('2025-01-18T18:00:00Z'), tags: ['finance'] },
  { seq_id: 10, login: 'jack', first_name: 'Jack', last_name: 'Jackson', password_hash: 'seed_hash_10', created_at: ISODate('2025-01-19T19:00:00Z'), tags: ['legal'] },
  { seq_id: 11, login: 'kate', first_name: 'Katherine', last_name: 'White', password_hash: 'seed_hash_11', created_at: ISODate('2025-01-20T20:00:00Z'), tags: ['research'] },
  { seq_id: 12, login: 'liam', first_name: 'Liam', last_name: 'Harris', password_hash: 'seed_hash_12', created_at: ISODate('2025-01-21T21:00:00Z'), tags: ['employee', 'ops'] },
];

db.users.insertMany(users);

const groupChats = [
  { seq_id: 1, name: 'General', created_by_id: 1, created_at: ISODate('2025-02-01T09:00:00Z'), members: [
    { user_id: 1, joined_at: ISODate('2025-02-01T09:05:00Z'), role: 'owner' },
    { user_id: 2, joined_at: ISODate('2025-02-01T09:10:00Z'), role: 'member' },
    { user_id: 3, joined_at: ISODate('2025-02-01T09:15:00Z'), role: 'member' },
  ]},
  { seq_id: 2, name: 'Random', created_by_id: 2, created_at: ISODate('2025-02-02T09:00:00Z'), members: [
    { user_id: 2, joined_at: ISODate('2025-02-02T09:05:00Z'), role: 'owner' },
    { user_id: 4, joined_at: ISODate('2025-02-02T09:10:00Z'), role: 'member' },
  ]},
  { seq_id: 3, name: 'Dev Team', created_by_id: 3, created_at: ISODate('2025-02-03T09:00:00Z'), members: [
    { user_id: 3, joined_at: ISODate('2025-02-03T09:05:00Z'), role: 'owner' },
    { user_id: 5, joined_at: ISODate('2025-02-03T09:10:00Z'), role: 'member' },
  ]},
  { seq_id: 4, name: 'Design', created_by_id: 4, created_at: ISODate('2025-02-04T09:00:00Z'), members: [{ user_id: 4, joined_at: ISODate('2025-02-04T09:05:00Z'), role: 'owner' }, { user_id: 6, joined_at: ISODate('2025-02-04T09:10:00Z'), role: 'member' }] },
  { seq_id: 5, name: 'Ops', created_by_id: 5, created_at: ISODate('2025-02-05T09:00:00Z'), members: [{ user_id: 5, joined_at: ISODate('2025-02-05T09:05:00Z'), role: 'owner' }, { user_id: 7, joined_at: ISODate('2025-02-05T09:10:00Z'), role: 'member' }] },
  { seq_id: 6, name: 'Support', created_by_id: 6, created_at: ISODate('2025-02-06T09:00:00Z'), members: [{ user_id: 6, joined_at: ISODate('2025-02-06T09:05:00Z'), role: 'owner' }] },
  { seq_id: 7, name: 'Marketing', created_by_id: 7, created_at: ISODate('2025-02-07T09:00:00Z'), members: [{ user_id: 7, joined_at: ISODate('2025-02-07T09:05:00Z'), role: 'owner' }] },
  { seq_id: 8, name: 'HR', created_by_id: 8, created_at: ISODate('2025-02-08T09:00:00Z'), members: [{ user_id: 8, joined_at: ISODate('2025-02-08T09:05:00Z'), role: 'owner' }] },
  { seq_id: 9, name: 'Finance', created_by_id: 9, created_at: ISODate('2025-02-09T09:00:00Z'), members: [{ user_id: 9, joined_at: ISODate('2025-02-09T09:05:00Z'), role: 'owner' }] },
  { seq_id: 10, name: 'Legal', created_by_id: 10, created_at: ISODate('2025-02-10T09:00:00Z'), members: [{ user_id: 10, joined_at: ISODate('2025-02-10T09:05:00Z'), role: 'owner' }] },
  { seq_id: 11, name: 'Research', created_by_id: 11, created_at: ISODate('2025-02-11T09:00:00Z'), members: [{ user_id: 11, joined_at: ISODate('2025-02-11T09:05:00Z'), role: 'owner' }] },
  { seq_id: 12, name: 'Announcements', created_by_id: 12, created_at: ISODate('2025-02-12T09:00:00Z'), members: [{ user_id: 12, joined_at: ISODate('2025-02-12T09:05:00Z'), role: 'owner' }] },
];

db.group_chats.insertMany(groupChats);

const groupMessages = [
  { seq_id: 1, chat_id: 1, sender_id: 1, content: 'Welcome to General', created_at: ISODate('2025-02-01T10:00:00Z'), reactions: [{ emoji: 'wave', user_ids: [2, 3] }] },
  { seq_id: 2, chat_id: 1, sender_id: 2, content: 'Thanks Alice', created_at: ISODate('2025-02-01T10:05:00Z'), reactions: [] },
  { seq_id: 3, chat_id: 1, sender_id: 3, content: 'Hi everyone', created_at: ISODate('2025-02-01T10:10:00Z'), reactions: [] },
  { seq_id: 4, chat_id: 2, sender_id: 2, content: 'Random chat kickoff', created_at: ISODate('2025-02-02T10:00:00Z'), reactions: [] },
  { seq_id: 5, chat_id: 2, sender_id: 4, content: 'Sounds good', created_at: ISODate('2025-02-02T10:05:00Z'), reactions: [] },
  { seq_id: 6, chat_id: 3, sender_id: 3, content: 'Sprint planning', created_at: ISODate('2025-02-03T10:00:00Z'), reactions: [] },
  { seq_id: 7, chat_id: 3, sender_id: 5, content: 'I will prepare the board', created_at: ISODate('2025-02-03T10:05:00Z'), reactions: [] },
  { seq_id: 8, chat_id: 4, sender_id: 4, content: 'New mockups uploaded', created_at: ISODate('2025-02-04T10:00:00Z'), reactions: [] },
  { seq_id: 9, chat_id: 5, sender_id: 5, content: 'Deploy at 18:00 UTC', created_at: ISODate('2025-02-05T10:00:00Z'), reactions: [] },
  { seq_id: 10, chat_id: 6, sender_id: 6, content: 'Ticket #42 resolved', created_at: ISODate('2025-02-06T10:00:00Z'), reactions: [] },
  { seq_id: 11, chat_id: 7, sender_id: 7, content: 'Campaign draft ready', created_at: ISODate('2025-02-07T10:00:00Z'), reactions: [] },
  { seq_id: 12, chat_id: 8, sender_id: 8, content: 'Onboarding doc updated', created_at: ISODate('2025-02-08T10:00:00Z'), reactions: [] },
];

db.group_messages.insertMany(groupMessages);

const p2pMessages = [
  { seq_id: 1, sender_id: 1, recipient_id: 2, content: 'Hey Bob', created_at: ISODate('2025-03-01T08:00:00Z'), read_by: [2] },
  { seq_id: 2, sender_id: 2, recipient_id: 1, content: 'Hi Alice', created_at: ISODate('2025-03-01T08:05:00Z'), read_by: [1] },
  { seq_id: 3, sender_id: 1, recipient_id: 3, content: 'Carol, are you free?', created_at: ISODate('2025-03-02T08:00:00Z'), read_by: [] },
  { seq_id: 4, sender_id: 3, recipient_id: 1, content: 'Yes, in 10 minutes', created_at: ISODate('2025-03-02T08:10:00Z'), read_by: [1] },
  { seq_id: 5, sender_id: 4, recipient_id: 5, content: 'Review the spec please', created_at: ISODate('2025-03-03T08:00:00Z'), read_by: [] },
  { seq_id: 6, sender_id: 5, recipient_id: 4, content: 'Done, left comments', created_at: ISODate('2025-03-03T08:30:00Z'), read_by: [4] },
  { seq_id: 7, sender_id: 6, recipient_id: 7, content: 'Lunch today?', created_at: ISODate('2025-03-04T12:00:00Z'), read_by: [] },
  { seq_id: 8, sender_id: 7, recipient_id: 6, content: 'Sure, 13:00', created_at: ISODate('2025-03-04T12:05:00Z'), read_by: [6] },
  { seq_id: 9, sender_id: 8, recipient_id: 9, content: 'Budget numbers attached', created_at: ISODate('2025-03-05T09:00:00Z'), read_by: [] },
  { seq_id: 10, sender_id: 9, recipient_id: 8, content: 'Received, thanks', created_at: ISODate('2025-03-05T09:15:00Z'), read_by: [8] },
  { seq_id: 11, sender_id: 10, recipient_id: 11, content: 'Contract draft v2', created_at: ISODate('2025-03-06T10:00:00Z'), read_by: [] },
  { seq_id: 12, sender_id: 11, recipient_id: 12, content: 'Paper summary ready', created_at: ISODate('2025-03-07T11:00:00Z'), read_by: [] },
];

db.p2p_messages.insertMany(p2pMessages);

db.counters.insertMany([
  { _id: 'users', seq: 12 },
  { _id: 'group_chats', seq: 12 },
  { _id: 'group_messages', seq: 12 },
  { _id: 'p2p_messages', seq: 12 },
]);

print('Seed complete:', {
  users: db.users.countDocuments(),
  group_chats: db.group_chats.countDocuments(),
  group_messages: db.group_messages.countDocuments(),
  p2p_messages: db.p2p_messages.countDocuments(),
});
