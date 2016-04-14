var telegram = require('telegram-bot-api');
var orders = {};

var api = new telegram({
  token: process.env.PIZZA_BOT_TOKEN
});

var lastOffset=null;

var autoUpdate=function(callback){
  api.getUpdates({limit:100,offset:lastOffset||undefined},function(err,data){
    if(err) 
      console.log(err);
    if(data){
      for(var i=0;i<data.length;i++){
        lastOffset=data[i].update_id+1;
        callback(data[i].message);
      }
    }
    autoUpdate(callback);
  });
};

var createButton = function(text){
  return text;
};

var pizzas = [
  "Bacon Cheeseburger",
  "Tejana con Cebolla",
  "Tejana",
  "Bacon Crispy",
  "Chicken Fan Barbacoa",
  "Barbacoa Crème Queso",
  "Barbacoa Crème Tomate",
  "Especial de la casa cebolla",
  "Calzzone Clásica",
  "Especial de la casa champiñón",
  "Jalisco",
  "Wok",
  "Hot Dog",
  "Telepizza Supreme",
  "Top Cheese & Chicken",
  "Delicheese",
  "4 Quesos",
  "Formaggio",
  "Lasaña Especialidad",
  "Japonesa",
  "Carbonara Cebolla",
  "Hawaiana",
  "Florentina",
  "De la Huerta",
  "César Deluxe",
  "Barbacoa",
  "Carbonara",
  "La Ibérica",
  "Burger",
  "Nachos"
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
  api.sendMessage({chat_id:chatId,text:text,reply_to_message_id:replyTo,reply_markup:JSON.stringify({force_reply:false,selective:true})},function(){});
};

var resumen = function(order){
  if(order.pizzas.length==0){
    return "No me molesteis para no pedir ninguna pizza, bastardos";
  }
  var message = "";
  message+="Pedido de pizzas terminado, el que no haya pedido se joda. Son estas: \n";
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
        api.sendMessage({chat_id:chatId,text:"Es la hora del gordeo! Quien quiere pizzas??? 🍕🍕🍕🍕🍕🍕🍕",reply_markup:JSON.stringify({one_time_keyboard:true,keyboard:pizzasKeyboard(true,true),selective:false})},function(){});
      }
      break;
      case text.search(/\/terminar/i)==0:
      if(orders[chatId]&&orders[chatId].active){
        orders[chatId].active = false;
        sendMessage(chatId,resumen(orders[chatId]));
      }else{
        sendMessage(chatId,"Termíname esta 😘",message.message_id);
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
        api.sendMessage({chat_id:message.chat.id,text:"Tu ya no comes, parguela 🌵",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
      }
      break;
      default:
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
                api.sendMessage({chat_id:message.chat.id,text:(text==="Hawaiana"?"MEDIA PIZZA CON PIÑA? SRSLY 😒? por esta vez la agrego al pedido, pero que no se repita. Parguela.":"Pos fale"),reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
              }
              else{
                api.sendMessage({chat_id:chatId,text:(text==="Hawaiana"?"Joder que parguela eres 😒, dime la otra mitad anda.":"Dime la segunda mitad"),reply_to_message_id:message.message_id,reply_markup:JSON.stringify({one_time_keyboard:true,keyboard:pizzasKeyboard(false,false),selective:true})},function(){});
              }
              break;
            }
          }
          if(!wasHalf){
            orders[chatId].pizzas.push({
              client:userName,
              halfs:[text,text]
            });
            api.sendMessage({chat_id:message.chat.id,text:(text==="Hawaiana"?"PIZZA CON PIÑA? SRSLY😒😒😒😒😒? por esta vez la agrego al pedido, pero que no se repita. Parguela😘.":"Pos fale"),reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
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
              api.sendMessage({chat_id:message.chat.id,text:"Pos fale",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
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
              api.sendMessage({chat_id:chatId,text:"Que peñazo... elige primera mitad anda 😪",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({one_time_keyboard:true,keyboard:pizzasKeyboard(false,false),selective:true})},function(){});
            }else{
              if(text == 'Custom'){
                orders[chatId].awaitingCustoms.push({user:userName});
                api.sendMessage({chat_id:chatId,text:"Dime como la quieres. Y la pizza también *inserte sticker de charlas aquí*",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
              }
            }
          }
        }
      }else{
        if(!text.search(/\//i)==0)
          api.sendMessage({chat_id:chatId,text:"Madre de die que tontaco eres, que no hay ningun pedido activo! me largo a por un café ☕️",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
      }
      break;
    }
  }
};

autoUpdate(handleMessage);




