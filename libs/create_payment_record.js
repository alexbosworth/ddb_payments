const isValidIso8601Date = require('vali-date');

const ddb = require('./ddb');
const putItem = require('./put_item');

const msPerSec = 1e3;

/** Record a payment to the database

  {
    aws_access_key_id: <Access Key Id String>
    aws_payments_table: <Payments Table Name String>
    aws_secret_access_key: <Secret Access Key String>
    created_at: <ISO 8601 Date String>
    details: <Payment Details Object>
    expires_at: <Expiration ISO 8601 Date String> 
    id: <Lightning Invoice Id String>
    key: <Public Key Hex String>
    type: <Type String>
  }
*/
module.exports = (args, cbk) => {
  if (!args.aws_payments_table) {
    return cbk([500, 'Expected aws payments table name', args]);
  }

  if (!isValidIso8601Date(args.created_at)) {
    return cbk([500, 'Expected valid created_at', args.created_at]);
  }

  if (!args.details) {
    return cbk([500, 'Expected details']);
  }

  if (!isValidIso8601Date(args.expires_at)) {
    return cbk([500, 'Expected valid expires_at', args.expires_at]);
  }

  if (!args.id || !args.key || !args.type) {
    return cbk([500, 'Expected id, key, type']);
  }

  const fresh = ['id', 'key'];
  const key = args.aws_access_key_id;
  let db;
  const pass = args.aws_secret_access_key;
  const table = args.aws_payments_table;

  try { db = ddb({access_key_id: key, secret_access_key: pass}); } catch (e) {
    return cbk([500, 'Failed creating ddb', e]);
  }

  const item = {
    created_at: args.created_at,
    details: args.details,
    id: args.id,
    key: args.key,
    rev: 1,
    status: 'unprocessed',
    ttl: Math.round(Date.parse(args.expires_at) / msPerSec),
    type: args.type,
  };

  return putItem({db, fresh, item, table}, err => {
    if (!!err) {
      return cbk(err);
    }

    return cbk();
  });
};

