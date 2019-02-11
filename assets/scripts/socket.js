let sproto = require("sproto");
var utils = require('./utils');
cc.Class({
    extends: cc.Component,

    properties: 
	{
		inited : false,		
		
    },

    // LIFE-CYCLE CALLBACKS:
	
	arrayToArrayBuffer:function(array) 
	{
		var b = new ArrayBuffer(array.length);
		var v = new DataView(b, 0);
		for (var i = 0; i < array.length; i++) {
			v.setUint8(i, array[i]);
		}

		return b;
	},

    onLoad () 
	{
		var self = this;
		var url = cc.url.raw("resources/protocol.spb");
		var xhr = cc.loader.getXMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function (oEvent) {
			var arrayBuffer = xhr.response;
			if (arrayBuffer) {
				var result = new Uint8Array(arrayBuffer);
				// 任何需要的处理
				console.log(result);
				//var schema =  JSON.parse(result);
				//console.log(schema);
				let client = sproto.createNew(result);
				self.client = client;
				client.dump();
				
				var header_tmp = {
					"type":12,
					"session":45,
				};
				//header_tmp.Type = 12;
				//header_tmp.Session = 45;
				var header_buffer = client.encode("Header", header_tmp);
				var header_d = client.decode("Header", header_buffer);
				console.log(header_d);
				
				var msg = {
					"Name" :  "songyudong",
					
				}

				var buffer = client.encode("Hello", msg)
				
				

				var r = client.decode("Hello", buffer)
				console.log(r);
				
				var msgId = [0x0, 0x0];
				
				console.log(header_buffer);
				console.log(buffer);
				//var sendData = utils.arrayconcat(header_buffer, buffer);
				var sendData = utils.arrayconcat(msgId, buffer);
				self.sendData = self.arrayToArrayBuffer(sendData);
				//self.sendData = sendData;
				console.log(sendData);
				console.log(self.sendData);
								
				self.connect();		
			}
			else {
				
			}
		}
		// 错误处理
		//xhr.onerror = ... // 同样需要调用 callback 返回错误信息

		xhr.send(null);
		
		
	},
	
	connect()
	{
		if(this.inited)
		{
			cc.log("socket has already inited");
			return;
		}
		var url = "ws://" + "192.168.1.4" + ":" + 3653;
		this.ws = new WebSocket(url);
		this.ws.binaryType = "arraybuffer"
		var self = this;
		this.ws.onopen = function()
		{
			cc.log("login");
			cc.log(self.ws);
			
			
			self.inited = true;
			/*self.ws.send(JSON.stringify({CSLogin:{
					UserName:'songyudong',
					Password:'111111'
				}}))
			*/
			self.ws.send(self.sendData);
		};
		
		this.ws.onmessage = function(event)
		{
			/*var decoder = new window.TextDecoder("utf-8")
			var data = JSON.parse(decoder.decode(event.data));
			self.receive(data);*/
			
			console.log(event.data);
			var data = utils.arraybuffer2array(event.data);
			console.log(data);
			var dataview = new DataView(event.data);
			var msgId = dataview.getUint16(0);
			console.log("id=:"+msgId);
			var result = self.client.decode("SCLogin", data.slice(2));
			console.log(result);
		};
		
		this.ws.onerror = function (event) 
		{
			cc.log("network error");
		};
		
		this.ws.onclose = function()
		{
			cc.log("network colsed");
			self.inited = false;
		};
	},
	
	
    start () 
	{
		//this.connect();
		
    },
	
	send:function(data)
	{
		//cc.log(this.ws)
		if(this.inited==false)
		{
			cc.log("socket is not ready");
		}
		else if(this.ws.readyState == WebSocket.OPEN)
		{
			//cc.log("send msg:"+data)
			let pdata = JSON.stringify(data);
			this.ws.send(pdata);
		}
		else
		{
			cc.log("socket ready state:" + this.ws.readyState);
		}
			
	},
	
	receive:function(data)
	{
		//cc.log("receive messsage:" + data)
		this.node.emit("receive", data);
	},
	

    // update (dt) {},
});
