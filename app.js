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

var sendMessage = function(chatId,text){
	api.sendMessage({chat_id:chatId,text:text,reply_markup:JSON.stringify({force_reply:false,selective:true})},function(){});
};

var handleMessage=function(message){
	var text=message.text;
	var chatId=message.chat.id;
	var userName=message.chat.title||message.chat.first_name;
	switch(true){
		case text.search(/\/pedido/i)==0:
		if(orders[chatId]&&orders[chatId].active){
			sendMessage(chatId,"Termina el anterior pedido antes de crear uno nuevo");
		}else{
			orders[chatId]= {active : true , pizzas:[] ,awaitingHalfs:[]};
			api.sendMessage({chat_id:chatId,text:"Elige pizza",reply_markup:JSON.stringify({keyboard:pizzasKeyboard(true,true),selective:false})},function(){});
		}
		break;
		case text.search(/\/terminar/i)==0:
		console.log("Pelea: "+userId);
		pelea = true;
		api.sendMessage({chat_id:message.chat.id,text:"/toalla /jarvis",reply_markup:JSON.stringify({force_reply:false,selective:true})},function(err, data){
			console.log(err,data);
		});
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
							orders[chatId].awaitingHalfs.splice(i,1);}
						else{
							api.sendMessage({chat_id:chatId,text:"Elige segunda mitad",reply_markup:JSON.stringify({keyboard:pizzasKeyboard(false,false),selective:true})},function(){});
						}
						api.sendMessage({chat_id:message.chat.id,text:"Pos fale",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
						break;
					}
				}
				if(!wasHalf){
					orders[chatId].pizzas.push({
						client:userName,
						halfs:[text,text]
					});
				}
				console.log(orders[chatId].pizzas);
				api.sendMessage({chat_id:message.chat.id,text:"Pos fale",reply_to_message_id:message.message_id,reply_markup:JSON.stringify({selective:true})},function(){});
			}else{
				if(text == 'Por mitades'){
					orders[chatId].awaitingHalfs.push({halfIndex:0,pizzaIndex:orders[chatId].pizzas.length,user:userName});
					orders[chatId].pizzas.push({
						client:userName,
						halfs:["Mitad vacía","Mitad vacía"]
					});
					console.log("mitades");
					api.sendMessage({chat_id:chatId,text:"Elige primera mitad",reply_markup:JSON.stringify({keyboard:pizzasKeyboard(false,false),selective:true})},function(){});
				}
			}
		}
		break;
	}
};

autoUpdate(handleMessage);




