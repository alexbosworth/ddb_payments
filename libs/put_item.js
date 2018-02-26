const ddbRowFormattedValue = require('./ddb_row_formatted_value');
const objAsDdbRow = require('./obj_as_ddb_row');

/** Commit a write to DynamoDb

  {
    db: <Dynamodb Object>
    [fresh]: [<Expect Fresh Attribute String>]
    item: <Item to Write Object>
    table: <Table String>
  }
*/
module.exports = (args, cbk) => {
  if (!args.db || !args.item || !args.table) {
    return cbk([500, 'Expected db, item, table']);
  }

  const fresh = args.fresh || [];
  const names = {};

  fresh.forEach(attr => names[`#${attr}`] = attr);

  const expect = fresh.map(attr => `attribute_not_exists(#${attr})`);

  return args.db.putItem({
    ConditionExpression: !expect.length ? undefined : expect.join(' and '),
    ExpressionAttributeNames: !expect.length ? undefined : names,
    Item: objAsDdbRow(args.item),
    TableName: args.table,
  },
  (err, res) => {
    if (!!err && !err.code) {
      return cbk([503, 'Expected err code']);
    }

    if (!!err) {
      switch (err.code) {
      case 'ConditionalCheckFailedException':
        return cbk([409]);

      case 'ProvisionedThroughputExceededException':
        return cbk([503, 'Exceeded provisioning', args.table]);

      default:
        return cbk([503, 'Unexpected err', err.code]);
      }
    }

    return cbk();
  });
};

