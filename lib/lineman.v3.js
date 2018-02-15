require('./startswith');
var ansi        = require('ansi');
var linebuffer  = require('./linebuffer');
var _           = require('lodash');
var util        = require('util'),
    inherits    = util.inherits,
    EventEmitter = require('events');
    inherits(lineman, EventEmitter)
function lineman(){
    var self = this;

    self.createInterface = function(options){
        var cli          = new EventEmitter()
        cli.input        = options.input || null
        cli.output       = options.output || null
        cli.terminal     = options.terminal || null
        cli.historySize  = options.historySize || null
        cli.crlfDelay    = options.crlfDelay || null
        cli.removeHistoryDuplicates  = options.removeHistoryDuplicates || null
        
        
        cli.state = { 
            columns:80 , 
            rows:24 ,
            line:{
                color:'cyan'
            },
            caret:{
                color:'magenta',
                value: options.caret || '>'
            },
            prompt:{
                color:'green',
                value: options.prompt || ''
            },
            query:false,
            proxy:false
            
        }
        cli.store = {
            prompt:{
                value:'',
                history:[],
                index:0,
            },
            caret:{
                value:''
            },
            callback:function(){},
        }
        cli.mask  = ['password']
        cli.mandatory = ['username']
        cli.syntax = {
            'string':   function(string){
                    return string.toString()
                },
            'integer':  function(string){
                return parseInt(string)
            },
            'json':     function(string){
                try{
                    return JSON.parse(string)
                }catch(e){
                    return e
                }
            },
            'boolean':  function(string) {
                var bool;
                bool = ( function() {
                    switch (false) {
                        case string.toLowerCase() !== 'true':
                            return true;
                        case string.toLowerCase() !== 'false':
                            return false;
                    }
                })();
                if (typeof bool === "boolean") {
                    return bool;
                }
                    return typeof bool;
            }
        }
        
        
        cli.output.setTTYMode(true)
        cli.output.setMouseMode(false)
        cli.output.on('resize', function(){
            cli.state.columns  = cli.output.columns
            cli.state.rows     = cli.output.rows
        })
        
        cli.linebuffer   = new linebuffer( cli.input )
        cli.ansi         = new ansi( cli.output, { enabled:true, buffering:true } )

        cli.treeSearch   = function(tree,path){
            var nodes       = (typeof path === 'string')? path.split('.',-1) : [];
            var n           = -1
            var siblings    = []
            var subTree     = {}
            var defined     = false;
            var isNode      = false;
            var isLast      = false;

            function startsWith(child){
                 return child.startsWith( nodes[n] )
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
            // walk the path of nodes
            while(siblings.length === 0 && n < nodes.length){
                n++;
                path        = nodes.slice(0, n).join('.');
                subTree     =  _.get(tree, path);
                defined     =  _.has(tree, path);
                subTree     = subTree || tree
                //step back to parent node branch if subTree is undefined
                path        = defined? path : nodes.slice(0, n-1).join('.');
                siblings    = Object.keys(subTree).filter( startsWith )//node[n]
                isNode      = siblings.indexOf( nodes[n] ) > -1;
                isLast      = ( n === nodes.length-1 );
                if( siblings.length > 1 ){
                    nodes[n] = longestInCommon(siblings, nodes[n].length);
                    path   = nodes.slice(0, n+1).join('.');
                }
                if( siblings.length > 1 && isNode && !isLast ){
                    siblings = [nodes[n]]
                }
                if( siblings.length === 1 ){
                    nodes[n] = siblings.shift();
                    path   = nodes.slice(0, n+1).join('.');
                }
            }
            return { path:path, siblings:siblings, defined:defined, isNode:isNode, isLast:isLast }
        }
        cli.proxy        = function(input,output){
                cli.linebuffer.listening = false
                cli.input.pipe(input)
                output.pipe(cli.output,{ end:false })
                cli.state.proxy = output
                output.on('close',function(){
                    cli.linebuffer.listening = true
                    cli.state.proxy = false
                    cli.input.resume()
                })
            }
        cli.echo         = function(buffer){
                        buffer.line+=' ';
                        cli.ansi 
                            .horizontalAbsolute(0)
                            .eraseLine()
                            .reset()
                            .bold()
                            [ cli.state.prompt.color ]()
                            .write( cli.state.prompt.value )
                            [ cli.state.caret.color ]()
                            .write( cli.state.caret.value )
                            .reset()
                            [ cli.state.line.color ]()
                            .write( buffer.line )
                            .back( buffer.line.length  - buffer.cursor )
                            .reset()
                            .flush()
                            .buffer();
        }
        cli.prettyPrint  = function(buffer){
            if(typeof buffer === 'undefined'){  return }
            cli.ansi
                .write(  '\r\n' + util.inspect(buffer,false, 10, true) + '\r\n'  )
                .flush()
                .buffer();
        }
        cli.linefeed     = function(){
            cli.ansi.write( '\r\n'  ).flush().buffer();
        }
        cli.setPrompt    = function(prompt,caret){
            if(!cli.linebuffer.cache[prompt]){
                cli.linebuffer.cache[prompt] = {
                    history:[],
                    index:0
                }
            }
            cli.linebuffer.id = prompt;
            cli.state.prompt.value   = prompt
            cli.state.caret.value    = caret || '>'
        }
        cli.savePrompt   = function(){
            cli.store.prompt.value   = cli.state.prompt.value
            cli.store.caret.value    = cli.state.caret.value
        }
        cli.prompt       = function(){
            cli.linebuffer.set( {  line: '', cursor: 0  },true );
        }
        cli.question     = function(query, callback){
            var index = 0;
            var answers = {}
            cli.savePrompt()
            if(typeof query === 'string'){ query = [query] }
            ask( query[index], response )
            function ask(_query, _callback){
                cli.linefeed()
                cli.store.callback       = _callback
                cli.state.query          = true
                cli.setPrompt( _query, ':' )
                cli.prompt()
            }
            function response(answer){
                
                if(answer.length ===0 && cli.mandatory.indexOf(query[index]) > -1 ){
                    ask( query[index], response )
                    return
                }
                
                answers[query[index]] = answer
                index++;
                if(index===query.length){
                    cli.store.callback = function(){};
                    cli.state.query = false
                    cli.setPrompt( cli.store.prompt.value, cli.store.caret.value )
                    callback( answers )
                    cli.prompt()
                    
                }else{
                    
                    ask( query[index], response )
                    
                }
            }
        }
        cli.completer    = function(line) {
            var buffer  = cli.linebuffer.get()
            var word    = buffer.words[ buffer.index ] || ''
            var cache   = cli.linebuffer.cache[cli.linebuffer.id]
            var objectTree = cli.state.query ? {} : cli.syntax;
            if(cli.state.query){
                cache.history.forEach(function(id){
                    objectTree[ id ]={ }
                })
            }
            var subTree = cli.treeSearch( objectTree, word.slice(0, buffer.offset) )
            buffer.words[ buffer.index ] = subTree.path
            line = buffer.words.join(" ")
            buffer.cursor = buffer.cursor - buffer.offset + buffer.words[ buffer.index ].length
            return (null, [ subTree.siblings , line, buffer.cursor]);
        
        }
        cli.completer    = options.completer || cli.completer
        
        cli.linebuffer.on('echo', function(buffer){
            if( cli.mask.indexOf( cli.state.prompt.value ) > -1 ){
                buffer.line = Array( buffer.line.length + 1 ).join( "*" )
            }
            cli.emit('echo', buffer)
            cli.echo( buffer )
        })
        cli.linebuffer.on('line', function(buffer){
            //clear line history of masked values
            if( cli.mask.indexOf( cli.state.prompt.value ) > -1 ){
                cli.linebuffer.clearLast()
            }
            if(!cli.syntax[ cli.state.prompt.value ]){
                buffer = cli.syntax.string( buffer )
            }else{
                buffer = cli.syntax[ cli.state.prompt.value ]( buffer )
            }
            

            if(cli.state.query){
                cli.store.callback( buffer )
            }else{
                if(buffer.length > 0){
                    cli.emit( 'line', buffer )
                }else{
                    cli.linefeed()
                    cli.prompt()
                }
            }
        })
        cli.linebuffer.on('tab',function(buffer){
            var complete = cli.completer(buffer.line)
            if(complete[0].length === 1){
                
            }else{
                cli.prettyPrint( complete[0] )
            }
            cli.linebuffer.set( { line:complete[1], cursor: complete[2] || complete[1].length }, true )

            cli.emit( 'tab', buffer.line )
        })
        cli.linebuffer.on('ctrl-c', function(){
            cli.emit('ctrl-c')
        })

        cli.setPrompt(options.prompt,'>')        
        return cli
    }
    return self
    
    
}
module.exports = lineman;