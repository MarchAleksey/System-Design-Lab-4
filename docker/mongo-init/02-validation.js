db = db.getSiblingDB('messenger');

db.runCommand({
  collMod: 'users',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['seq_id', 'login', 'first_name', 'last_name', 'password_hash', 'created_at'],
      properties: {
        seq_id: { bsonType: ['int', 'long'], minimum: 1 },
        login: { bsonType: 'string', pattern: '^[a-z][a-z0-9_]{2,63}$' },
        first_name: { bsonType: 'string', minLength: 1, maxLength: 128 },
        last_name: { bsonType: 'string', minLength: 1, maxLength: 128 },
        password_hash: { bsonType: 'string', minLength: 8 },
        created_at: { bsonType: 'date' },
        tags: { bsonType: 'array', items: { bsonType: 'string' } },
      },
    },
  },
  validationLevel: 'strict',
  validationAction: 'error',
});

print('users validator applied');
