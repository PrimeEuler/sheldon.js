var stream      = require('stream');
var Buffer      = require('buffer/').Buffer;
var keypress    = require('keypress');
var ansi        = require('ansi');
var lineman     = require('./lineman.js');
var minimist    = require('minimist');
var util        = require('util');
var _           = require('lodash');
var uuidV4      = require('uuid/v4');

function sheldon(){
    var stdioe      = new stream.Duplex({
        allowHalfOpen:false,
        read: function(size) {  },
        write:function(chunk, encoding, callback) {
            stdin.push(chunk);
            callback()
        }
    });
    var stdin       = new stream.Readable({ read:function(size) {} });
    var stdout      = new stream.Writable({
        write:function(chunk, encoding, callback) {
            stdioe.push(chunk);
            callback()
        }
    });
    var stderr      = new stream.Writable({
        write:function(chunk, encoding, callback) {
            stdioe.push(chunk);
            callback()
        }
    });
    var ansiReader  = new lineman(  stdin , {tty:true} );
    var ansiWriter  = new ansi( stdout, { enabled:true, buffering:true } );
    var settings    = {
        line:{
            color:'cyan'
        },
        caret:{
            color:'magenta',
            value:'>'
        },
        prompt:{
            color:'green',
            value:'sheldon'
        },
        mouse:false,
        rows:24,
        cols:80,
        repl:'ansi',
        context:{},
    };
    var regex       = {
        WORDS           : /"[^"]*"|[^\s"]+/g,
        ASN1_COMMENTS   : /--([^\n\r-]|-[^\n\r-])*(--|-?[\n\r])/g,
        JS_COMMENTS     : /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
        JS_PARAMETERS   : /([^\s,]+)/g,
        IpAddress       : /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
        Hostname        : /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
        Hostname952     : /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/
    }
    var self        = stdioe;
        self.id = uuidV4()
        self.context={}
        self.syntax = {
            SimpleSyntax:
                { CHOICE:
                   [ [ 'integer-value', [ 'INTEGER', { min: -2147483648, max: 2147483647 } ] ],
                     [ 'string-value', [ 'OCTET STRING', { SIZE: { min: 0, max: 65535 } } ] ],
                     [ 'objectID-value', 'OBJECT IDENTIFIER' ] ] },
            ApplicationSyntax:
                { CHOICE:
                   [ [ 'ipAddress-value', 'IpAddress' ],
                     [ 'counter-value', 'Counter32' ],
                     [ 'timeticks-value', 'TimeTicks' ],
                     [ 'arbitrary-value', 'Opaque' ],
                     [ 'big-counter-value', 'Counter64' ],
                     [ 'unsigned-integer-value', 'Unsigned32' ] ] },
            IpAddress:
                { tag: { class: 'APPLICATION', number: 0 },
                  definition: 'IMPLICIT',
                  type: [ 'OCTET STRING', { SIZE: 4 } ] },
            Counter32:
                { tag: { class: 'APPLICATION', number: 1 },
                  definition: 'IMPLICIT',
                  type: [ 'INTEGER', { min: 0, max: 4294967295 } ] },
            TimeTicks:
                { tag: { class: 'APPLICATION', number: 3 },
                  definition: 'IMPLICIT',
                  type: [ 'INTEGER', { min: 0, max: 4294967295 } ] },
            Opaque:
                { tag: { class: 'APPLICATION', number: 4 },
                  definition: 'IMPLICIT',
                  type: 'OCTET STRING' },
            Counter64:
                { tag: { class: 'APPLICATION', number: 6 },
                  definition: 'IMPLICIT',
                  type: [ 'INTEGER', { min: 0, max: 18446744073709552000 } ] },
            Unsigned32:
                { tag: { class: 'APPLICATION', number: 2 },
                  definition: 'IMPLICIT',
                  type: [ 'INTEGER', { min: 0, max: 4294967295 } ] }
        }
        self.schemas = {
            DisplayString:
                { 'TEXTUAL-CONVENTION':
                   { 'DISPLAY-HINT': [ '255a' ],
                     STATUS: 'current',
                     DESCRIPTION:
                      [ 'Represents textual information taken from the NVT ASCII',
                        'character set, as defined in pages 4, 10-11 of RFC 854.',
                        '',
                        'To summarize RFC 854, the NVT ASCII repertoire specifies:',
                        '',
                        '- the use of character codes 0-127 (decimal)',
                        '',
                        '- the graphics characters (32-126) are interpreted as',
                        'US ASCII',
                        '',
                        '- NUL, LF, CR, BEL, BS, HT, VT and FF have the special',
                        'meanings specified in RFC 854',
                        '',
                        '- the other 25 codes have no standard interpretation',
                        '',
                        '- the sequence \'CR LF\' means newline',
                        '',
                        '- the sequence \'CR NUL\' means carriage-return',
                        '',
                        '- an \'LF\' not preceded by a \'CR\' means moving to the',
                        'same column on the next line.',
                        '',
                        '- the sequence \'CR x\' for any x other than LF or NUL is',
                        'illegal.  (Note that this also means that a string may',
                        'end with either \'CR LF\' or \'CR NUL\', but not with CR.)',
                        '',
                        'Any object defined using this syntax may not exceed 255 characters in length.' ],
                     SYNTAX: [ 'OCTET STRING', { SIZE: { min: 0, max: 255 } } ] } },
            sysName:
                { 'OBJECT-TYPE':
                   { SYNTAX: [ 'DisplayString', { SIZE: { min: 0, max: 255 } } ],
                     'MAX-ACCESS': 'read-write',
                     STATUS: 'current',
                     DESCRIPTION:
                      [ 'An administratively-assigned name for this managed',
                        'node.  By convention, this is the node\'s fully-qualified',
                        'domain name.  If the name is unknown, the value is',
                        'the zero-length string.' ],
                     '::=': [ 'system', 5 ] } },
            system:
                { 'OBJECT IDENTIFIER': { '::=': [ 'mib-2', 1 ] } }
        }


        //cli
        self.interpreter = {
            lexer:function(lineBuffer){
                var leading     = lineBuffer.line.slice(0, lineBuffer.cursor )
                var words       = leading.match(regex.WORDS)||[];
                var space       = leading.lastIndexOf(' ')===leading.length-1;
                var index       = words.length - (space?0:1);
                    words       = lineBuffer.line.match(regex.WORDS)||[];
                var tokens      = self.interpreter.tokenize(words)
                    if(tokens.length === 0){ tokens[0]={ type:'<target>', word:''} }
                    if(typeof tokens[index] === 'undefined'){ tokens[index] = { type:'<value>', word:'' }  }
                return { tokens:tokens, index:index }
                
            },
            tokenize:function(words){
                var tokens      = [];
                for (var i = 0; i < words.length; i++ ){
                    var w = words[i];
                    var t = '<value>';
                    if( w.indexOf('--')===0){
                        t   = '<key>'
                        w   = w.replace('--','')
                    }else if(w.indexOf('-')===0){
                        t   = '<key>'
                        w   = w.replace('-','')
                    }else if(i===0){
                        t   = '<target>'
                    }
                    tokens.push({ type:t, word:w })
                }
                return tokens
            },
            parse:function(lineBuffer){
                var lexer   = self.interpreter.lexer(lineBuffer);
                var tokens  = lexer.tokens  
                var index   = lexer.index
                var structure = { target:tokens[0].word , varBinds:[] , index:index }
                var target  =  _.get( self.context, structure.target  )
                
                
                    if(typeof target === 'function'){
                        var keys = self.interpreter.getParameters(target)||[]
                            for(var k=0;k<keys.length;k++){
                                for(var t=1;t<tokens.length;t++){
                                    if( tokens[t-1].type === '<key>' && 
                                        tokens[t-1].word === keys[k] && 
                                        tokens[t].type === '<value>'){
                                        structure.varBinds[k]={ key:keys[k] , val: tokens[t].word }
                                    }
                                }
                                
                            }
                        var key = '';
                        var val = '';
                        var pairs = [];
                        // typeof = object | string | integer
                        //if object => traverse object tree
                        if(tokens[index].type === '<value>' && tokens[index-1].type === '<key>'){
                            //key value pair
                            val = tokens[index-0].word
                            key = tokens[index-1].word
                            
                        }
                        else
                        if(tokens[index].type === '<value>'){
                            var k = 0;
                            val = tokens[index].word
                            //just value, must find key
                            for(var t=1;t<tokens.length;t++){
                                var i = keys.indexOf(tokens[t].word)
                                if(tokens[t].type ==='<key>' && i > -1){
                                    keys.splice(i,1)
                                }
                                if(t!==index &&  tokens[t].type==='<value>' && tokens[t-1].type!=='<key>'){
                                    k++;
                                }
                            }
                            key = keys[k]
                            
                        }
                        else
                        if(tokens[index].type === '<key>'){
                            //just key. next word is value
                            key = tokens[index].word
                        }
                        
                        structure.varBinds.push({key:key,val:val})
                        //structure.varBinds[index]  = {key:key,val:val}
                        console.log(util.inspect(structure))
                    }
                
                
            },
            getParameters:function(func){
                var p = func.toString().replace(regex.JS_COMMENTS, '');
                    p = p.slice( p.indexOf('(')+1, p.indexOf(')') ).match(regex.JS_PARAMETERS);
                return p
            }
            
        }

        self.PARAMETERS = {
            endpoint:['nethack.alt.org','towel.blinkenlights.nl','127.0.0.1:8023'],
            options : {
                log:['boolean'],
                id:['string'],
                name:{
                    first:['string',null],
                    last:['string',null]
                },
                sex:{
                    emum:['male','female','trans']
                }
                
        
            }
        }
        self.util   = {
            parameters:function(data){
                data = data.replace(regex.JS_COMMENTS, '');
                data = data.slice(data.indexOf('(')+1, data.indexOf(')')).match(regex.JS_PARAMETERS);
                return(data)
            },
            arguments:function(structure, parameters){
                var argArray    = [];
                var pIndex      = 0;
                var parameter   = parameters[pIndex];
                for(pIndex = 0; pIndex < parameters.length; pIndex++ ){
                    parameter = parameters[pIndex];
                    if(typeof structure._[pIndex] != 'undefined'){
                        argArray[pIndex] = structure._[pIndex]
                    } 
                    if(typeof structure[parameter] != 'undefined'){
                        argArray[pIndex] = structure[parameter]
                    }
                    if(typeof  argArray[pIndex] === 'undefined'){
                         argArray[pIndex] = undefined
                    }
                    
                }
                return argArray
            },
            jsComplete:function($path,$object){
                function matchKeys(object,string){
                    //console.log(object)
                    if(typeof object != 'object' || object === null)return[];
                    var canidates = [];
                    function startsWith(value){
                        if(typeof value === 'string'){
                            return value.indexOf(string)===0
                        }else{
                            return false
                        }
                        
                    }
                    try{
                        //var keys = Array.isArray(object)?object:Object.keys(object)
                        //keys=keys?keys:[];
                        var keys = Object.keys(object) || []
                        canidates = keys.filter(startsWith);
                    }catch(e){
                        console.log(e)
                    }
                    return canidates;
                    
                }
                function longestInCommon(candidates, index) {
                    var i, ch, memo
                    do {
                        memo = null
                        for (i = 0; i < candidates.length; i++) {
                            ch = candidates[i].charAt(index)
                            if (!ch) break
                            if (!memo) memo = ch
                            else if (ch != memo) break
                        }
                    } while (i == candidates.length && ++index)
            
                    return candidates[0].slice(0, index)
                }
                function _completer(path,object){
                    var hops        = (typeof path === 'string')? path.split('.',-1) : [];
                    var hop         = -1;
                    var nextHops    = [];
                    var found       = false;
                    var isHop       = false;
                    var isLast      = false;
            
                    while(nextHops.length === 0 && hop < hops.length){
                            hop ++;
                            path        = hops.slice(0, hop).join('.');
                            nextHops    = matchKeys(  _.get(object, path) || object , hops[hop])
                            isHop       = nextHops.indexOf(hops[hop])>-1;
                            isLast      = (hop === hops.length-1);
            
                            if (nextHops.length > 1 ){
                                hops[hop] = longestInCommon(nextHops, hops[hop].length);
                                path = hops.slice(0, hop+1).join('.');
                                found = true;
                            }
                            
                            if (nextHops.length > 1 && isHop && !isLast){
                                nextHops = [hops[hop]];
                            }
            
                            if (nextHops.length === 1 ){
                                    hops[hop] = nextHops.shift();
                                    path = hops.slice(0, hop+1).join('.');
                                    found = true
                            }
                            found = found? found : !(!_.get(object, path));
            
                    }
                    if(!found){ nextHops = Object.keys(object) }
                    
                    return ({ path:path, nextHops: nextHops })
                    
                }
                return _completer($path,$object)
            },
            argObject:function(structure, parameters){
                var argObject   = {};
                var argArray    = [];
                var pIndex      = 0;
                var parameter   = parameters[pIndex];
                for(pIndex = 0; pIndex < parameters.length; pIndex++ ){
                    parameter = parameters[pIndex];
                    if( typeof structure[parameter] != 'undefined' &&
                        typeof argObject[parameter] === 'undefined'){
                        argObject[parameter] = structure[parameter];
                    }else
                    if(typeof argObject[parameter] === 'undefined')
                    {
                        argObject[parameter] = structure._.shift()
                    }
                    if(typeof argObject[parameter] === 'undefined'){
                        argObject[parameter] = undefined
                    }
                    
                }
                return argObject
                //return argArray
            },
            promptArgs:function(structure, parameters, cb){
                var argObject   = self.util.argObject(structure, parameters)
                var pIndex      = 0;
                var parameter   = parameters[pIndex];
                var _$prompt    = settings.prompt.value;
                var _$caret     = settings.caret.value;
                var Arguments   = [];
                function ask(){
                    if(parameter === 'shell'){
                        argObject[parameter] = self
                    }
                    if(parameter==='callback' || parameter==='cb' ){
                        if(typeof argObject[parameter] === 'undefined'){
                            argObject[parameter] = REPL.PRINT[settings.repl]
                        }
                    }
                    if(typeof argObject[parameter] === 'undefined' && pIndex < parameters.length){
                        //self.tabObject = self.PARAMETERS[parameter]||{};
                        settings.prompt.value  = parameter;
                        settings.caret.value   = ':'
                        settings.callback      = callback;
                        //PROMPT
                        ansiWriter.write( '\r\n' ).flush().buffer();
                        ansiReader.set( {  line: '', cursor: 0  },true );
                        
                    }else if(pIndex < parameters.length -1){
                        pIndex++;
                        parameter = parameters[pIndex]
                        ask()
                    }else{
                        
                        settings.prompt.value  = _$prompt;
                        settings.caret.value   = _$caret;
                        settings.callback      = undefined;
                        
                        parameters.forEach(function(_parameter){
                            Arguments.push(argObject[_parameter]) 
                        })
                        
                        if(Arguments.length === 0){
                            Arguments = structure._;
                        }
                        cb( Arguments )
                        
                    }
                }
                function callback(line){
                    if(line.length === 0){ line = undefined }
                    
                    if(typeof argObject[parameter] === 'undefined' ){
                        
                        argObject[parameter] = line;
                    }else{
                        pIndex++;
                        parameter = parameters[pIndex]
                    }
                    ask()
                }
                ask()
            },
            lexer:function(buffer){
                var leading     = buffer.line.slice(0, buffer.cursor )
                var words       = leading.match(regex.WORDS)||[];
                var space       = leading.lastIndexOf(' ')===leading.length-1;
                var index       = words.length - (space?0:1);
                    words       = buffer.line.match(regex.WORDS)||[];
                var tokens      = self.util.tokenize(words)
                if(tokens.length === 0){ tokens[0]=['','<path>'] }
                if(typeof tokens[index] === 'undefined'){
                    tokens[index] = ['','<argument>']        
                }
                return {tokens:tokens,index:index}
            },
            tokenize:function(words){
                var tokens      = [];
                for (var i = 0; i < words.length; i++ ){
                    var w = words[i];
                    var t = '<argument>';
                    if( w.indexOf('--')===0){
                        t   = '<parameter>'
                        w   = w.replace('--','')
                    }else if(w.indexOf('-')===0){
                        t   = '<param>'
                        w   = w.replace('-','')
                    }else if(i===0){
                        t   = '<path>'
                    }
                    tokens.push([w,t])
                }
                return tokens
            },
            setTabObject:function(buffer){
                //var structure = minimist(buffer.line.match(regex.WORDS)||[])
                //console.log(structure)
                /*
                *   buffer = <path>_<parameter>||_<argument>
                                    <path>||_<value>
                    
                    scalar vs tabular 
                *
                *
                *
                */
                
                var lexer   = self.util.lexer(buffer);
                var tokens  = lexer.tokens;
                var index   = lexer.index;
                var path    = tokens[0][1]==='<path>'?tokens[0][0]:'';
                var object  = _.get(self.context, path)
                if( typeof settings.callback === 'undefined' ){
                    self.tabObject = self.context
                }
                switch(typeof object){
                    case 'function':
                        var Parameters  = self.util.parameters(object.toString())||[];
                        //getParameterTypes(Parameters) => ['options','object'],['endpoint','string']
                        var parameter   = undefined
                        //current token is an value after a key 
                        if( tokens[index][1]    === '<argument>' && tokens[index-1][1]  === '<parameter>' ){
                            parameter = tokens[index-1][0]
                        } else 
                        //current token is a value , use key index
                        if( tokens[index][1]    === '<argument>' ){
                            var p = 0;
                            for(var t = 0; t < tokens.length; t++){
                                var i =  Parameters.indexOf(tokens[t][0]) ;
                                //Named parameter
                                //Remove from list
                                if( tokens[t][1]==='<parameter>' && i > -1){
                                    Parameters.splice(i,1)
                                }
                                //Indexed parameter
                                //Skip it
                                if(t!==index &&  tokens[t][1]==='<argument>' && tokens[t-1][1]!=='<parameter>'){
                                    p++;
                                }
                            }
                            //key index = p 
                            parameter = Parameters[p];
                        } else
                        if( tokens[index][1]    === '<parameter>'){
                            if(tokens[index][0].length > 0){
                                //self.tabObject =  self.PARAMETERS
                                var match = _.intersectionWith(Object.keys(self.PARAMETERS), Parameters, _.isEqual);
                                //console.log(match.length ,Parameters.length )
                                if(match.length === Parameters.length){
                                    self.tabObject =  self.PARAMETERS
                                }else{
                                    self.tabObject =  _.zipObject(Parameters,Parameters)
                                }
                            }else{
                                self.tabObject =  _.zipObject(Parameters,Parameters)
                            }
                            
                            
                        }
                        
                        //console.log(tokens[index], parameter,Parameters)
                        if( typeof parameter    !== 'undefined'){
                             self.tabObject = _.get(self.PARAMETERS, parameter)||self.PARAMETERS[parameter]
                            //self.tabObject =  _.get(self.PARAMETERS, parameter)||self.PARAMETERS
                            //self.tabObject = self.PARAMETERS
                            //self.tabObject = self.PARAMETERS[parameter]
                        }
                        if( typeof self.tabObject === 'undefined'){
                            self.tabObject = {}
                        }
                        
                        break;
                    default:
                        break;
                    
                }
                //console.log(object, self.tabObject)
            },
            _tabComplete:function(buffer){
            },
            tabComplete:function(buffer){
                var leading     = buffer.line.slice(0, buffer.cursor )
                var trailing    = buffer.line.slice(buffer.cursor)
                var Lwords      = leading.match(regex.WORDS)||[];
                var Twords      = trailing.match(regex.WORDS)||[];
                var path        = Lwords.pop();
                var parameter   = false
                if(path && path.indexOf('--') === 0){
                    parameter = true
                    path = path.replace('--','')
                }
                
                var complete    = self.util.jsComplete(path, self.tabObject);
                //console.log(complete,self.tabObject)
                if(trailing.indexOf(' ')===0 || leading.lastIndexOf(' ')===leading.length){
    
                }else{
                    trailing = trailing.replace(Twords[0],'')
                }
                if(parameter){
                    //complete.path = '--' + complete.path
                }
                leading         = leading.replace( new RegExp( path + '$'), complete.path )
                buffer.line     = leading + trailing
                buffer.cursor   = leading.length;
                REPL.PRINT[ settings.repl] ( complete.nextHops )

                ansiReader.set(buffer,true);
            },
            get:function(path){
                return _.get(self.context,path)
            },
            set:function(path, value){
                _.set(self.context,path,value)
                return _.get(self.context,path)
            }
        }
    var REPL = {
        READ: {
            ansi:function(data,callback){
                if( typeof settings.callback != 'undefined' ){
                    settings.callback(data,callback)
                    return;
                }
                var structure = minimist(data.match(regex.WORDS)||[]) 
                /*
                
                {
                    _:['network.sio.connect'],
                    username:'Jerble',
                    password:'dfjlhsdf324,
                    options:{
                        shebang:'/bin/bash',
                        context:{
                            
                        }
                    }

                }
                
                
                
                
                */
                if( typeof callback === 'function'){
                    callback( structure )
                }else{
                    return structure
                }
            }
        },
        EVAL: {
            ansi:function(data,callback){
                var structure       = data;
                var path            = structure._.shift();
                    path            = self.util.jsComplete(path,self.context).path
                var object          = _.get(self.context, path)
                    self.tabObject  = self.context
                    switch(typeof object){
                        case 'function':
                            var parameters = self.util.parameters(object.toString())||[]
                            self.util.promptArgs( structure , parameters, apply )
                            function apply(Arguments){
                                var result  
                                try{
                                    var ths = (typeof window === 'undefined')?object:window;
                                    result  = object.apply(ths, Arguments)
                                }catch(e){
                                    result  = e
                                }
                                self.tabObject  = self.context
                                callback( result )
                            }
                            break;
                        default:
                            if(structure._[0]==='='){
                                 _.set(self.context, path , structure._[1] )
                                 object = _.get(self.context, path)
                            }
                            callback ( object );
                            break;
                        
                    }
                
            }
        },
        PRINT:{
            ansi:function(data){
                ansiWriter
                    .write( '\r\n' + util.inspect(data,false, 10, true)  + '\r\n' )
                    .flush()
                    .buffer();
            }
        },
        LOOP:{
            ansi:function(){
                ansiReader.set( {  line: '', cursor: 0  },true );
            }
        },
        ASK:{
            ansi:function(question,callback){
                
            }
        }
    }
        self.REPL = REPL
        self.tabObject = self.context;
        self.settings = {
            echo:'off',
            listening:true
        };
        stdioe.on('pipe',function(source){
            var kill = function(){};
            if(source===process.stdin){
                kill = process.exit
                process.stdout.on('resize',function(){
                    stdout.columns  = process.stdout.columns
                    stdout.rows     = process.stdout.rows
                    stdout.emit('resize')
                })
            }else{
                source.setRawMode = function(value) {
                      source.isRaw = !!value;
                };
            }
            source.setRawMode(true)
            stdioe.exit = function(){
                stdioe.end();
                source.setRawMode(false);
                source.end();
                kill();
            };
            REPL.LOOP[settings.repl]();
        }) 
        stdout.on('resize',function(){
            console.log(stdout.columns,stdout.rows)
        })
        /*
        stdin.on('keypress', function(ch,key){
            console.log(ch,key)
            self.settings.listening? ansiReader.keypress(ch,key):null ;
        })
        */
        ansiReader.on('echo', function(buffer){
                self.util.setTabObject(buffer)
                self.interpreter.parse(buffer)
                if(self.settings.echo==='on'){
                    REPL.READ.ansi(buffer.line, REPL.PRINT.ansi )
                }
                //HACK FOR cursor.back issue
                buffer.line+=' ';
                ansiWriter
                    .horizontalAbsolute(0)
                    .eraseLine()
                    .reset()
                    .bold()
                    [ settings.prompt.color ]()
                    .write( settings.prompt.value )
                    [ settings.caret.color ]()
                    .write( settings.caret.value )
                    .reset()
                    [ settings.line.color ]()
                    .write( buffer.line )
                    .back( buffer.line.length  - buffer.cursor )
                    .reset()
                    .flush()
                    .buffer();
            
            
        })
        ansiReader.on('ctrl-c',function(){
            stdioe.exit();
        }); 
        ansiReader.on('tab',   function(buffer){
            self.util.tabComplete(buffer);
        });
        ansiReader.on('line', function(data){
                self.tabObject      = self.context;
                if(data.length===0){
                    ansiWriter.write('\r\n').flush().buffer();
                    REPL.LOOP[settings.repl](    );
                    return
                }
                REPL.READ [settings.repl](data, function(data){
                REPL.EVAL [settings.repl](data, function(data){
                REPL.PRINT[settings.repl](data);
                REPL.LOOP [settings.repl](    );     });     });


        }); 
    
        self.stdin = stdin
        self.stdout = stdout
    
        return self
}
module.exports.shell    = sheldon;
module.exports.stream   = stream;
module.exports.Buffer   = Buffer;
module.exports._        = _;
module.exports.util     = util;
module.exports.uuidV4   = uuidV4;

//process.stdin.pipe(new sheldon()).pipe(process.stdout)
