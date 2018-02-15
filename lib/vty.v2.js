var stdioe      = require('./stdioe');
var lineman     = require('./lineman.v2');
var ansi        = require('ansi');
function vty(){
    var line      = new stdioe()
        //Virtual Teletype Line
        //Virtual Teminal Interface 
        line.stdout.setTTYMode = function(value) {
              line.stdout.isTTY = !!value;
              if(line.stdout.isTTY){
                  line.stdout.columns  = 80
                  line.stdout.rows = 24
              }
              
        };
        line.stdout.setMouseMode = function(value) {
              line.stdout.isMouse = !!value;
              if(line.stdout.isMouse){
                line.stdout.write('\x1b[?1000h')
              }else{
                line.stdout.write('\x1b[?1000l');
              }
              
        };
        line.stdout.resize = function(vty){
            line.stdout.columns  = vty.columns
            line.stdout.rows     = vty.rows
            line.stdout.emit('resize')
        }
        line.stdout.setTTYMode(true)
        line.stdout.setMouseMode(false)
        line.ansi = new ansi( line.stdout , { enabled:true, buffering:true } )
        
        /*
        line.stdout.on('resize',function(){
            line.size.columns = io.stdout.columns
            line.size.rows = io.stdout.rows
        })
        */
        return line
}
module.exports   = vty;