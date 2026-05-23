db = db.getSiblingDB('messenger');

print('=== CREATE ===');

db.users.insertOne({
  seq_id: 100,
  login: 'newuser',
  first_name: 'New',
  last_name: 'User',
  password_hash: 'hashed_password',
  created_at: new Date(),
  tags: ['onboarding'],
});

db.group_chats.insertOne({
  seq_id: 100,
  name: 'Lab Chat',
  created_by_id: 1,
  created_at: new Date(),
  members: [{ user_id: 1, joined_at: new Date(), role: 'owner' }],
});

db.group_messages.insertOne({
  seq_id: 100,
  chat_id: 1,
  sender_id: 1,
  content: 'Test message',
  created_at: new Date(),
  reactions: [],
});

db.p2p_messages.insertOne({
  seq_id: 100,
  sender_id: 1,
  recipient_id: 2,
  content: 'Private hello',
  created_at: new Date(),
  read_by: [],
});

print('=== READ ===');
print('User by login:', db.users.findOne({ login: { $eq: 'alice' } }, { password_hash: 0 }));

print(
  'Users first_name contains Carol:',
  db.users
    .find({
      $and: [
        { first_name: { $regex: 'Carol', $options: 'i' } },
        { last_name: { $ne: '' } },
      ],
    })
    .toArray(),
);

print('Users with engineering tag:', db.users.find({ tags: { $in: ['engineering'] } }).toArray());
print('Chat 1:', db.group_chats.findOne({ seq_id: 1 }));

print(
  'Is user 2 in chat 1:',
  db.group_chats.findOne({
    seq_id: 1,
    members: { $elemMatch: { user_id: 2 } },
  }) != null,
);

print(
  'Messages chat 1:',
  db.group_messages
    .find({ chat_id: { $eq: 1 } })
    .sort({ created_at: 1, seq_id: 1 })
    .limit(5)
    .toArray(),
);

const userId = 1;
const peerId = 2;
print(
  'P2P between 1 and 2:',
  db.p2p_messages
    .find({
      $or: [
        { $and: [{ sender_id: userId }, { recipient_id: peerId }] },
        { $and: [{ sender_id: peerId }, { recipient_id: userId }] },
      ],
    })
    .sort({ created_at: 1 })
    .toArray(),
);

print(
  'Group messages after Feb 2025:',
  db.group_messages.find({ created_at: { $gt: ISODate('2025-02-03T00:00:00Z') } }).count(),
);

print('=== UPDATE ===');

db.users.updateOne({ login: 'newuser' }, { $set: { last_name: 'Updated' } });

db.group_chats.updateOne(
  { seq_id: 1 },
  {
    $push: {
      members: { user_id: 100, joined_at: new Date(), role: 'member' },
    },
  },
);

db.users.updateOne({ login: 'alice' }, { $addToSet: { tags: 'vip' } });

db.group_messages.updateOne(
  { seq_id: 1 },
  { $push: { reactions: { emoji: 'fire', user_ids: [1] } } },
);

db.p2p_messages.updateOne({ seq_id: 1 }, { $addToSet: { read_by: 1 } });
db.counters.updateOne({ _id: 'users' }, { $inc: { seq: 1 } });

print('=== DELETE ===');

db.users.deleteOne({ login: 'newuser' });
db.group_chats.deleteOne({ seq_id: 100 });
db.group_messages.deleteOne({ seq_id: 100 });
db.p2p_messages.deleteOne({ seq_id: 100 });

db.group_chats.updateOne({ seq_id: 1 }, { $pull: { members: { user_id: 100 } } });

const oldP2p = db.p2p_messages.countDocuments({
  created_at: { $lt: ISODate('2020-01-01T00:00:00Z') },
});
print('Old P2P to delete (demo):', oldP2p);

print('=== AGGREGATION (optional) ===');

const topSenders = db.group_messages
  .aggregate([
    { $match: { chat_id: { $in: [1, 2, 3] } } },
    {
      $group: {
        _id: { chat_id: '$chat_id', sender_id: '$sender_id' },
        msg_count: { $sum: 1 },
      },
    },
    { $sort: { msg_count: -1 } },
    { $limit: 5 },
    {
      $project: {
        _id: 0,
        chat_id: '$_id.chat_id',
        sender_id: '$_id.sender_id',
        msg_count: 1,
      },
    },
  ])
  .toArray();
print('Top senders:', topSenders);

print('queries.js done');
