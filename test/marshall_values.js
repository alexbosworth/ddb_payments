const tap = require('tap');
const ddbRowFormattedValue = require('./../libs/ddb_row_formatted_value');

tap.same(ddbRowFormattedValue(false), {BOOL: false});
tap.same(ddbRowFormattedValue(true), {BOOL: true});
tap.same(ddbRowFormattedValue(Buffer.from('00', 'hex')), {B: 'AA=='});
tap.same(ddbRowFormattedValue(1), {N: '1'});
tap.same(ddbRowFormattedValue('str'), {S: 'str'});
tap.same(ddbRowFormattedValue(null), {NULL: true});
tap.same(ddbRowFormattedValue({foo: 'bar'}), {M: {foo: {S: 'bar'}}});
tap.throws(() => ddbRowFormattedValue(undefined));
tap.same(ddbRowFormattedValue([Buffer.from('00', 'hex')]), {BS: ['AA==']});
tap.same(ddbRowFormattedValue(['str']), {SS: ['str']});
tap.same(ddbRowFormattedValue([1]), {NS: ['1']});

