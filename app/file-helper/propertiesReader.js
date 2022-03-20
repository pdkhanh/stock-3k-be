var PropertiesReader = require('properties-reader');
var properties = PropertiesReader('app/config/config.properties');

function getProperties(propetyName) {
    return properties.get(propetyName)
}

exports.getProperties = getProperties 