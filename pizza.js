var TelegramBot = require('node-telegram-bot-api');
var orders = {};

var bot = new TelegramBot( process.env.PIZZA_BOT_TOKEN, {polling: true});

var createButton = function(text){
  return text;
};

var pizzas = [
  "Pizza Bacon Hot Dog",
  "Boloñesa",
  "Telepizza Americana",
  "Pepe Peperoni",
  "Telepizza Barbacoa",
  "Telepizza Carbonara",
  "Carbonara Cebolla",
  "Hawaiana",
  "Steak House",
  "Bacon Cheeseburger",
  "Bacon Crispy",
  "Barbacoa Crème Queso",
  "Barbacoa Crème Tomate",
  "Especial de la casa cebolla",
  "Especial de la casa champiñón",
  "Jalisco",
  "Supreme",
  "Telepizza Delicheese",
  "4 Quesos",
  "Formaggio",
  "Lasaña",
  "Florentina",
  "De la Huerta",
  "César Deluxe"
];

var pizzasKeyboard = function(halfsEnabled,customEnabled){
  var keyboard = [];
  for (var i = pizzas.length - 1; i >= 0; i--) {
    var pizzaName = pizzas[i];
    keyboard.push([pizzaName]);
  }
  if(halfsEnabled)
    keyboard.push(["Por mitades"]);
  if(customEnabled)
    keyboard.push(["Custom"]);
  return keyboard;
};

var sendMessage = function(chatId,text,replyTo){
  bot.sendMessage(chatId,text,replyTo?{reply_to_message_id:replyTo,reply_markup:JSON.stringify({force_reply:false,selective:true})}:{}).then(function(){});
};

var resumen = function(order,finished){
  if(order.pizzas.length==0){
    return "No me molesteis para no pedir ninguna pizza, bastardos";
  }
  var message = "";
  message+=finished?"Pedido de pizzas terminado, el que no haya pedido se joda. Son estas: \n":"Hasta el momento me habéis pedido:\n";
  for (var i = order.pizzas.length - 1; i >= 0; i--) {
    var pizza = order.pizzas[i];
    message+= pizza.client+": "+(pizza.halfs[0]===pizza.halfs[1]?pizza.halfs[0]:pizza.halfs)+"\n";
  }
  return message;
}

var handleMessage=function(message){
  var text=message.text||"";
  var chatId=message.chat.id;
  if(message.from){
    var userName = message.from.username || message.from.first_name;
    switch(true){
      case text.search(/\/pedido/i)==0:
      if(orders[chatId]&&orders[chatId].active){
        sendMessage(chatId,"Termina el anterior pedido antes de crear uno nuevo, no me seas ansias 😂",message.message_id);
      }else{
        orders[chatId]= {active : true , pizzas:[] ,awaitingHalfs:[],awaitingCustoms:[]};
        bot.sendMessage(chatId,"Es la hora del gordeo! Quien quiere pizzas??? 🍕🍕🍕🍕🍕🍕🍕",{reply_markup:JSON.stringify({one_time_keyboard:true,keyboard:pizzasKeyboard(true,true),selective:false})}).then(function(){});
      }
      break;
      case text.search(/\/terminar/i)==0:
      if(orders[chatId]&&orders[chatId].active){
        orders[chatId].active = false;
        bot.sendMessage(chatId,resumen(orders[chatId],true),{reply_markup:JSON.stringify({hide_keyboard:true,selective:false})}).then(function(){});
      }else{
        sendMessage(chatId,"Termíname esta 😘",message.message_id);
      }
      break;
      case text.search(/\/resumen/i)==0:
      if(orders[chatId]&&orders[chatId].active){
        sendMessage(chatId,resumen(orders[chatId],false),message.message_id);
      }else{
        sendMessage(chatId,"Que resumen ni que nada 😤",message.message_id);
      }
      break;
      case text.search(/\/dieta/i)==0:
      if(orders[chatId]&&orders[chatId].active){
        for (var i = orders[chatId].pizzas.length - 1; i >= 0; i--) {
          var pizza = orders[chatId].pizzas[i];
          if(pizza.client == userName){
            orders[chatId].pizzas.splice(i,1);
          }
        }
        for (var i = orders[chatId].awaitingHalfs.length - 1; i >= 0; i--) {
          var half = orders[chatId].awaitingHalfs[i];
          if(half.user === userName){
            orders[chatId].awaitingHalfs.splice(i,1);
          }
        }
        for (var i = orders[chatId].awaitingCustoms.length - 1; i >= 0; i--) {
          var custom = orders[chatId].awaitingCustoms[i];
          if(custom.user === userName){
            orders[chatId].awaitingCustoms.splice(i,1);
          }
        }
        sendMessage(message.chat.id,"Tu ya no comes, parguela 🌵",message.message_id);
      }
      break;
      case text.search(/\/peleagitana/i)==0:
      sendMessage(chatId, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      break;
      default:
      if(!message.new_chat_member&&!message.left_chat_member){
        if(orders[chatId]&&orders[chatId].active){
          var index = pizzas.indexOf(text);
          console.log(text);
          if(index!=-1){
            var wasHalf = false;
            for (var i = orders[chatId].awaitingHalfs.length - 1; i >= 0; i--) {
              var awaitingHalf = orders[chatId].awaitingHalfs[i];
              if(awaitingHalf.user == userName){
                var pizza = orders[chatId].pizzas[awaitingHalf.pizzaIndex];
                pizza.halfs[awaitingHalf.halfIndex++] = text;
                wasHalf = true;
                console.log("was half: ",awaitingHalf);
                if(awaitingHalf.halfIndex==2){
                  orders[chatId].awaitingHalfs.splice(i,1);
                  sendMessage(message.chat.id,(text==="Hawaiana"?"MEDIA PIZZA CON PIÑA? SRSLY 😒? por esta vez la agrego al pedido, pero que no se repita. Parguela.":"Pos fale"),message.message_id);
                }
                else{
                  sendMessage(chatId,(text==="Hawaiana"?"Joder que parguela eres 😒, dime la otra mitad anda.":"Dime la segunda mitad"),message.message_id);
                }
                break;
              }
            }
            if(!wasHalf){
              orders[chatId].pizzas.push({
                client:userName,
                halfs:[text,text]
              });
              sendMessage(chatId,(text==="Hawaiana"?"PIZZA CON PIÑA? SRSLY😒😒😒😒😒? por esta vez la agrego al pedido, pero que no se repita. Parguela😘.":"Pos fale"),message.message_id);
            }
            console.log(orders[chatId].pizzas);
          }else{
            var wasCustom = false;
            for (var i = orders[chatId].awaitingCustoms.length - 1; i >= 0; i--) {
              var awaitingCustom = orders[chatId].awaitingCustoms[i];
              if(awaitingCustom.user == userName){
                orders[chatId].pizzas.push({
                  client:userName,
                  halfs:[text,text]
                });
                console.log("custom: ",orders[chatId].pizzas);
                orders[chatId].awaitingCustoms.splice(i,1);
                sendMessage(message.chat.id,"Pos fale",message.message_id);
                wasCustom = true;
              }
            }
            if(!wasCustom){
              if(text == 'Por mitades'){
                orders[chatId].awaitingHalfs.push({halfIndex:0,pizzaIndex:orders[chatId].pizzas.length,user:userName});
                orders[chatId].pizzas.push({
                  client:userName,
                  halfs:["Mitad vacía","Mitad vacía"]
                });
                console.log("mitades");
                sendMessage(message.chat.id,"Que peñazo... elige primera mitad anda 😪",message.message_id);
              }else{
                if(text == 'Custom'){
                  orders[chatId].awaitingCustoms.push({user:userName});
                  sendMessage(chatId,"Dime como la quieres. Y la pizza también *inserte sticker de charlas aquí*",message.message_id);
                }
              }
            }
          }
        }else{
          if(!text.search(/\//i)==0)
            sendMessage(chatId,"Madre de die que tontaco eres, que no hay ningun pedido activo! me largo a por un café ☕️",message.message_id);
        }}
        break;
      }
    }
  };

  bot.on('message', handleMessage);
