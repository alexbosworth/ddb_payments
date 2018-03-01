const {DynamoDB} = require('aws-sdk');

const awsConfig = require('./../conf/aws_config');

/** Make a Dynamodb instance

  {
    access_key_id: <Access Key Id String>
    secret_access_key: <Secret Access Key String>
  }

  @throws
  Error when credentials are missing

  @returns
  <Dynamodb Object>
*/
module.exports = args => {
  if (!args.access_key_id || !args.secret_access_key) {
    throw new Error('Expected access key id, secret access key');
  }

  return new DynamoDB({
    accessKeyId: args.access_key_id,
    apiVersion: awsConfig.ddb_version,
    httpOptions: {timeout: awsConfig.ddb_default_timeout},
    maxRetries: awsConfig.ddb_default_max_retries,
    region: awsConfig.ddb_default_region,
    secretAccessKey: args.secret_access_key,
  });
};

