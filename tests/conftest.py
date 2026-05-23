import pytest

pytest_plugins = [
    'pytest_userver.plugins.core',
    'pytest_userver.plugins.mongo',
]


@pytest.fixture(scope='session')
def mongodb_settings():
    return {
        'users': {
            'settings': {
                'collection': 'users',
                'connection': 'primary',
                'database': 'messenger',
            },
            'indexes': [
                {'key': [('login', 1)], 'unique': True},
                {'key': [('seq_id', 1)], 'unique': True},
            ],
        },
        'group_chats': {
            'settings': {
                'collection': 'group_chats',
                'connection': 'primary',
                'database': 'messenger',
            },
            'indexes': [
                {'key': [('seq_id', 1)], 'unique': True},
            ],
        },
        'group_messages': {
            'settings': {
                'collection': 'group_messages',
                'connection': 'primary',
                'database': 'messenger',
            },
            'indexes': [
                {'key': [('seq_id', 1)], 'unique': True},
                {'key': [('chat_id', 1), ('created_at', 1)]},
            ],
        },
        'p2p_messages': {
            'settings': {
                'collection': 'p2p_messages',
                'connection': 'primary',
                'database': 'messenger',
            },
            'indexes': [
                {'key': [('seq_id', 1)], 'unique': True},
            ],
        },
        'counters': {
            'settings': {
                'collection': 'counters',
                'connection': 'primary',
                'database': 'messenger',
            },
            'indexes': [],
        },
    }
