import * as assert from 'assert';
import * as path from 'path';
import { Worker, isMainThread, parentPort } from 'worker_threads';
import { createClient } from 'redis';
import { setUpAdapter } from '../src/index';
import { AdapterOptions } from '../src/interfaces';

const options: AdapterOptions = {
  redisOptions: {
    url: 'redis://localhost:6379'
  },
  inChannel: 'dummyInChannel',
  outChannel: 'dummyOutChannel',
  processMessage: processMessage,
  handleError: function (error: Error) { console.error(error); }
};

if (isMainThread) {
  const worker = new Worker(__filename);
  setUpAdapter(options);
  worker.on('message', () => { process.exit(0);});
} else {
  const listener = createClient(options.redisOptions);
  listener.connect()
    .then(function () {
      let i = 2;
      listener.subscribe(options.outChannel, function(message: string | Buffer) {
        const data = JSON.parse(message.toString('utf-8'));
        assert.equal(data.count, i++);
        if (11 === i) {
          console.log('ALL TESTS HAVE PASSED.');
          // @ts-ignore
          parentPort.postMessage('done');
          listener.quit();
        }
      }, options.isBufferMode || true);
    })
    .then(function () {
      const publisher = listener.duplicate();
      publisher.connect().then(function () {
        [...range(1, 10)].forEach(function (x) {
          const data = JSON.stringify({
            count: x
          });
          publisher.publish(options.inChannel, data);
        });
      });
    })
    .catch(function (err) { console.error(err); });
}

function processMessage(message: string | Buffer): string | Buffer {
  let data = JSON.parse(message.toString('utf-8'));
  data.count += 1;
  data = JSON.stringify(data);
  return Buffer.from(data);
}

function *range(start: number, end: number): any {
  for (let i = start; i < end; ++i) { yield i; }
}
