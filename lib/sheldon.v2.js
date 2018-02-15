var vty         = require('./vty');
var Buffer      = require('buffer/').Buffer;
var util        = require('util');
var minimist    = require('minimist');
var parser      = require('./parser')
function sheldon(){
    var lineparser = new parser()

    function evalInContext(js, context) {
        //# Return the results of the in-line anonymous function we .call with the passed context
        return function() { return eval(js); }.call(context);
    }
    //cli
    var repl = {
        context:{
            echo:function(text){
                return text
            },
            Date:Date
        },
        tab:function(buffer){
            var structure   = lineparser.lexer(buffer)
            var path        = structure.tokens[0].word
            var paths       = lineparser.searchTree(path, repl.context)
                //print nextHops
                if(paths.nextHops.length > 0 ){
                    line.prettyPrint(paths.nextHops)
                }
                //auto-complete buffer with commonPath
                buffer.line = paths.commonPath 
                buffer.cursor = paths.commonPath.length
                line.Reader.set( buffer, true );
        },
        regex:{
            WORDS           : /"[^"]*"|[^\s"]+/g,
            ASN1_COMMENTS   : /--([^\n\r-]|-[^\n\r-])*(--|-?[\n\r])/g,
            JS_COMMENTS     : /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg,
            JS_PARAMETERS   : /([^\s,]+)/g,
            IpAddress       : /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
            Hostname        : /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
            Hostname952     : /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/
        },
        buffer:'',
        read:function(buffer){
            repl.buffer = buffer
            if(buffer.line){
                repl.buffer = minimist(buffer.line.match(repl.regex.WORDS)||[])
            }
            return repl
        },
        eval:function(){
            try{
                console.log(repl.buffer)
                repl.buffer = lineparser._.get(repl.context, repl.buffer)
                
                switch(typeof repl.buffer){
                    case 'function':
                        var fnString      = repl
                                                .buffer
                                                .toString()
                                                .replace(repl.regex.JS_COMMENTS)
                        var fnParameters  = fnString
                                                .slice(fnString.indexOf('(')+1, fnString.indexOf(')'))
                                                .match(repl.regex.JS_PARAMETERS);
                        
                        break;
                    default:
                        break;
                }
                
            }catch(e){
                repl.buffer = e
                line.Reader.listening = true
                
            }
            return repl
        },
        print:function(){
            line.prettyPrint(repl.buffer)
            return repl
        },
        loop:function(){
            line.Reader.set( {  line: '', cursor: 0  },true );
            return 
        }
    }
    var line       = new vty()
        line.io.repl = repl
        line.Reader.on('read', repl.read)
        line.Reader.on('tab', repl.tab)
        line.Reader.on('line', function(text){
            repl
                .read(text)
                .eval()
                .print()
                .loop()
        })

    return line.io
}
module.exports.sheldon   = sheldon;

var _interface = new sheldon()

process.stdin.pipe(_interface).pipe(process.stdout)
process.stdout.on('resize',function(){
    _interface.stdout.resize(process.stdout)
    console.log(process.stdout.rows,process.stdout.columns)
})


