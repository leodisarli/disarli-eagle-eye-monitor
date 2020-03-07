class RedisPub {
  constructor(redisConnections, dateTime, uuid) {
    this.redisConnections = redisConnections;
    this.dateTime = dateTime;
    this.uuid = uuid;
  }

  prepareData(data) {
    let sent_in = this.dateTime.getDate();
    let time = this.dateTime.getTime();

    let uuid = this.uuid.generate();
  
    return JSON.stringify({
      "id": uuid,
      "message": data,
      "sent_in": sent_in,
      "timestamp": time
    });
  }

  publish(channel, message) {
    try {
      this.redisConnections.forEach((conn) => {
        conn.publish(channel, this.prepareData(message));
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
module.exports = RedisPub;
