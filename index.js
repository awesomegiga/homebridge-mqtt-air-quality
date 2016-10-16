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
  var Air_quality_idx = 0;

  this.service = new Service.AirQualitySensor(this.name);
  this.service
  .getCharacteristic(Characteristic.AirQuality)
  .on('get', this.getAirQuality.bind(this));

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
  if (this.PM_size == "PM2_5") {this.PM_size_value = 0;}
  if (this.PM_size == "PM10") {this.PM_size_value = 1;}
  callback(null, this.PM_size_value);
}

AirQualityAccessory.prototype.getPMdensity = function(callback) {
  this.log(this.name, " - MQTT : PM = ", this.PM);
  callback(null, this.PM);
}

AirQualityAccessory.prototype.getAirQuality = function(callback) {
  if (this.PM_size == "PM2_5")
  {
    if (this.PM > 0 & this.PM <= 12) {this.Air_quality_idx = 1;}
    else if (this.PM <= 35) {this.Air_quality_idx = 2;}
    else if (this.PM <= 55) {this.Air_quality_idx = 3;}
    else if (this.PM <= 150) {this.Air_quality_idx = 4;}
    else  {this.Air_quality_idx = 5;}
    // else if (this.PM <= 424) {this.Air_quality_idx = 5;}
  }
  if (this.PM_size == "PM10")
  {
    if (this.PM > 0 & this.PM <= 54) {this.Air_quality_idx = 1;}
    else if (this.PM <= 154) {this.Air_quality_idx = 2;}
    else if (this.PM <= 254) {this.Air_quality_idx = 3;}
    else if (this.PM <= 354) {this.Air_quality_idx = 4;}
    else  {this.Air_quality_idx = 5;}
    // else if (this.PM <= 424) {this.Air_quality_idx = 5;}
  }
  callback(null, this.Air_quality_idx);
}

AirQualityAccessory.prototype.getServices = function() {
  return [this.service];
}
