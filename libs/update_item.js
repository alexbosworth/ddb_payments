const ddbRowFormattedValue = require('./ddb_row_formatted_value');
const objAsDdbRow = require('./obj_as_ddb_row');
const objFromDdbRow = require('./obj_from_ddb_row');

/** Update a Dynamodb record

  {
    changes: <Changes Object>
    db: <DynamoDb Object>
    [expect]: <Expect Object>
    table: <Table Name String>
    where: <Item Key Object>
  }

  @returns via cbk
  {
    item: <Item Object>
  }
*/
module.exports = (args, cbk) => {
  let key;

  try { key = objAsDdbRow(args.where); } catch (e) {
    return cbk([500, 'Expected valid where value', e]);
  }

  const expect = [];
  const names = {};
  const operations = [];
  const vals = {};

  Object.keys(args.changes).forEach(attr => {
    names[`#${attr}`] = attr;

    if (!!args.changes[attr].add) {
      vals[`:${attr}`] = ddbRowFormattedValue(args.changes[attr].add);
      operations.push(`#${attr} = #${attr} + :${attr}`);
    } else if (!!args.changes[attr].set) {
      vals[`:${attr}`] = ddbRowFormattedValue(args.changes[attr].set);
      operations.push(`#${attr} = :${attr}`);
    }

    return;
  });

  Object.keys(args.expect || {}).forEach(attr => {
    names[`#${attr}`] = attr;
    vals[`:equals_${attr}`] = ddbRowFormattedValue(args.expect[attr]);

    expect.push(`#${attr} = :equals_${attr}`);

    return;
  });

  return args.db.updateItem({
    ConditionExpression: expect.join(' and '),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: vals,
    Key: key,
    ReturnValues: 'ALL_NEW',
    TableName: args.table,
    UpdateExpression: `SET ${operations.join(',')}`,
  },
  (err, res) => {
    if (!!err && !err.code) {
      return cbk([503, 'Unidentified dynamodb error', err]);
    }

    if (!!err && err.code === 'ProvisionedThroughputExceededException') {
      return cbk([503, 'Db busy', args.table]);
    }

    if (!!err && err.code === 'ConditionalCheckFailedException') {
      return cbk([409]);
    }

    if (!!err) {
      return cbk([500, 'Db update err', err]);
    }

    if (!res || !res.Attributes) {
      return cbk([500, 'Expected attr'])
    }

    let item;

    try { item = objFromDdbRow(res.Attributes); } catch (e) {
      return cbk([500, 'Failed to demarshall ddb object', e]);
    }

    return cbk(null, {item});
  });
};

