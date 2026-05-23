db = db.getSiblingDB('messenger');

const userValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['seq_id', 'login', 'first_name', 'last_name', 'password_hash', 'created_at'],
    additionalProperties: true,
    properties: {
      seq_id: {
        bsonType: ['int', 'long'],
        minimum: 1,
        description: 'must be a positive integer',
      },
      login: {
        bsonType: 'string',
        pattern: '^[a-z][a-z0-9_]{2,63}$',
        description: 'login: lowercase alphanumeric, 3-64 chars',
      },
      first_name: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 128,
      },
      last_name: {
        bsonType: 'string',
        minLength: 1,
        maxLength: 128,
      },
      password_hash: {
        bsonType: 'string',
        minLength: 8,
      },
      created_at: {
        bsonType: 'date',
      },
      tags: {
        bsonType: 'array',
        items: { bsonType: 'string' },
      },
    },
  },
};

db.runCommand({
  collMod: 'users',
  validator: userValidator,
  validationLevel: 'strict',
  validationAction: 'error',
});

print('Validator applied to users');


function expectInsertFail(label, doc) {
  try {
    db.users.insertOne(doc);
    print('FAIL:', label, '- insert should have been rejected');
  } catch (e) {
    print('OK:', label, '-', e.codeName || e.message);
  }
}

expectInsertFail('missing login', {
  seq_id: 9999,
  first_name: 'X',
  last_name: 'Y',
  password_hash: 'hashhashhash',
  created_at: new Date(),
});

expectInsertFail('invalid login pattern', {
  seq_id: 9998,
  login: 'BAD LOGIN',
  first_name: 'X',
  last_name: 'Y',
  password_hash: 'hashhashhash',
  created_at: new Date(),
});

expectInsertFail('short password_hash', {
  seq_id: 9997,
  login: 'validuser',
  first_name: 'X',
  last_name: 'Y',
  password_hash: 'short',
  created_at: new Date(),
});

const valid = {
  seq_id: 9996,
  login: 'valid_test',
  first_name: 'Valid',
  last_name: 'User',
  password_hash: 'valid_hash_01',
  created_at: new Date(),
  tags: ['test'],
};
const ok = db.users.insertOne(valid);
print('OK: valid insert', ok.insertedId);
db.users.deleteOne({ seq_id: 9996 });

print('Validation tests finished');
