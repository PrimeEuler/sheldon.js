window.mediaStream = (function (){
    var lev = 1
    var levOffset = [];
        levOffset[0]=0;
    function BLOB2BS(blob, callback){
            var blobReader = new FileReader();
            blobReader.onload = function(e) {
              callback(  U82BS( new Uint8Array( blobReader.result ) ) );
            }
            blobReader.readAsArrayBuffer(blob);
    }
    function U82BS (u8Array){
    	var i, len = u8Array.length, b_str = "";
    	for (i=0; i<len; i++) {
    		b_str += String.fromCharCode(u8Array[i]);
    	}
    	return b_str;        
    }
    function BS2U8(str){
        var buf     = new ArrayBuffer(str.length); // 2 bytes for each char
        var bufView = new Uint8Array(buf);
        for (var i=0, strLen = str.length; i < strLen; i++) {
            bufView[i] = str.charCodeAt(i);
        }
        return bufView;        
    }
    function BIN(a){
        var unpad = a.charCodeAt(0).toString(2);
        var pad = (new Array(8 - unpad.length + 1)).join('0') + unpad;
        return pad;
    };
    function parseEBML(binstr,offsets,element){
        //console.log(binstr.length)
        var offset = 0;
        var ElementStart = 0;
            offsets = offsets||[]
            element = element||{}

        while(offset < binstr.length){
                ElementStart = offset;
            var unpad = binstr.charCodeAt(offset).toString(2);
            var segments = 8 - unpad.length; //additional segments to decode to get element ID
            var padding = (new Array(segments + 1)).join('0');
            var classID = '';
        //Element.ID chunk
                for(var i = 0; i <= segments; i++){
                    var b = binstr.charCodeAt(offset+i);
                    classID += b.toString(16);
                }
                offset += segments + 1;
                
        //skip padding
            var len = 0;
                while(binstr.charCodeAt(offset + len) == 0){
                    len++;
                }
                offset += len;
            var unpad = binstr.charCodeAt(offset).toString(2);
            var segments = (8 - unpad.length);
            var tex = unpad.substr(1); //initialize the binary with the first few digits
        //Element.Size chunk
                for(var i = 1; i <= segments; i++){
                    var tmp = binstr.charCodeAt(offset+i).toString(2);
                    var pd = (new Array(8 - tmp.length + 1)).join('0') + tmp;
                    tex += pd;
                }
            var size = parseInt(tex, 2);
                offset += segments + 1;
            var head = offset; 
        //Element.Data chunk
            var data = binstr.substr(offset, size);
                offset += data.length

            var msg = schema[classID];
                if(msg){
                        levOffset[lev] = [ElementStart,head,offset,msg.name]
                    var start = 0;
                    var path = ''
                        for(var l = lev;l>=1;l-- ){
                            if(l===lev){
                                start += levOffset[l][0]
                                path = levOffset[l][3]
                            }else{
                                start += levOffset[l][1]
                                path = levOffset[l][3] + '.' + path
                            }
                            
                        }
                    var stop = start + offset - ElementStart

                        
                    
                    
                    // m: Master, u: unsigned int, i: signed integer, s: string, 8: UTF-8 string, b: binary, f: float, d: date
                    var type = msg.type;
                    var dat = null;
                    if(type == 'u'){
                        var bint = data.split('').map(BIN).join('');
                            dat = parseInt(bint,2)
                            //dat = bint.length//parseInt(bint,2);
                            
                    }else if(type == 'i'){
                    }else if(type == 's'){
                      dat = data;
                    }else if(type == '8'){
                      dat = data;
                    }else if(type == 'b'){
                      //dat = data.substr(0,100); //not interpreted by parser
                      dat = data;
                    }else if(type == 'f'){
                        var bint = data.split('').map(BIN).join('');
                        //IEEE 754 single precision binary floating point format
                            dat = bint.length;
                            if(bint.length == 64){
                                var sign = bint.charAt(0);
                                var expo = parseInt(bint.substr(1,11),2) - 1023;
                                var frac = bint.substr(12, 52);
                            }else if(bint.length == 32){
                            }
                    }else if(type == 'd'){
                    }else if(type == 'm'){

                            
                        var ob = {}
                        if(element[msg.name]){
                            if(!Array.isArray(element[msg.name])){
                                var tmp = element[msg.name];
                                element[msg.name] = []
                                element[msg.name].push(tmp)
                            }
                            element[msg.name].push(ob)
                        }else{
                            element[msg.name] = ob
                        }
                        
                        offsets.push({ path:path, value:'Master Element', start:start, stop:stop})
                        
                        lev++;
                        parseEBML( data, offsets, ob );
                        delete levOffset[lev]
                        lev--;
                      
                    }
                    if(type!='m'){
                        if(msg.name==='SimpleBlock'){
                            dat = dat.length
                        }
                        if(element[msg.name]){
                            if(!Array.isArray(element[msg.name])){
                                var tmp = element[msg.name];
                                element[msg.name] = []
                                element[msg.name].push(tmp)
                            }
                            element[msg.name].push(dat)
                        }else{
                            element[msg.name] = dat
                        }
                        offsets.push({ path:path, value:dat, start:start, stop:stop})
                    }
                }else{
                    console.log(classID, offset, binstr.length);
                }
        }
        //console.log(element)
        return [element,offsets]
        //return offsets
    }
    function getTimeStamps(e){
        var l = e.buffered.length
        var timeStamps= []
        for (var t = 0;t<l;t++){
            var stamp = {
                start: e.buffered.start(t) * 1000,
                end: e.buffered.end(t) * 1000
            }
            timeStamps.push(stamp)
        }
        return timeStamps
    }
    function createMediaElement(options){
            if(!options) {
                options = {};
            }
            var MediaElement = document.createElement('video');
                MediaElement.setAttribute('width', 300);
                MediaElement.setAttribute('height', 150);
                MediaElement.addEventListener('abort',function(e){
                    e.event = 'abort'
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('canplay',function(e){
                    e.event = 'canplay'
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('canplaythrough',function(e){
                    e.event = 'canplaythrough'
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('durationchange',function(e){
                    e.event = 'durationchange' 
                    e.duration = MediaElement.duration
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('loadeddata',function(e){
                    e.event = 'loadeddata' 
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('loadedmetadata',function(e){
                    e.event = 'loadedmetadata' 
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })                
                MediaElement.addEventListener('emptied',function(e){
                    e.event = 'emptied'
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('ended',function(e){
                    e.event = 'ended' 
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('error',function(e){
                    e.event = 'error' 
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                MediaElement.addEventListener('timeupdate',function(e){
                    e.event = 'timeupdate'
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement', { 
                            event:'timeupdate',
                            currentTime: MediaElement.currentTime * 1000,
                            timeStamps: getTimeStamps(MediaElement),
                            duration: MediaElement.duration
                        }] )
                    }
                })
                MediaElement.addEventListener('waiting',function(e){
                    e.event = 'waiting'
                    if(typeof options.log === 'function'){
                        options.log(['MediaElement',e])
                    }
                })
                return MediaElement
    }
    function createMediaSource(options){
        if(!options) {
            options = {};
        }
        var MediaElement = options.MediaElement
        var stream      = options.stream
        var mediaSource = new MediaSource()
            mediaSource.addEventListener('sourceopen', function(e) {
                var READY = false
                var queue = [];
                var readyState = ['HAVE_NOTHING','HAVE_METADATA','HAVE_CURRENT_DATA','HAVE_FUTURE_DATA','HAVE_ENOUGH_DATA',]
                var buffer = mediaSource.addSourceBuffer(mimeType);
                    buffer.mode = 'sequence';
                    buffer.addEventListener('error', function(e) { 
                        e.event = 'error' 
                        if(typeof options.log === 'function'){
                            options.log(['SourceBuffer',e])
                        }
                    });
                    buffer.addEventListener('update', function() {
                            if (queue.length > 0 && !buffer.updating) {
                                var data = queue.shift()
                                buffer.appendBuffer(data);
                                if(typeof options.log === 'function'){
                                    options.log( ['SourceBuffer',{ DE_QUEUE:data.length }] )
                                }
                            }
                        var event_msg = ['SourceBuffer',{ 
                                        event:      'update',
                                        offset:     buffer.timestampOffset,
                                        timeStamps: getTimeStamps(MediaElement),//buffer for buffer update
                                        currentTime:MediaElement.currentTime * 1000,
                                        readyState: readyState[MediaElement.readyState],
                                        paused:     MediaElement.paused
                                        }]
                            if(typeof options.log === 'function'){
                                options.log( event_msg )
                            }
                            if(event_msg[1].paused && event_msg[1].readyState == 'HAVE_ENOUGH_DATA'){
                                MediaElement.play();
                            }
                    });
                
            });
            
            mediaSource.$_write = function(data){
                    data = new Uint8Array(data)
                var binaryString = U82BS(data)
                var headers = parseEBML(binaryString)
                var EBML = headers[1].filter(function(element){
                        return(element.path.indexOf('EBML') > -1 && element.value === 'Master Element')
                    })[0]
                    if(!READY && EBML ){
                        READY = true;
                        //init EBML
                        binaryString = binaryString.substring(EBML.start);
                        //init Segment
                        data = BS2U8(binaryString);
                    }
                    if(READY){
                        if (buffer.updating || queue.length > 0) {
                            queue.push(data);
                            if(typeof options.log === 'function'){
                                options.log( ['SourceBuffer',{ QUEUE:data.length }] )
                            }
                        } else {
                            buffer.appendBuffer(data);
                        }
                    }
                    if(typeof options.log === 'function'){
                        options.log( ['EBML', headers[0] ] )
                    }
            }
            mediaSource.$_end = function(){
                READY = false
                MediaElement.pause()
                MediaElement.src = ''
                if(buffer.updating){
                    buffer.addEventListener('updateend', function(e) { 
                        mediaSource.endOfStream()
                    })  
                }else if (mediaSource.readyState === 'open'){
                    mediaSource.endOfStream()
                }
            }
            
            
            stream.on('data',function(data){
                    if(mediaSource.readyState==='ended'){
                        stream.end();
                        return
                        
                    }
                    data = new Uint8Array(data)
                var binaryString = U82BS(data)
                var headers = parseEBML(binaryString)
                var EBML = headers[1].filter(function(element){
                        return(element.path.indexOf('EBML') > -1 && element.value === 'Master Element')
                    })[0]
                    if(!READY && EBML ){
                        READY = true;
                        //init EBML
                        binaryString = binaryString.substring(EBML.start);
                        //init Segment
                        data = BS2U8(binaryString);
                    }
                    if(READY){
                        if (buffer.updating || queue.length > 0) {
                            queue.push(data);
                            if(typeof options.log === 'function'){
                                options.log( ['SourceBuffer',{ QUEUE:data.length }] )
                            }
                        } else {
                            buffer.appendBuffer(data);
                        }
                    }
                    if(typeof options.log === 'function'){
                        options.log( ['EBML', headers[0] ] )
                    }
                
            })
            stream.on('end',function(){
                READY = false
                videoElement.pause()
                videoElement.src = ''
                if(buffer.updating){
                    buffer.addEventListener('updateend', function(e) { 
                        mediaSource.endOfStream()
                    })  
                }else if (mediaSource.readyState === 'open'){
                    mediaSource.endOfStream()
                }
            })
            stream.on('error', function(e){
                if(typeof options.log === 'function'){
                    options.log( ['stream', e ] )
                }
            })
            return mediaSource
    }
    function createMediaMonitor(options){
        if(!options) {
            options = {};
        }
        var mediaElement = options.mediaElement
        var self = {
            canvas : document.createElement('canvas')
        }
        var context = self.canvas.getContext('2d');
        //options.mirror === true
            context.translate(self.canvas.width, 0);
    		context.scale(-1, 1); 
    	    self.renderInterval = setInterval(function() {
        			try {
        			    
        				context.drawImage(mediaElement, 0, 0, mediaElement.width, mediaElement.height);
        			} catch (e) {
        				consoel.log(e)
        			}
    		    }, 100);
    		return self;
    }
    function createMediaEncoder(options){
        var mediaElement = createMediaElement(options);
        var mediaMonitor = createMediaMonitor({ mediaElement: mediaElement })
        var self = {
            mediaElement:mediaElement,
            canvas:mediaMonitor.canvas,
            on_data:function(data){
                
            }
        }
        var constraints     = options.constraints || { video: true, audio:true }
        var mimeType        = options.mimeType || 'video/webm; codecs="vp8, opus"'
        var interval        = options.interval || 100
        var mediaEncoder;    
        var initSegment     = ''
        function insertInitSegment(binaryString){
            var headers = parseEBML(binaryString)
            var Cluster = headers[1].filter(function(element){
                return(element.path.indexOf('Cluster') > -1 && element.value === 'Master Element')
            })[0]
            var EBML = headers[1].filter(function(element){
                return(element.path.indexOf('EBML') > -1 && element.value === 'Master Element')
            })[0]
            if(typeof options.log === 'function'){
                options.log(['EBML', headers[0]])
            }
            if(EBML && Cluster){
                //capture initSegment for streaming
                initSegment = binaryString.substring(0,Cluster.start)
                
            }else if(Cluster){
                //add init headers evey cluster for streaming
                //possible to do adaptive streaming with updated initSegment
                var _end = binaryString.substring(0,Cluster.start)
                var _beg = binaryString.substring(Cluster.start)
                binaryString = _end + initSegment + _beg
            }
            return binaryString
        }
        function createEncoder(mediaStream){
            mediaEncoder            = new MediaRecorder(mediaStream);
            mediaEncoder.stream     = mediaStream;
            mediaEncoder.mimeType   = mimeType ;//'video/webm';
            mediaEncoder.ondataavailable = function (e) {
                BLOB2BS(e.data, function(binaryString){
                    binaryString = insertInitSegment(binaryString)
                    self.on_data(BS2U8(binaryString))
                })
            }
            mediaEncoder.start()
            mediaEncoder.dataInterval = setInterval(function(){
                mediaEncoder.requestData()
            } , interval)
        }
        function onMediaSuccess(mediaStream){
            self.mediaElement.addEventListener('loadedmetadata', function() {
                //createEncoder(mediaStream)
                self.mediaElement.play(mediaStream);
            });
            self.mediaElement.src = URL.createObjectURL(mediaStream);
        }
        self.start = function(){
            navigator.getUserMedia( constraints, onMediaSuccess, options.log||function noop(){}); 
        }
        self.end = function(){
                clearInterval(mediaMonitor.renderInterval);
                clearInterval(mediaEncoder.dataInterval);
                mediaEncoder.stop();
                mediaEncoder
                    .stream
                    .getTracks()
                    .forEach(function(track){ 
                        track.stop()
                        
                    })
                MediaElement.pause()
                MediaElement.src = ''
            }
        return self
        

              
    }
    this.createMediaElement = createMediaElement
    this.createMediaSource = createMediaSource
    this.createMediaMonitor = createMediaMonitor
    this.createMediaEncoder = createMediaEncoder
    return this
}())