/*
 * Push stats to a blink1 server
 *
 * To enable this backend, include 'statsd-blink1-backend' in the backends
 * configuration array:
 *
 *   backends: ['statsd-blink1-backend']
 *
 * This backend supports the following config options:
 *
 *  tbd
 */
var util = require('util');
var http = require('http');
var request = require('request');
var conn;

var debug;
var flushInterval;
var conf;

var flush_stats = function(ts, metrics)
{
};

var received_packet = function(msg, rinfo) {
  console.log('packet');
  var message=msg.toString('utf-8');
  console.log(message);
  console.log(rinfo);
  conf.events.map(function(event) {
    if (message.match(event.regex)) {
      request(event.call());
    }

  });
};

exports.init = function(startup_time, config, events)
{
  debug = config.debug;
  var options = {};

  conf=config.blink1;

  events.on('flush', flush_stats);
  events.on('packet', received_packet);

  return true;
};
