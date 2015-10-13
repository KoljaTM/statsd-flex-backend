/*
 * configurable backend for statsD
 *
 * To enable this backend, include 'statsd-flex-backend' in the backends
 * configuration array:
 *
 *   backends: ['statsd-flex-backend']
 *
 * This backend supports the following config options:
 *
 *  tbd
 */
var util = require('util');

var lastFlush = new Date();
;
var conf;
var bucketMap = {};

var flush_stats = function (ts, metrics) {
    var now = new Date();
    var diff = now - lastFlush;
    lastFlush = now;
    var counters = metrics.counters;
    conf.buckets.map(function (bucket) {
        var b;
        for (b in counters) {
            if (b.match(bucket.regex)) {
                if (!bucketMap[bucket.name]) {
                    bucketMap[bucket.name] = 0.0;
                }
                if (bucket.halflive) {
                    bucketMap[bucket.name] = bucketMap[bucket.name] * Math.pow(0.5, (diff / bucket.halflive));
                }
                bucketMap[bucket.name] += counters[b];
            }
        }
        conf.background(bucketMap);
    });
};

var received_packet = function (msg, rinfo) {
    var message = msg.toString('utf-8');
    conf.events.map(function (event) {
        if (message.match(event.regex)) {
            event.exec(bucketMap);
        }

    });
};

exports.init = function (startup_time, config, events) {
    conf = config.flexbackend;

    events.on('flush', flush_stats);
    events.on('packet', received_packet);

    return true;
};
