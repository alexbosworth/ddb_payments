const tap = require('tap');
const objFromDdbRow = require('./../libs/obj_from_ddb_row');

const testBuffer = Buffer.from('00', 'hex');

tap.same(objFromDdbRow({foo: {BOOL: false}}), {foo: false});
tap.same(objFromDdbRow({foo: {BOOL: true}}), {foo: true});
tap.same(objFromDdbRow({foo: {B: 'AA=='}}), {foo: testBuffer});
tap.same(objFromDdbRow({foo: {N: '1'}}), {foo: 1});
tap.same(objFromDdbRow({foo: {S: 'str'}}), {foo: 'str'});
tap.same(objFromDdbRow({foo: {NULL: true}}), {foo: null});
tap.same(objFromDdbRow({foo: {M: {bar: {S: 'baz'}}}}), {foo: {bar: 'baz'}});
tap.throws(() => objFromDdbRow({foo: undefined}));
tap.same(objFromDdbRow({foo: {BS: ['AA==']}}), {foo: [testBuffer]});
tap.same(objFromDdbRow({foo: {SS: ['str']}}), {foo: ['str']});
tap.same(objFromDdbRow({foo: {NS: ['1']}}), {foo: [1]});

