const Colors = require('./app/colors.js');
const DateTime = require('./app/date-time.js');
const dotenv = require('dotenv');
const express = require('express');
const Log = require('./app/log.js');
const Redis = require('ioredis');
const RedisConnections = require('./app/redis-connections');
const RedisPub = require('./app/redis-pub');
const request = require('request');
const Uuid = require('./app/uuid');

dotenv.config();
let app = express();

const dateTime = new DateTime();
const log = new Log(dateTime, Colors);
const uuid = new Uuid();

const redisPorts = process.env.REDIS_PORT.split(", ") || [];
const redisUrls = process.env.REDIS_URL.split(", ") || [];
const services = process.env.SERVICES.split(", ") || [];
const time = process.env.TIME_INTERVAL || 30;
const urls = process.env.SERVICES_URL.split(", ") || [];

app.get('/', function (req, res) {
  res.send('ok');
});

app.listen(3000);

let theInterval = time * 1000;

const redisConnections = new RedisConnections(redisUrls, redisPorts, Redis);
const connections = redisConnections.connect();
const redisPub = new RedisPub(connections, dateTime, uuid);

let channel = 'eagle-eye';

function testHealth(item, indice) {
  setInterval(() => {
    request.get({
      url: urls[indice],
      time: true
    }, (error, response, body) => {
      log.debug('bright', 'Checking ' + urls[indice]);
      if (response === undefined) {
        log.debug('red', 'body:' + body);
        log.debug('red', 'statusCode: -');
        log.debug('red', 'Error ' + error);
        let message = {
          'data': {
            'name': services[indice],
            'code': "500",
            'status': 'offline',
            'time': '0',
          },
          'event': 'service-off'
        };
        redisPub.publish(channel, message);
      } else {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          log.debug('green', 'body:' + body.substring(1, 100));
          log.debug('green', 'statusCode:' + response && response.statusCode);
          log.debug('bright', 'The actual time elapsed:' + response.elapsedTime);
          let message = {
            'data': {
              'name': services[indice],
              'code': response && response.statusCode,
              'status': 'online',
              'time': response.elapsedTime,
            },
            'event': 'service-on'
          };
          redisPub.publish(channel, message);
        } else {
          log.debug('red', 'body:' + body.substring(1, 100));
          log.debug('red', 'statusCode:' + response && response.statusCode);
          log.debug('bright', 'The actual time elapsed:' + response.elapsedTime);
          let message = {
            'data': {
              'name': services[indice],
              'code': response && response.statusCode,
              'status': 'offline',
              'time': response.elapsedTime,
            },
            'event': 'service-error'
          };
          redisPub.publish(channel, message);
        }
      }
      log.debug('bright', '=================================================');
    });
  }, theInterval);
}

services.forEach(testHealth);
