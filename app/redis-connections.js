class RedisConnections {
  constructor(urls, ports, redis) {
    this.urls = urls;
    this.ports = ports;
    this.Redis = redis;
  }

  connect() {
    try {
      const connections = [];
      this.urls.forEach((element, index) => {
        const pubConn = new this.Redis({
          host: this.urls[index],
          port: this.ports[index],
        });
        connections.push(pubConn);
      });
      return connections;
    } catch (error) {
      return [];
    }
  }
}
module.exports = RedisConnections;
