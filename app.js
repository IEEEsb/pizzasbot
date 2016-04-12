var telegram = require('telegram-bot-api');
var orders={};

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
}

var createButton = function(text){
	return text;
}

var pizzasKeyboard = function(){
	return [
	["Bacon Cheeseburger"],
	["Tejana con Cebolla"],
	["Tejana"],
	["Bacon Crispy"],
	["Chicken Fan Barbacoa"],
	["Barbacoa Crème Queso"],
	["Barbacoa Crème Tomate"],
	["Especial de la casa cebolla"],
	["Calzzone Clásica"],
	["Especial de la casa champiñón"],
	["Jalisco"],
	["Wok"],
	["Hot Dog"],
	["Telepizza Supreme"],
	["Top Cheese & Chicken"],
	["Delicheese"],
	["4 Quesos"],
	["Formaggio"],
	["Lasaña Especialidad"],
	["Japonesa"],
	["Carbonara Cebolla"],
	["Hawaiana"],
	["Florentina"],
	["De la Huerta"],
	["César Deluxe"],
	["Barbacoa"],
	["Carbonara"],
	["La Ibérica"],
	["Burger"],
	["Nachos"],
	];
}

  	var handleMessage=function(message){
  		var text=message.text;
  		var userId=message.chat.id;
  		var userName=message.chat.title||message.chat.first_name;

  		api.sendMessage({chat_id:message.chat.id,text:"Hola",reply_markup:JSON.stringify({
  			keyboard:pizzasKeyboard(true,true),
  			selective:false})},function(err, data){
  			console.log(err,data);
  		});
  	}

  	autoUpdate(handleMessage);
