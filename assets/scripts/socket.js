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
		for (var i = 0; i < array.length; i++) 
		{
			v.setUint8(i, array[i]);
		}

		return b;
	},

    onLoad () 
	{
		this.mapNameToId = new Map();
		this.mapIdToName = new Map();
		
		var self = this;
		var url = cc.url.raw("resources/protocol.spb");
		var xhr = cc.loader.getXMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.responseType = "arraybuffer";
		xhr.onload = function (oEvent) 
		{
			var arrayBuffer = xhr.response;
			if (arrayBuffer) 
			{
				var result = new Uint8Array(arrayBuffer);
				
				//console.log(result);
				
				let client = sproto.createNew(result);
				self.client = client;
				//client.dump();
				
				for(let i=0; i<client.type.length; i++)
				{
					let t = client.type[i];
					self.mapNameToId.set(t.name, i);
					self.mapIdToName.set(i, t.name);
				}
				
				//console.log(self.mapNameToId);
				//console.log(self.mapIdToName);
				self.connect();		
			}
			else 
			{
				
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
		var url = "ws://" + "127.0.0.1" + ":" + 3653;
		this.ws = new WebSocket(url);
		this.ws.binaryType = "arraybuffer"
		var self = this;
		this.ws.onopen = function()
		{
			//cc.log("login");
			//cc.log(self.ws);
			
			
			self.inited = true;
			
			//self.ws.send(self.sendData);
			var msg = 
			{
				"Name" :  "songyudong",					
			}
			self.send("Hello", msg); 
		};
		
		this.ws.onmessage = function(event)
		{
			//console.log(event.data);
			var data = utils.arraybuffer2array(event.data);
			//console.log(data);
			var dataview = new DataView(event.data);
			var msgId = dataview.getUint16(0);
			//console.log("id=:"+msgId);
			//console.log(self.mapIdToName);
			var result = self.client.decode(self.mapIdToName.get(msgId), data.slice(2));
			//console.log(result);
			
			self.receive(self.mapIdToName.get(msgId), result);
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
		
    },
	
	send:function(msgName, msgParam)
	{
		//cc.log(this.ws)
		if(this.inited==false)
		{
			cc.log("socket is not ready");
		}
		else if(this.ws.readyState == WebSocket.OPEN)
		{
			var buffer = this.client.encode(msgName, msgParam);
			var id = this.mapNameToId.get(msgName);
			//console.log("msg name = " + msgName);
			//console.log("msg id = " + id);
			var msgId = [0x0, 0x0];
			msgId[0] = id<<8;
			msgId[1] = id&0xFF;
			
			
			//console.log(buffer);
			
			var sendData = utils.arrayconcat(msgId, buffer);
			var sendDataBuffer = this.arrayToArrayBuffer(sendData);
			
			//console.log(sendData);
			//console.log(sendDataBuffer);
			this.ws.send(sendDataBuffer);	
								
		}
		else
		{
			cc.log("socket ready state:" + this.ws.readyState);
		}
			
	},
	
	receive:function(msgName, msgParam)
	{
		cc.log("receive messsage msgname =" + msgName);
		cc.log(msgParam);
		this.node.emit("receive", msgName, msgParam);
	},
	

    // update (dt) {},
});
