import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { describe, it } from 'node:test';
import { HttpError, pathParam, readJson, route } from '../../server/http.js';

const jsonReq = (body, type = 'application/json') =>
  Object.assign(Readable.from([body]), { headers: { 'content-type': type } });

function fakeRes() {
  const res = { headers: {}, statusCode: 200, body: '' };
  res.setHeader = (k, v) => {
    res.headers[k.toLowerCase()] = v;
  };
  res.end = (b) => {
    res.body = b;
  };
  return res;
}

describe('pathParam', () => {
  it('returns the decoded last path segment', () => {
    assert.equal(pathParam({ url: '/api/admin/profiles/essential' }), 'essential');
    assert.equal(pathParam({ url: '/api/admin/profiles/a%20b/?x=1' }), 'a b');
  });
});

describe('readJson', () => {
  it('parses a JSON body', async () => {
    assert.deepEqual(await readJson(jsonReq('{"a":1}')), { a: 1 });
  });

  it('rejects other content types and invalid JSON', async () => {
    await assert.rejects(readJson(jsonReq('a=1', 'application/x-www-form-urlencoded')), (e) => e.status === 415);
    await assert.rejects(readJson(jsonReq('{nope')), (e) => e.status === 400);
  });
});

describe('route', () => {
  it('answers 405 with an Allow header for unsupported methods', async () => {
    const res = fakeRes();
    await route({ GET() {} })({ method: 'DELETE' }, res);
    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.allow, 'GET');
  });

  it('turns HttpError into its status and hides other errors', async () => {
    const res = fakeRes();
    await route({
      GET() {
        throw new HttpError(404, 'Profile not found');
      },
    })({ method: 'GET' }, res);
    assert.equal(res.statusCode, 404);
    assert.equal(JSON.parse(res.body).error, 'Profile not found');

    const res2 = fakeRes();
    const original = console.error;
    console.error = () => {};
    await route({
      GET() {
        throw new Error('secret detail');
      },
    })({ method: 'GET' }, res2);
    console.error = original;
    assert.equal(res2.statusCode, 500);
    assert.equal(JSON.parse(res2.body).error, 'Something went wrong');
  });
});
