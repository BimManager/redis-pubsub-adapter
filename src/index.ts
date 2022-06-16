import { createClient } from 'redis';

import { AdapterOptions } from './interfaces';

export function setUpAdapter(options: AdapterOptions): void {
  const subscriber = createClient(options.redisOptions);
  subscriber.connect()
    .then(function () {
      subscriber.subscribe(options.inChannel, function (message: string | Buffer) {
        const publisher = subscriber.duplicate();
        publisher.connect()
          .then(function () {
            return options.processMessage(message);
          })
          .then(function (result: string | Buffer) {
            publisher.publish(options.outChannel, result);
            publisher.quit();
          })
          .catch(options.handleError);
      }, options.isBufferMode || true);
    })
    .catch(options.handleError);
}
