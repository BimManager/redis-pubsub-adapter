import * as path from 'path';
import { Worker, isMainThread,  } from 'worker_threads';
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
} else {
  const listener = createClient(options.redisOptions);
  listener.connect()
    .then(function () {
      listener.subscribe(options.outChannel, function(message: string | Buffer) {
        console.log('LISTENER: ' + message.toString('utf-8'));
      }, options.isBufferMode || true);
    })
    .then(function () {
      const publisher = listener.duplicate();
      publisher.connect().then(function () {
        const data = JSON.stringify({
          count: 0
        });
        console.log('PUBLISHER: ' + data);
        publisher.publish(options.inChannel, data);
      });
    })
    .catch(function (err) { console.error(err); });
}

function processMessage(message: string | Buffer): string | Buffer {
  let data = JSON.parse(message.toString('utf-8'));
  data.count += 42;
  data = JSON.stringify(data);
  console.log('The message has been processed.');
  return Buffer.from(data);
}

