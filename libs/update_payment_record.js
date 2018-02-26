const ddb = require('./ddb');

const updateItem = require('./update_item');

/** Update an existing payment

  {
    aws_access_key_id: <Access Key Id String>
    aws_payments_table: <Payments Table Name String>
    aws_secret_access_key: <Secret Access Key String>
    id: <Lightning Invoice Id String>
    key: <Public Key Hex String>
    rev: <Rev Number>
    status: <Status String>
  }

  @returns via cbk
  {
    created_at: <ISO 8601 Date String>
    details: <Payment Details Object>
    id: <Payment Id String>
    key: <Payment Key String>
    rev: <Rev Number>
    status: <Status String>
    type: <Purchase Type String>
  }
*/
module.exports = (args, cbk) => {
  let db;
  const changes = {rev: {add: 1}, status: {set: args.status}};
  const expect = {rev: args.rev};
  const key = args.aws_access_key_id;
  const pass = args.aws_secret_access_key;
  const table = args.aws_payments_table;
  const where = {id: args.id, key: args.key};

  try { db = ddb({access_key_id: key, secret_access_key: pass}); } catch (e) {
    return cbk([500, 'Failed creating ddb', e]);
  }

  return updateItem({changes, db, expect, table, where}, (err, res) => {
    if (!!err) {
      return cbk(err);
    }

    return cbk(null, {
      created_at: res.item.created_at,
      details: res.item.details,
      id: res.item.id,
      key: res.item.key,
      rev: res.item.rev,
      status: res.item.status,
      type: res.item.type,
    });
  });
};

