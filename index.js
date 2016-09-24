'use strict';

var mqtt = require('mqtt');
var Service, Characteristic;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mqtt-air-quality", "mqtt-air-quality", AirQualityAccessory);
}

function AirQualityAccessory(log, config) {
this.log = log;
this.name = config["name"];
this.PM_size = config["PM_size"];
this.url = config['url'];
this.topic = config['topic'];
this.client_Id 		= 'mqttjs_' + Math.random().toString(16).substr(2, 8);7
this.options = {
  keepalive: 10,
  clientId: this.client_Id,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  will: {
    topic: 'WillMsg',
    payload: 'Connection Closed abnormally..!',
    qos: 0,
    retain: false
  },
  username: config["username"],
  password: config["password"],
  rejectUnauthorized: false
};

var PM_size_value =-1;

this.service = new Service.AirQualitySensor(this.name);
this.service
.getCharacteristic(Characteristic.AirParticulateSize)
.on('get', this.getPMsize.bind(this))
this.service
.getCharacteristic(Characteristic.AirParticulateDensity)
.on('get', this.getPMdensity.bind(this))


this.client  = mqtt.connect(this.url, this.options);
var that = this;
this.client.subscribe(this.topic);

  this.client.on('message', function (topic, message) {
  data = JSON.parse(message);
  if (data === null) {return null}
  that.PM = parseFloat(data);
  });
}

AirQualityAccessory.prototype.getPMsize = function(callback) {
if (this.PM_size == "PM2_5") {PM_size_value =0;}
if (this.PM_size == "PM10") {PM_size_value =1;}
callback(null, this.PM_size_value);
}

AirQualityAccessory.prototype.getPMdensity = function(callback) {
this.log(this.name, " - MQTT : PM = ", this.PM);
callback(null, this.PM);
}

AirQualityAccessory.prototype.getServices = function() {
  return [this.service];
}
