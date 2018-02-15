var stream      = require('stream');
var uuidV4      = require('uuid/v4');
//standard input output error
function stdioe(){
    var stdin       = new stream.Readable({ read:function(size) {} });
    var io          = new stream.Duplex({
        allowHalfOpen:false,
        read: function(size) {  },
        write:function(chunk, encoding, callback) {
            stdin.push(chunk);
            callback()
        }
    })
    var stdout      = new stream.Writable({
        write:function(chunk, encoding, callback) {
            io.push(chunk);
            callback()
        }
    });
    var stderr      = new stream.Writable({
        write:function(chunk, encoding, callback) {
            io.push(chunk);
            callback()
        }
    });
        //TTY stream
        stdout.setTTYMode = function(value) {
              stdout.isTTY = !!value;
              if(stdout.isTTY){
                  stdout.columns  = 80
                  stdout.rows = 24
              }
              
        };
        stdout.setMouseMode = function(value) {
              stdout.isMouse = !!value;
              if(stdout.isMouse){
                stdout.write('\x1b[?1000h')
              }else{
                stdout.write('\x1b[?1000l');
              }
              
        };
        stdout.setSize = function(size){
            stdout.columns  = size.columns
            stdout.rows     = size.rows
            stdout.emit('resize')
        }
        stdout.setTTYMode(true)
        stdout.setMouseMode(false)
    
        io.on('pipe',function(source){
            var kill    = function(){};
            if(source===process.stdin){
                kill = process.exit
            }else{
                source.setRawMode = function(value) {
                      source.isRaw = !!value;
                };
            }
            source.setRawMode(true)
            source.isTTY = true
            io.exit = function(){
                io.end();
                source.setRawMode(false);
                source.end();
                kill();
            };
        })
        io.on('close',function(){
             stdin.destroy()
             stdout.destroy()
             stderr.destroy()
        })
        io.stdin  = stdin;
        io.stdout = stdout;
        io.stderr = stderr;
        io.id     = uuidV4()
        return io
}
module.exports   = stdioe;


