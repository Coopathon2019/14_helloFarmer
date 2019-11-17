let mongoose = require("mongoose");
let Schema   = mongoose.Schema;

var eventSchema = new Schema({
  userId         :String,
  userName        : String,
  eventName           : String,
  eventType           : String,
  location       : {
                    address: String,
                    latitude: String,
                    longitude: String,
                  },
  date           :String,
  time           :String,
  detail : String
});

module.exports = mongoose.model('Event', eventSchema);
