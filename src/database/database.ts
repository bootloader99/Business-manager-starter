import {open} from '@op-engineering/op-sqlite';

export const db = open({
  name: 'business_manager.sqlite',
});

// SQLite does not enforce foreign keys by default.
db.executeSync('PRAGMA foreign_keys = ON');