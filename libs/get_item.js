const objAsDdbRow = require('./obj_as_ddb_row');
const objFromDdbRow = require('./obj_from_ddb_row');

/** Get an item from DynamoDb

  {
    [attributes]: [<Attribute Name String>]
    db: <DynamoDB Object>
    [is_consistent]: <Is Consistent Bool>
    table: <Table Name String>
    where: <Item Key Object>
  }

  @returns via cbk
  {
    [item]: <Item Object>
  }
*/
module.exports = (args, cbk) => {
  if (!!args.attributes && !Array.isArray(args.attributes)) {
    return cbk([500, 'Expected attributes array']);
  }

  if (!args.db || !args.table || !args.where) {
    return cbk([500, 'Expected db, table, where']);
  }

  let key;

  try { key = objAsDdbRow(args.where); } catch (e) {
    return cbk([500, 'Expected valid where value', e]);
  }

  const params = {
    ConsistentRead: !!args.is_consistent,
    Key: key,
    ProjectionExpression: !args.attributes ? null : args.attributes.join(','),
    TableName: args.table,
  };

  return args.db.getItem(params, (err, res) => {
    if (!!err && err.code === 'ProvisionedThroughputExceededException') {
      return cbk([503, 'Insufficient table read provisioning', args.table]);
    }

    if (!!err) {
      return cbk([503, 'Db get error', err]);
    }

    if (!Object.keys(res).length) {
      return cbk([404, 'Object not found']);
    }

    let item;

    try { item = objFromDdbRow(res.Item); } catch (e) {
      return cbk([503, 'Expected valid db row', e]);
    }

    return cbk(null, {item});
  });
};

