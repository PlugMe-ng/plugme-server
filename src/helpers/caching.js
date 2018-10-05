import config from '../config';
/**
 * TODO: abstract this caching module
 */

const Redis = require('redis');

// Promisify the redis client
// Credits: https://gist.github.com/danieljoppi/13ea2042089227e831a615e448273bba
const redisClent = new Proxy(Redis.createClient(config.REDIS_URL), {
  get(redis, name) {
    const target = redis[name];
    if (typeof target !== 'function') return target;

    /**
     * @param {any} _
     * @returns {Promise} -
     */
    function bar(..._) {
      const args = Array.prototype.slice.call(_);
      return new Promise((resolve, reject) => {
        target.apply(redis, [...args, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }]);
      });
    }
    return bar;
  }
});

redisClent.on('error', (err) => {});

export default redisClent;
