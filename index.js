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
  // this.PM_size = config["PM_size"];
  this.url = config['url'];
  // this.topic = config['topic'];
  this.topic_PM2_5 = config['topic_PM2_5'];
  this.topic_PM10 = config['topic_PM10'];
  this.updateInterval = config['update_Interval'];


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

  // var PM_size_value =-1;
  var Air_quality_idx = 0;
  var Air_quality_idx_PM10 = 0;
  var Air_quality_idx_PM2_5 = 0;
  var PM2_5Density = 0;
  var PM10Density = 0;
  var PM_updated = false;

  this.service = new Service.AirQualitySensor(this.name);
  // this.service
  // .getCharacteristic(Characteristic.AirParticulateSize)
  // .on('get', this.getPMsize.bind(this));
  // this.service
  // .getCharacteristic(Characteristic.AirParticulateDensity)
  // .on('get', this.getPMdensity.bind(this));

  this.service
  .addCharacteristic(new Characteristic.PM2_5Density())
  .on('get', this.getPM2_5Density.bind(this));
  this.service
  .addCharacteristic(new Characteristic.PM10Density())
  .on('get', this.getPM10Density.bind(this));

  this.service
  .getCharacteristic(Characteristic.AirQuality)
  .on('get', this.getAirQuality.bind(this));

  this.service
  .addCharacteristic(Characteristic.ObstructionDetected);

  this.informationService = new Service.AccessoryInformation();

  this.informationService
      .setCharacteristic(Characteristic.Manufacturer, "Plantower")
      .setCharacteristic(Characteristic.Model, "PMS7003")
      .setCharacteristic(Characteristic.SerialNumber, "XXXXXX");


  var that = this;

  setInterval(function () {
    if (that.PM_updated === true)
    {
      that.service
      .setCharacteristic(Characteristic.ObstructionDetected, false);
      that.PM_updated = false;
      that.log('PM value updated recently (No Obstruction Detected)');
    }
    else
    {
      that.service
      .setCharacteristic(Characteristic.ObstructionDetected, true);
      that.log('PM value not updated since ',  that.updateInterval*2,' minutes (Obstruction Detected)');
    }
  }, (that.updateInterval*2)*60*1000);

  this.client  = mqtt.connect(this.url, this.options);
  this.client.subscribe(this.topic_PM2_5);
  this.client.subscribe(this.topic_PM10);


  this.client.on('message', function (topic, message) {
  data = JSON.parse(message);
  if (data === null) {return null}
  if (topic === that.topic_PM2_5)
  {
    that.PM2_5Density = parseFloat(data);
    that.PM_updated = true;
    that.log('- MQTT : PM 2.5 =', that.PM2_5Density, 'µg/m3');
  }
  if (topic === that.topic_PM10)
  {
    that.PM10Density = parseFloat(data);
    that.PM_updated = true;
    that.log('- MQTT : PM 10 =', that.PM10Density, 'µg/m3');
  }

  });
}

// AirQualityAccessory.prototype.getPMsize = function(callback) {
//   if (this.PM_size == "PM2_5") {this.PM_size_value = 0;}
//   if (this.PM_size == "PM10") {this.PM_size_value = 1;}
//   callback(null, this.PM_size_value);
// }

// AirQualityAccessory.prototype.getPMdensity = function(callback) {
//   this.log(this.name, " - MQTT : PM = ", this.PM);
//   callback(null, this.PM);
// }

AirQualityAccessory.prototype.getPM2_5Density = function(callback) {
  callback(null, this.PM2_5Density);
}

AirQualityAccessory.prototype.getPM10Density = function(callback) {
  callback(null, this.PM10Density);
}

AirQualityAccessory.prototype.getAirQuality = function(callback) {

  switch (true) {
    case (0 <= this.PM2_5Density &&  this.PM2_5Density <= 12):
    {
      this.Air_quality_idx_PM2_5 = 1;
    }
    break;
    case (13 <= this.PM2_5Density &&  this.PM2_5Density <= 35):
    {
      this.Air_quality_idx_PM2_5 = 2;
    }
    break;
    case (36 <= this.PM2_5Density &&  this.PM2_5Density <= 55): /* do something */
    {
      this.Air_quality_idx_PM2_5 = 3;
    }
    break;
    case (56 <= this.PM2_5Density &&  this.PM2_5Density <= 150): /* do something */
    {
      this.Air_quality_idx_PM2_5 = 4;
    }
    break;
    case (151 <= this.PM2_5Density): /* do something */
    {
      this.Air_quality_idx_PM2_5 = 5;
    }
    break;
    default:
    {
      this.Air_quality_idx_PM2_5 = 0;
    }
    break;
  }

  switch (true) {
    case (0 <= this.PM10Density &&  this.PM10Density <= 54):
    {
      this.Air_quality_idx_PM10 = 1;
    }
    break;
    case (55 <= this.PM10Density &&  this.PM10Density <= 154):
    {
      this.Air_quality_idx_PM10 = 2;
    }
    break;
    case (155 <= this.PM10Density &&  this.PM10Density <= 254): /* do something */
    {
      this.Air_quality_idx_PM10 = 3;
    }
    break;
    case (255 <= this.PM10Density &&  this.PM10Density <= 354): /* do something */
    {
      this.Air_quality_idx_PM10 = 4;
    }
    break;
    case (355 <= this.PM10Density): /* do something */
    {
      this.Air_quality_idx_PM10 = 5;
    }
    break;
    default:
    {
      this.Air_quality_idx_PM10 = 0;
    }
    break;
  }


    if ( this.Air_quality_idx_PM10 > this.Air_quality_idx_PM2_5)
    {
      this.Air_quality_idx = this.Air_quality_idx_PM10;
    }
    else
    {
      this.Air_quality_idx = this.Air_quality_idx_PM2_5;
    }
    this.log('PM 2.5 density is ', this.PM2_5Density, 'µg/m3');
    this.log('PM 10  density is ', this.PM10Density, 'µg/m3');

    this.log('AQI: ', this.Air_quality_idx);

    callback(null, this.Air_quality_idx);
}

AirQualityAccessory.prototype.getServices = function() {
  return [this.service, this.informationService];
}
