let linebot = require("linebot");
let express = require("express");
let path = require("path");
let bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var serveStatic = require('serve-static');
let mongoose = require("mongoose");

require("dotenv").config();

mongoose.connect(process.env.DB_HOST);
let EventModel = require("./models/event");

//line bot
let bot = linebot({
  channelId: process.env.channelId,
  channelSecret: process.env.channelSecret,
  channelAccessToken: process.env.channelAccessToken
});
 
const linebotParser = bot.parser(),
  app = express();

app.use('/public', express.static(__dirname + '/public'));
// app.use(bodyParser.urlencoded({extended:false}));
// app.use(bodyParser.json());
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");


// routes
var api = require("./routes/api");

app.use("/getEvent", api);

app.get('/myMap', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

// app.get('/getEvent', function(req, res){
//   EventModel.find({},function(err, events) {
//     res.json({events});
//   });
// });


let server = app.listen(process.env.PORT || 3000, function() {
  let port = server.address().port;
  console.log("My Line bot App running on port", port);
});


let users=[];


bot.on('message', function (event) {
  let myId = event.source.userId;
  console.log(users[myId]);

  switch (event.message.type) {
    case 'text':
      switch (event.message.text) {
        case "我要刊登活動":
          if(users[myId] == undefined){
            users[myId] = [];
            users[myId].userId = myId;
            users[myId].name = event.source.profile().then(function (profile) {
              return profile.displayName;
            });
            users[myId].step = -1;
          }
          event.reply("請輸入活動名稱");
          users[myId].step++;
          break
        case "今日有哪些活動？":
          EventModel.find({},function(err, events) {
            let eventList = [];
            events.forEach(eventT => {
              eventList.push(eventDetail(eventT));
            });
            // console.log(eventList);
            sendMessage(event,allEventList(eventList));
          });
        break;
        default:
          if(users[myId] !== undefined && users[myId].step !== undefined){
            console.log(users[myId]);
            if(users[myId].step === 0){
            users[myId].eventName = event.message.text;
              sendMessage(event,selectType);
              users[myId].step++;
            }else if(users[myId].step === 1){
              if(event.message.text == "取消"){
                users[myId] = [];
                console.log("取消1");
                event.reply("已取消")
              }else{
                users[myId].type = event.message.text;
                sendMessage(event,selectTime);
                users[myId].step++;
              }
            }else if(users[myId].step === 4){
              users[myId].eventDetail = event.message.text;
              sendMessage(event,checkEvent(myId));
              users[myId].step++;
            }
            else if(users[myId].step === 5){
              if(event.message.text == "確認"){
                users[myId].step = -1;
                event.source.profile().then(function(profile) {
                  var newEventModel = new EventModel(); //新增使用者至資料庫
                  let timeArray = users[myId].time;
                  newEventModel.userId = event.source.userId;
                  newEventModel.userName = profile.displayName;
                  newEventModel.eventName = users[myId].eventName;
                  newEventModel.eventType = users[myId].type;
                  newEventModel.location.address = users[myId].address;
                  newEventModel.location.latitude = users[myId].latitude;
                  newEventModel.location.longitude = users[myId].longitude;
                  newEventModel.date = timeArray.split("T")[0];
                  newEventModel.time = timeArray.split("T")[1];
                  newEventModel.detail = users[myId].eventDetail;
                  newEventModel.save(function(err) {
                    users[myId] = [];
                    event.reply("刊登成功");
                    if (err) throw err;
                    return;
                  });
                });
              }else{
                users[myId] = [];
                console.log(users[myId].step);
                console.log("取消2");
                event.reply("已取消");
              }
            }else{
              console.log("取消");
            }
          }else{
            console.log(event.message.text);
            if(event.message.text.includes("顯示活動詳情")){
              EventModel.findOne({_id: event.message.text.split("：")[1]},function(err, events) {
                sendMessage(event,{
                  "type": "flex",
                  "altText": "Flex Message",
                  "contents": {
                    "type": "bubble",
                    "direction": "ltr",
                    "body": {
                      "type": "box",
                      "layout": "vertical",
                      "contents": [
                        {
                          "type": "text",
                          "text": events.detail,
                          "align": "start",
                          "wrap": true
                        }
                      ]
                    }
                  }
                })
              });
             
            }
          }
          break;
      }
      break;
      case 'location':
          if(users[myId] !== undefined){
            if(users[myId].step === 3){
              users[myId].address = event.message.address;
              users[myId].latitude = event.message.latitude;
              users[myId].longitude =  event.message.longitude;
              sendMessage(event,"請輸入活動詳情");
              users[myId].step++;
            }
          }
      break;
  }
});

bot.on('postback', function (event) {
  let myId = event.source.userId;
  if(users[myId] !== undefined){
    if(users[myId].step === 2){
      users[myId].time = event.postback.params.datetime;
      sendMessage(event,selectLocation);
    }
    users[myId].step++;
  }
});


function sendMessage(eve,msg){
  eve.reply(msg).then(function(data){
    console.log('Success', data);
  }).catch(function(error){
    console.log('Error', error);
  });
}

let selectType = {
  "type": "flex",
  "altText": "Flex Message",
  "contents": {
    "type": "bubble",
    "direction": "ltr",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "請選取活動類型",
          "align": "center"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "種菜",
            "text": "種菜"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "拔草",
            "text": "拔草"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "摘水果",
            "text": "摘水果"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "打工換宿",
            "text": "打工換宿"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "農品販售",
            "text": "農品販售"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "其他體驗",
            "text": "其他體驗"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "取消",
            "text": "取消"
          }
        }
      ]
    }
  }
};


let selectTime = {
  "type": "flex",
  "altText": "Flex Message",
  "contents": {
    "type": "bubble",
    "direction": "ltr",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "請選取時間",
          "align": "center"
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "datetimepicker",
            "label": "選取時間",
            "data": "time",
            "mode": "datetime",
            "initial": "2019-11-14T22:48",
            "max": "2020-11-14T22:48",
            "min": "2018-11-14T22:48"
          }
        }
      ]
    }
  }
};

let selectLocation = {
  "type": "template",
  "altText": "this is a buttons template",
  "template": {
    "type": "buttons",
    "actions": [
      {
         "type":"location",
         "label":"選取位置"
      }
    ],
    "text": "請選取活動位置"
  }
};

let checkEvent = function (myId){
  return{
  "type": "flex",
  "altText": "Flex Message",
  "contents": {
    "type": "bubble",
    "direction": "ltr",
    "header": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "您的活動",
          "align": "center"
        }
      ]
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "contents": [
        {
          "type": "text",
          "text": "名稱："+users[myId].eventName,
        },
        {
          "type": "text",
          "text": "類型："+users[myId].type
        },
        {
          "type": "text",
          "text": "地點："+users[myId].address,
          "wrap": true
        },
        {
          "type": "text",
          "text": "時間：" +users[myId].time
        },
        {
          "type": "text",
          "text": "活動詳情：" +users[myId].eventDetail,
          "wrap": true

        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "確認",
            "text": "確認"
          }
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "取消",
            "text": "取消"
          }
        }
      ]
    }
  }
}
};

function eventDetail(event){

  let image = "";
  switch(event.eventType){
    case "種菜":
      image = "https://ngrok.kenlee.com.tw/public/images/vegeImage.jpg";
      break
    case "拔草":
      image = "https://ngrok.kenlee.com.tw/public/images/workImage.jpg";
      break
    case "摘水果":
      image = "https://ngrok.kenlee.com.tw/public/images/fruitImage.jpg";
      break
    case "打工換宿":
      image = "https://ngrok.kenlee.com.tw/public/images/liveImage.jpg";
      break
    case "其他體驗":
      image = "https://ngrok.kenlee.com.tw/public/images/otherImage.jpg";
      break
    case "農品販售":
      image = "https://ngrok.kenlee.com.tw/public/images/saleImage.jpg";
      break
  }

  return {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": image,
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "sm",
      "contents": [
        {
          "type": "text",
          "text": event.eventName,
          "size": "lg",
          "weight": "bold",
          "wrap": true
        },
        {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "類型："+ event.eventType,
              "flex": 0,
              "size": "sm",
              "weight": "regular",
              "wrap": true
            },
            {
              "type": "text",
              "text": "日期：" + event.date,
              "flex": 0,
              "size": "sm",
              "weight": "regular",
              "wrap": true
            },
            {
              "type": "text",
              "text": "時間：" + event.time,
              "flex": 0,
              "size": "sm",
              "weight": "regular",
              "wrap": true
            },
            {
              "type": "text",
              "text": "地點：" + event.location.address,
              "flex": 0,
              "size": "sm",
              "weight": "regular",
              "wrap": true
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "spacing": "sm",
      "contents": [
        {
          "type": "button",
          "action": {
            "type": "uri",
            "label": "打開地圖",
            "uri": "https://www.google.com/maps/search/?api=1&query="+event.location.latitude+","+event.location.longitude
          },
          "style": "primary"
        },
        {
          "type": "button",
          "action": {
            "type": "message",
            "label": "活動詳情",
            "text": "顯示活動詳情："+ event._id
          },
          "color": "#000000"
        }
      ]
    }
  }
}

function allEventList(eventList){
  return {
    "type": "flex",
    "altText": "Flex Message",
    "contents": {
      "type": "carousel",
      "contents": eventList
    }
  }
}


app.post("/linewebsocket", linebotParser);

