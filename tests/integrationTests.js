"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const redis_1 = require("redis");
const index_1 = require("../src/index");
const options = {
    redisOptions: {
        url: 'redis://localhost:6379'
    },
    inChannel: 'dummyInChannel',
    outChannel: 'dummyOutChannel',
    processMessage: processMessage,
    handleError: function (error) { console.error(error); }
};
if (worker_threads_1.isMainThread) {
    const worker = new worker_threads_1.Worker(__filename);
    (0, index_1.setUpAdapter)(options);
}
else {
    const listener = (0, redis_1.createClient)(options.redisOptions);
    listener.connect()
        .then(function () {
        listener.subscribe(options.outChannel, function (message) {
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
function processMessage(message) {
    let data = JSON.parse(message.toString('utf-8'));
    data.count += 42;
    data = JSON.stringify(data);
    console.log('The message has been processed.');
    return Buffer.from(data);
}
