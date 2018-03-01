const ddb = require('./ddb');
const getItem = require('./get_item');

/** Get a payment record

  {
    aws_access_key_id: <AWS Access Key Id String>
    aws_payments_table: <AWS Payments Table String>
    aws_secret_access_key: <AWS Secret Access key String>
    id: <Invoice Id String>
    [is_consistent]: <Is Consistent Result Required Bool> = false
    key: <Key String>
  }

  @returns via cbk
  {
    created_at: <ISO 8601 Date String>
    details: <Payment Details Object>
    id: <Lightning Invoice Id String>
    key: <Public Key Hex String>
    rev: <Rev Number>
    status: <Status String>
    type: <Type String>
  }
*/
module.exports = (args, cbk) => {
  if (!args.aws_payments_table) {
    return cbk([500, 'Expected aws payments table name']);
  }

  if (!args.id || !args.key) {
    return cbk([500, 'Expected id, key, type']);
  }

  let db;

  const aId = args.aws_access_key_id;
  const pass = args.aws_secret_access_key;

  try { db = ddb({access_key_id: aId, secret_access_key: pass}); } catch (e) {
    return cbk([500, 'Failed creating ddb', e]);
  }

  return getItem({
    db,
    table: args.aws_payments_table,
    where: {id: args.id, key: args.key},
  },
  (err, res) => {
    if (!!err) {
      return cbk(err);
    }

    const {item} = res;

    return cbk(null, {
      created_at: item.created_at,
      details: item.details,
      id: item.id,
      key: item.key,
      rev: item.rev,
      status: item.status,
      type: item.type,
    });
  });
};

