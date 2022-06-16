"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpAdapter = void 0;
const redis_1 = require("redis");
function setUpAdapter(options) {
    const subscriber = (0, redis_1.createClient)(options.redisOptions);
    subscriber.connect()
        .then(function () {
        subscriber.subscribe(options.inChannel, function (message) {
            const publisher = subscriber.duplicate();
            publisher.connect()
                .then(function () {
                return options.processMessage(message);
            })
                .then(function (result) {
                publisher.publish(options.outChannel, result);
                publisher.quit();
            })
                .catch(options.handleError);
        }, options.isBufferMode || true);
    })
        .catch(options.handleError);
}
exports.setUpAdapter = setUpAdapter;
