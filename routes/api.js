var express = require('express');
var router = express.Router();
let bodyParser = require("body-parser");
let EventModel = require("../models/event");

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var jsonParser = bodyParser.json({limit: '1mb'});

/* GET home page. */
router.get('/', function(req, res) {
  EventModel.find({},function(err, events) {
    res.json({events});
  });
});

module.exports = router;
