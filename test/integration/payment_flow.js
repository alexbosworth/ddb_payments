const asyncAuto = require('async/auto');
const asyncConstant = require('async/constant');
const {test} = require('tap');
const uuidv4 = require('uuid/v4');

const {createPaymentRecord, getPaymentRecord} = require('./../../index');
const {updatePaymentRecord} = require('./../../index');

return test('payment flow', t => {
  return asyncAuto({
    // AWS credentials
    aws: asyncConstant({
      access_key_id: process.env.DDB_PAYMENTS_TEST_KEY_ID,
      payments_table: process.env.DDB_PAYMENTS_TEST_TABLE,
      secret_access_key: process.env.DDB_PAYMENTS_TEST_SECRET_ACCESS_KEY,
    }),

    // Payment record to create
    paymentRecord: asyncConstant({
      created_at: new Date().toISOString(),
      details: {item_id: uuidv4()},
      expires_at: new Date(Date.now() + 1000*60*15).toISOString(),
      id: uuidv4(),
      key: uuidv4(),
      type: 'test_payment',
    }),

    // Record new invoice
    createRecord: ['aws', 'paymentRecord', (res, cbk) => {
      return createPaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        created_at: res.paymentRecord.created_at,
        details: res.paymentRecord.details,
        expires_at: res.paymentRecord.expires_at,
        id: res.paymentRecord.id,
        key: res.paymentRecord.key,
        type: res.paymentRecord.type,
      },
      cbk);
    }],

    // Make sure that an overwrite will fail
    createOverwriteRecord: ['createRecord', (res, cbk) => {
      return createPaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        created_at: res.paymentRecord.created_at,
        details: res.paymentRecord.details,
        expires_at: res.paymentRecord.expires_at,
        id: res.paymentRecord.id,
        key: res.paymentRecord.key,
        type: res.paymentRecord.type,
      },
      err => {
        const [errCode] = err;

        return cbk(null, errCode);
      });
    }],

    // Get the record
    getRecord: ['aws', 'createRecord', (res, cbk) => {
      return getPaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        id: res.paymentRecord.id,
        is_consistent: false,
        key: res.paymentRecord.key,
      },
      cbk);
    }],

    // Update to processing
    updateRecord: ['aws', 'getRecord', (res, cbk) => {
      return updatePaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        id: res.paymentRecord.id,
        key: res.paymentRecord.key,
        rev: res.getRecord.rev,
        status: 'processing',
      },
      cbk);
    }],

    // Excessively update
    overUpdateRecord: ['updateRecord', (res, cbk) => {
      return updatePaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        id: res.paymentRecord.id,
        key: res.paymentRecord.key,
        rev: res.getRecord.rev,
        status: 'processing',
      },
      err => {
        const [errCode] = err;

        return cbk(null, errCode);
      });
    }],

    // Get the updated record
    getUpdatedRecord: ['overUpdateRecord', (res, cbk) => {
      return getPaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        id: res.paymentRecord.id,
        is_consistent: true,
        key: res.paymentRecord.key,
      },
      cbk);
    }],

    // Updated to processed
    completePayment: ['getUpdatedRecord', (res, cbk) => {
      return updatePaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        id: res.paymentRecord.id,
        key: res.paymentRecord.key,
        rev: res.getUpdatedRecord.rev,
        status: 'processed',
      },
      cbk);
    }],

    // Make sure that the payment was processed
    getCompletedPayment: ['completePayment', (res, cbk) => {
      return getPaymentRecord({
        aws_access_key_id: res.aws.access_key_id,
        aws_payments_table: res.aws.payments_table,
        aws_secret_access_key: res.aws.secret_access_key,
        id: res.paymentRecord.id,
        is_consistent: false,
        key: res.paymentRecord.key,
      },
      cbk);
    }],
  },
  (err, res) => {
    if (!!err) {
      throw err;
    }

    // Make sure that creating inconsistent is considered conflict
    t.equal(res.createOverwriteRecord, 409);
    t.equal(res.overUpdateRecord, 409);

    t.equal(res.paymentRecord.created_at, res.getRecord.created_at);
    t.same(res.paymentRecord.details, res.getRecord.details);
    t.equal(res.paymentRecord.id, res.getRecord.id);
    t.equal(res.paymentRecord.key, res.getRecord.key);
    t.equal(res.paymentRecord.type, res.getRecord.type);

    return t.end();
  });
});

