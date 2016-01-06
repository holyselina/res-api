var _ =require('lodash');
var EE = require('events').EventEmitter;
var eventManager = new EE();
var successEvent = 'success';
var failEvent = 'fail';

var mdw = function(options){
    options = options || {};
    return function(req,res,next) {
        res.success = success;
        res.fail = fail;
        next();
    }
};

module.exports = mdw;

mdw.onFail = eventManager.on.bind(eventManager,failEvent);
mdw.removeFail =  eventManager.removeListener.bind(eventManager,failEvent);
mdw.removeAllFail =  eventManager.removeAllListeners.bind(eventManager,failEvent);
mdw.onSuccess = eventManager.on.bind(eventManager,successEvent);
mdw.removeSuccess =  eventManager.removeListener.bind(eventManager,successEvent);
mdw.removeAllSuccess =  eventManager.removeAllListeners.bind(eventManager,successEvent);

mdw.status={
    success:200,
    fail:300
};

mdw.apiJSON = function getJSON(msg,data,status){
  return {msg:msg,data:data,status:status};
};

function emitFail(req,err){
   if(EE.listenerCount(eventManager,failEvent) > 0){
      eventManager.emit(failEvent,req,err);
   }
}

function emitSuccess(req,data){
   if(EE.listenerCount(eventManager,successEvent) > 0){
      eventManager.emit(successEvent,req,data);
   }
}

function success(msg,data){
 var res = this;
 var req = res.req;
 if(_.isObject(msg)){
     data = msg;
     msg = null;
 }
 msg = msg || 'success';
 data = data || {};
 var status = mdw.status.success;
 send(req,res,msg,data,status);
 emitSuccess(req,data);
}


function fail(status,msg,data){
  var res = this;
  var req = res.req;
  var len = arguments.length;
  if(len === 1){
    if(_.isString(status)){
        msg = status;
        status = null;
    }else if(_.isObject(status)){
        data = status;
        status = null;
    }
  }else if(len === 2){
    if(_.isString(status)){//msg,data
        if(_.isObject(msg)){
            data = msg;
        }
        msg = status;
        status = null;
    }else if(_.isObject(msg)){//status,(msg|data)
        data = msg;
        msg = null;
    }
  }
  data = data || {};
  msg = msg || data.message || 'fail';
  if(status == null){
      status = mdw.status.fail;
  }
  send(req,res,msg,data,status);
  emitFail(req,data);
}

function send(req,res,msg,data,status){
    var js = mdw.apiJSON(msg,data,status);
    if(res.isJSONP === true){
        res.status(200).jsonp(js);
    }else{
        res.status(200).json(js);
    }
}
