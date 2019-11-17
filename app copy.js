let linebot = require("linebot");
let express = require("express");
let path = require("path");
let bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var serveStatic = require('serve-static');

require("dotenv").config();

// mongoose.connect(process.env.DB_HOST);

//line bot
let bot = linebot({
  channelId: process.env.channelId,
  channelSecret: process.env.channelSecret,
  channelAccessToken: process.env.channelAccessToken
});

const linebotParser = bot.parser(),
  app = express();

app.use(serveStatic(__dirname + "/public")); //Serves resources from

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");


let server = app.listen(process.env.PORT || 3000, function() {
  let port = server.address().port;
  console.log("My Line bot App running on port", port);
});



bot.on('message', function (event) {
  switch (event.message.type) {
    case 'text':
      switch (event.message.text) {
        case 'Me':
          event.source.profile().then(function (profile) {
            return event.reply('Hello ' + profile.displayName + ' ' + profile.userId);
          });
          break;
        case 'Member':
          event.source.member().then(function (member) {
            return event.reply(JSON.stringify(member));
          });
          break;
        case 'Picture':
          event.reply({
            type: 'image',
            originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
            previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
          });
          break;
        case 'Location':
          event.reply({
            type: 'location',
            title: 'LINE Plus Corporation',
            address: '嘉義市四維南路73號',
            latitude: 13.7202068,
            longitude: 100.5298698
          });
          break;
        case 'Push':
          bot.push('U17448c796a01b715d293c34810985a4c', ['Hey!', 'สวัสดี ' + String.fromCharCode(0xD83D, 0xDE01)]);
          break;
        case 'Push2':
          bot.push('Cba71ba25dafbd6a1472c655fe22979e2', 'Push to group');
          break;
        case 'Multicast':
          bot.push(['U17448c796a01b715d293c34810985a4c', 'Cba71ba25dafbd6a1472c655fe22979e2'], 'Multicast!');
          break;
        case 'Broadcast':
          bot.broadcast('Broadcast!');
          break;
        case 'Confirm':
          event.reply({
            type: 'template',
            altText: 'this is a confirm template',
            template: {
              type: 'confirm',
              text: 'Are you sure?',
              actions: [{
                type: 'message',
                label: 'Yes',
                text: 'yes'
              }, {
                type: 'message',
                label: 'No',
                text: 'no'
              }]
            }
          });
          break;
        case 'Multiple':
          return event.reply(['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']);
          break;
        case 'Version':
          event.reply('linebot@' + require('../package.json').version);
          break;
        default:
          event.reply(event.message.text).then(function (data) {
            console.log('Success', data);
          }).catch(function (error) {
            console.log('Error', error);
          });
          break;
      }
      break;
    case 'image':
      event.message.content().then(function (data) {
        const s = data.toString('hex').substring(0, 32);
        return event.reply('Nice picture! ' + s);
      }).catch(function (err) {
        return event.reply(err.toString());
      });
      break;
    case 'video':
      event.reply('Nice video!');
      break;
    case 'audio':
      event.reply('Nice audio!');
      break;
    case 'location':
      event.reply(['That\'s a good location!', 'Lat:' + event.message.latitude, 'Long:' + event.message.longitude]);
      break;
    case 'sticker':
      event.reply({
        type: 'sticker',
        packageId: 1,
        stickerId: 1
      });
      break;
    default:
      event.reply('Unknow message: ' + JSON.stringify(event));
      break;
  }
});


// bot.on('message', function (event) {
// console.log(event);
//   event.reply({
//      type: 'template',
//   altText: 'this is a carousel template',
//   template: {
//     type: 'carousel',
//     columns: [{
//       thumbnailImageUrl: 'https://attach.mobile01.com/attach/201911/mobile01-86317600487bac02191a2c3dafde9661.jpg',
//       title: 'this is menu',
//       text: 'description',
//       actions: [{  
//         "type":"datetimepicker",
//         "label":"Select date",
//         "data":"storeId=12345",
//         "mode":"datetime",
//         "initial":"2017-12-25t00:00",
//         "max":"2018-01-24t23:59",
//         "min":"2017-12-25t00:00"
//      }, {
//         "type":"location",
//         "label":"Location"
//       }, {
//         type: 'uri',
//         label: 'View detail',
//         uri: 'http://example.com/page/111'
//       }]
//     }, {
//       thumbnailImageUrl: 'https://attach.mobile01.com/attach/201911/mobile01-86317600487bac02191a2c3dafde9661.jpg',
//       title: 'this is menu',
//       text: 'description',
//       actions: [{
//         type: 'postback',
//         label: 'Buy',
//         data: 'action=buy&itemid=222'
//       }, {
//         "type":"location",
//         "label":"Location"
//       }, {
//         type: 'uri',
//         label: 'View detail',
//         uri: 'http://example.com/page/222'
//       }]
//     }]
//   }
//   }).then(function (data) {
//     console.log('Success', data);
//   }).catch(function (error) {
//     console.log('Error', error);
//   });
// });

app.post("/linewebsocket", linebotParser);

