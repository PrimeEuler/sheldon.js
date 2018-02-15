var stdioe      = require('./stdioe');
var lineman     = require('./lineman.v2');
var ansi        = require('ansi');
var util        = require('util');
function chunkString(str, length) {
  return str.match(new RegExp('.{1,' + length + '}', 'g'));
}
function vty(){
    var epoch   = process.uptime();
    var io      = new stdioe()
        //vty setup
        io.stdout.setVTYMode = function(value) {
              io.stdout.isVTY = !!value;
              if(io.stdout.isVTY){
                  io.stdout.columns  = 80
                  io.stdout.rows = 24
              }
              
        };
        io.stdout.setMouseMode = function(value) {
              io.stdout.isMouse = !!value;
              if(io.stdout.isMouse){
                io.stdout.write('\x1b[?1000h')
              }else{
                io.stdout.write('\x1b[?1000l');
              }
              
        };
        io.stdout.resize = function(vty){
            io.stdout.columns  = vty.columns
            io.stdout.rows     = vty.rows
            io.stdout.emit('resize')
        }
        io.stdout.setVTYMode(true)
        io.stdout.setMouseMode(false)
        io.stdout.on('resize',function(){
            line.size.columns = io.stdout.columns
            line.size.rows = io.stdout.rows
        })
        //ansi line interface
    var line  = {
        io:io,
        Reader:new lineman( io.stdin ),
        Writer:new ansi( io.stdout, { enabled:true, buffering:true } ),
        type:'asni',
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
        size:{
            columns:80,
            rows:24,
        },
        tunnel:function(input,output){
            line.Reader.listening = false
            io.stdin.pipe(input)
            output.pipe(io.stdout,{ end:false })
            output.on('close',function(){
                line.Reader.listening = true
                io.stdin.resume()
            })
        },
        echo: function(buffer){
            line.Writer
                .horizontalAbsolute(0)
                .eraseLine()
                .reset()
                .bold()
                [ line.prompt.color ]()
                .write( line.prompt.value )
                [ line.caret.color ]()
                .write( line.caret.value )
                .reset()
                [ line.line.color ]()
                .write( buffer.line )
                .back( buffer.line.length  - buffer.cursor )
                .reset()
                .flush()
                .buffer();
        },
        prettyPrint:function(buffer){
            line.Writer
                .write( '\r\n' + util.inspect(buffer,false, 10, true)  + '\r\n' )
                .flush()
                .buffer();
        }
    }
        //ansi line echo
        line.Reader.on('read', function(buffer){
            
            //HACK FOR cursor.back issue
            //line.value
            //line.cursor
            //
            buffer.line+=' ';
            //fix long rows
            var prompt  = line.prompt.value + line.caret.value;
            var chunk   = prompt + buffer.line;
            var lines   = chunkString(chunk, io.stdout.columns )
            if(lines.length -1 > 0){
                line.Writer
                    .horizontalAbsolute(0)
                    .eraseLine()
                    .up(lines.length -1 )
                
                //buffer.line = lines.join('\r\n').replace(prompt,'')
            }
            //end fix
            line.echo(buffer)

        })
        //vty kill
        line.Reader.on('ctrl-c', function(){
            epoch = process.uptime() - epoch
            if( epoch <= 0.5){
                line.io.exit();
            }
            epoch = process.uptime()
        });
        //init
        line.Reader.set( {  line: '', cursor: 0  },true );
    
    return line
    
}
module.exports   = vty;