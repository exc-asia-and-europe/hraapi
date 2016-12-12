/*
 * All Endpoints need to have at least the following:
 * annotationsList - current list of OA Annotations
 * dfd - Deferred Object
 * init()
 * search(options, successCallback, errorCallback)
 * create(oaAnnotation, successCallback, errorCallback)
 * update(oaAnnotation, successCallback, errorCallback)
 * deleteAnnotation(annotationID, successCallback, errorCallback) (delete is a reserved word)
 * TODO:
 * read() //not currently used
 *
 * Optional, if endpoint is not OA compliant:
 * getAnnotationInOA(endpointAnnotation)
 * getAnnotationInEndpoint(oaAnnotation)
 */
(function($){

  $.HraAnno = function(options) {
    jQuery.extend(this, {
      dfd:       null,
      annotationsList: [],        
      windowID: null,
      apiUrl: "https://localhost:3443",
      eventEmitter: null,
      user: this.user
    }, options);

    this.init(options);
  };

  $.HraAnno.prototype = {
    permissionsMapping: {
      'read': 'read',
      'create': 'create',
      'update': 'modify',
      'delete': 'delete'
    },
    user: {
      canvasAnnotationPermissions: {
        'read':   false,
        'create': false,
        'modify': false,
        'delete':  false
      }
    },
    windowObj: null,
    _waitForWindowRendering: function(windowId) {
      var _this = this;
      var windowObj = this._getWindowObject(windowId);
      if(windowObj !== null) {
        _this.windowObj = windowObj;
        return;
      }
      else {
        setTimeout(function() {
          _this._waitForWindowRendering(windowId);
          _this.eventEmitter.publish('windowRendered.' + windowId);
        }, 200);
      }
    },

    _getWindowObject: function(windowID){
      var _this = this;
      var returnWindowObject = null;
      miradorInstance.viewer.workspace.windows.forEach(function(windowObject){
        if(windowObject.id === windowID){
          returnWindowObject = windowObject;
          return;
        }
      });
      return returnWindowObject;
    },

    //Set up some options for catch
    init: function(options) {
      var _this = this;
      this.windowID = this.windowID?this.windowID:this.windowIDwindowID;
      this.options = options;
      this.eventEmitter.subscribe('currentCanvasIDUpdated.' + this.windowID, function(event, canvasId) {
        var windowObject = _this._getWindowObject(_this.windowID);
        _this._updateCanvasPermissions(canvasId);
        windowObject.getAnnotations();
      });

      this.eventEmitter.subscribe('UserLoggedIn', function() {
        var windowObject = _this._getWindowObject(_this.windowID);
        _this.eventEmitter.publish('currentCanvasIDUpdated.' + _this.windowID, windowObject.canvasID);
        //reload the annotations
        windowObject.getAnnotations();

/*
        console.debug("user logged in");
*/      });
      this.eventEmitter.subscribe('UserLoggedOut', function() {
        var windowObject = _this._getWindowObject(_this.windowID);
        _this.eventEmitter.publish('currentCanvasIDUpdated.' + _this.windowID, windowObject.canvasID);
        windowObject.getAnnotations();
        
/*

        console.debug("user logged OUT");
*/
      });

      // update the canvas permissions once when window is finally rendered
      this.eventEmitter.subscribe('windowRendered.' + this.windowID, function() {
        console.debug("window rendering completed");
        _this._updateCanvasPermissions(_this.windowObj.canvasID);
      });
      this._waitForWindowRendering(this.windowID);
      console.info("HRA Anno endpoint initialized");
    },

    set: function(prop, value, options) {
      /*console.debug("setCalled");*/
      if (options) {
        this[options.parent][prop] = value;
      } else {
        this[prop] = value;
      }
    },

/*    _uuidGen: function() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    },
*/
    //Search endpoint for all annotations with a given URI
    search: function(options, successCallback, errorCallback) {
      var _this = this;
      this.annotationsList = []; //clear out current list

       jQuery.ajax({
        url: this.apiUrl + "/annotations/searchCanvasAnnotations/" + encodeURIComponent(options.uri),
        type: 'GET',
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback(data);
          } else {
          //check if a function has been passed in, otherwise, treat it as a normal search
            jQuery.each(data, function(index, value) {
              value.oaAnnotation.endpoint = _this;
             _this.annotationsList.push(value.oaAnnotation);
            });           
            /*_this.eventEmitter.publish('annotationListLoaded.' + _this.windowID);*/
            _this.dfd.resolve(true);
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          } else {
            console.error("There was an error searching this endpoint");
          }
        }
      });
    },
    
    deleteAnnotation: function(annotationID, successCallback, errorCallback) {
      var _this = this;

      jQuery.ajax({
        url: _this.apiUrl + "/annotations/oaAnno/" + encodeURIComponent(annotationID),
        type: 'DELETE',
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },

        success: function(data) {
          _this.annotationsList = jQuery.grep(_this.annotationsList, function(value, index) {
            return value['@id'] !== annotationID;
          });
          console.debug(_this.annotationsList);
          if (typeof successCallback === "function") {
            successCallback();
          }
          _this.eventEmitter.publish('HRAAnnotationDeleted.' + _this.windowID , annotationID);
          /*
          //publishing the following event leads to a loop where the ajax call gets redone over and over again
          _this.eventEmitter.publish('annotationDeleted.' + _this.windowID , annotationID);
          */
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
  
    update: function(oaAnnotation, successCallback, errorCallback) {
      var _this = this;
      var annotationID = oaAnnotation['@id'];
      var endpoint = oaAnnotation.endpoint;
      //remove endpoint reference before JSON.stringify
      delete oaAnnotation.endpoint;
   
      var ajaxHeaders = {};
      jQuery.ajax({
        url: this.apiUrl + "/annotations/oaAnno/" + encodeURIComponent(annotationID),
        type: 'PUT',
        dataType: 'json',
        data: JSON.stringify(oaAnnotation),
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        xhrFields: {
          withCredentials: true
        },

        success: function(data) {
          oaAnnotation.endpoint = endpoint;
          /*console.log(_this.annotationsList.length);*/
          if (typeof successCallback === "function") {
            successCallback(oaAnnotation);
          }
/* 
         //publishing the following event leads to a loop where the ajax call gets redone over and over again
         _this.eventEmitter.publish('annotationUpdated.' + _this.windowID, data);
*/
        },
        error: function(data) {
          if (typeof errorCallback === "function") {
            errorCallback(data);
          }
        }
      });
    },

    //takes OA Annotation, gets Endpoint Annotation, and saves
    //if successful, MUST return the OA rendering of the annotation
    create: function(oaAnnotation, successCallback, errorCallback) {
      var _this = this;
      delete oaAnnotation.endpoint;

      jQuery.ajax({
        url: this.apiUrl + "/annotations/oaAnno",
        type: 'POST',
        dataType: 'json',
        data: JSON.stringify(oaAnnotation),
        crossDomain: true,
        contentType: "application/json; charset=utf-8",
        xhrFields: {
          withCredentials: true
        },

        success: function(data) {
          if (typeof successCallback === "function") {
            data.endpoint = _this;
            successCallback(data);
          }
          _this.eventEmitter.publish('annotationCreated:' +_this.windowID, data);
          _this.annotationsList.push(data);
          return(data);
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },

    _updateCanvasPermissions: function(canvasId){
      console.debug("updateCanvasPermissions");
      var _this = this;
      jQuery.ajax({
        url: _this.apiUrl + "/users/permissionsFor/" + encodeURIComponent(canvasId),
        type: 'GET',
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },

        success: function(data) {
          _this.user.canvasAnnotationPermissions = data;
          var windowObject = _this._getWindowObject(_this.windowID);
          //Set visibility of annotations button
          var annoButton = windowObject.element.find(".mirador-osd-annotations-layer");

          var enableVisibility = (data.read || data.modify || data.create);
          if(enableVisibility){
            if(!annoButton.is(":visible")){
              console.debug("show anno button");
              annoButton.show();
            }
          }else{
            if(annoButton.is(":visible")){
              console.debug("hide anno button");
              annoButton.hide();
            } 
          }
          
          if(windowObject.focusModules.ImageView.hud.annoState.current !== "off"){
            // If read or modify permissions: show the pointer
            if(data.read || data.modify){
              if(!windowObject.element.find(".mirador-osd-pointer-mode.hud-control").is(":visible")){
                console.debug("show pointer");
                windowObject.element.find(".mirador-osd-pointer-mode.hud-control").show();
              }
            }else{
              if(windowObject.element.find(".mirador-osd-pointer-mode.hud-control").is(":visible")){
                console.debug("hide pointer");
                windowObject.element.find(".mirador-osd-pointer-mode.hud-control").hide();
              }
            }

            if(data.create){
              windowObject.element.find(".mirador-osd-annotation-controls > .hud-control:not(.mirador-osd-annotations-layer):not(.mirador-osd-pointer-mode):not(:visible)").show();
              //Anno creation allowed for current canvas
              
            }else{
              //Anno creation denied for current canvas
              windowObject.element.find(".mirador-osd-annotation-controls > .hud-control:not(.mirador-osd-annotations-layer):not(.mirador-osd-pointer-mode):visible").hide();
            }
          }

        },
        error: function(msg) {
          _this.user.canvasAnnotationPermissions = null;
        }
      });
    },
    
    userAuthorize: function(action, annotation) {
      return this.user.canvasAnnotationPermissions[this.permissionsMapping[action]];
    }
  };

}(Mirador));
