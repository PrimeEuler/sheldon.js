require('./startswith');
var ansi        = require('ansi');
var linebuffer  = require('./linebuffer');
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
        cli.completer    = options.completer || function(){return [,,]}
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
            proxy:false,
            mask:false,
            mandatory:false
            
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

        
        
        cli.output.setTTYMode(true)
        cli.output.setMouseMode(false)
        cli.output.on('resize', function(){
            cli.state.columns  = cli.output.columns
            cli.state.rows     = cli.output.rows
        })
        
        cli.linebuffer   = new linebuffer( cli.input )
        cli.ansi         = new ansi( cli.output, { enabled:true, buffering:true } )

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
                
                if(answer.length ===0 && cli.state.mandatory === true ){
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

        
        cli.linebuffer.on('echo', function(buffer){
            if( cli.state.mask === true ){
                buffer.line = Array( buffer.line.length + 1 ).join( "*" )
            }
            cli.emit('echo', buffer)
            cli.echo( buffer )
        })
        cli.linebuffer.on('line', function(buffer){
            //clear line history of masked values
            if( cli.state.mask ){
                cli.linebuffer.clearLast()
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