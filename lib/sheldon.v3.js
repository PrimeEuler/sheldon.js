var stdioe      = require('./stdioe');
var lineman     = require('./lineman.v3')();
var _           = require('lodash');
var ssh         = require('ssh2');
var iptables    = require('iptables');
var minimist    = require('minimist');


/*
    tokenization:
        (breaking a stream of characters into words)   
        word grammar 
        symbols :
            terminal    :   elementary symbols of the language 
                        ['admin' , 777 , {"foo":"bar"} , false ]
                            
            nonterminal :   syntactic variables
                        ['string','integer','json','boolean']
                        
        
    parsing (arranging the words into phrases)  :   phrase grammar
*/


function replaceAt(string, index, replace) {
  return string.substring(0, index) + replace + string.substring(index + 2 );
}

function treeSearch(tree,path){
    var nodes       = (typeof path === 'string')? path.split('.',-1) : [];
    var n           = -1
    var siblings    = []
    var subTree     = {}
    var defined     = false;
    var isNode      = false;
    var isLast      = false;
    var node        = {
        key:function(){
          return  nodes[n]
        },
        left:function(){
            return  nodes[n-1]
        },
        right:function(){
            return  nodes[n+1]
        },
    }
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

function sheldon(){
    var shell       = this;
        shell.epoch = process.uptime();
        shell.io    = new stdioe();
        
        shell.simple_syntax = {
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
        
        
        function completer(line) {
            var buffer  = shell.cli.linebuffer.get()
            //sequence
            //s-expression
            var text = buffer.line
            //natural language = sentence of words
            var lexecon = buffer.words
            var lexemes  = buffer.words
            /*
                tokenization process of demarcating and
                classifying sections of a string of input characters
            */
            /*
                A lexeme is a sequence of characters in the 
                source program that matches the pattern for 
                a token and is identified by the lexical analyzer 
                as an instance of that token
            */
            var lexeme  =  buffer.words[ buffer.index ] || ''
            
            var evaluator =  shell.cli.syntax
            /*
                A lexical token or simply token is a pair 
                consisting of a token name 
                and an optional token value.
                The token name is a category of lexical unit.
            */
            var token   = {
                name: shell.cli.linebuffer.id,//line,sheldon
                value: lexeme,//path
            }
            token.value = evaluator[ lexeme.type ] ? 
                            evaluator[ token.name ]( lexeme ) : 
                            lexeme;
            //
            //token names //class
            var identifier = token;//sheldon
            var keywords = ['string','boolean','number','object']
            var opertors = ['+', '<','=','(',')']
            var literal  = lexeme

            var cache   = shell.cli.linebuffer.cache[shell.cli.linebuffer.id]
            //search shell object tree
            //if query search cache
            var objectTree = shell.cli.state.query ? {} : shell;
            
            //binary tree = literal || identifier
            
            if(shell.cli.state.query){
                cache.history.forEach(function(id){
                    objectTree[ id ]={ }
                })
            }
            
            var subTree = treeSearch( objectTree, lexeme.slice(0, buffer.offset) )
            
           
            
            buffer.words[ buffer.index ] = subTree.path//lexem auto complete
            line = buffer.words.join(" ")
            buffer.cursor = buffer.cursor - buffer.offset + buffer.words[ buffer.index ].length
            return (null, [ subTree.siblings , line, buffer.cursor]);
        
        }

    var config      = { input:  shell.io.stdin, 
                        output: shell.io.stdout, 
                        prompt: 'sheldon',
                        caret: '>',
                        terminal: true,
                        completer:completer }
        shell.cli   = lineman.createInterface( config )
        shell.interpreter = {}
        //config.prompt = config.prompt
        //shell.interpreter[config.prompt] ===
        shell.interpreter[ shell.cli.linebuffer.id ] = function(line){
            
            shell.cli.prettyPrint(eval('shell.' + line))
        }
        //shell.cli.on('tab', complter)//
        shell.cli.on('ctrl-c',  function(){
                shell.epoch = process.uptime() - shell.epoch
                if( shell.epoch <= 0.5){ 
                    if(!shell.cli.state.proxy){
                        shell.io.exit(); 
                    }else{
                        shell.cli.state.proxy.close()
                    }
                }
                shell.epoch = process.uptime()
            });
        shell.cli.on('line',    function(line){
            //repl
            try{
                shell.interpreter[shell.cli.linebuffer.id](line) 
            }catch(e){
                shell.cli.prettyPrint(e.message)
            }
            
            shell.cli.prompt()
        })
        shell.cli.on('echo',    function(buffer){ })
        shell.cli.prompt();
    return shell
}
module.exports.sheldon   = sheldon;

//nms.js
var shell = new sheldon()

process.stdin.pipe(shell.io).pipe(process.stdout)
process.stdout.on('resize',function(){
    shell.io.stdout.setSize(process.stdout)
})

//shell.cli.syntax['username'] = shell.cli.syntax.integer
function login(){
    shell.cli.question(['username','password','integer', 'json','boolean'],shell.cli.prettyPrint)
}
function sshClient(){
    shell.cli.question(['InetEndpoint','username','password'], function(varBinds){
            varBinds.port = 22
            varBinds.host = varBinds.InetEndpoint//choice['sysName','ipAddress']
            /*
            varBinds.algorithms = {
                serverHostKey: [ 'ssh-rsa', 'ssh-dss' ],
                hmac: ['hmac-sha2-256', 'hmac-sha2-512', 'hmac-sha1', 'hmac-sha1-96'],
                cipher:['aes256-cbc']
            }
            */
        var client = new ssh.Client();
            client.on('error', end);
            client.on('ready', openShell);
            client.on('end', end );
            client.connect(varBinds)
            
            shell.cli.prettyPrint({ InetEndpoint:varBinds.InetEndpoint, state:'connecting'})
            
            function openShell(){
                shell.cli.prettyPrint( { host:varBinds.host, state:'ready'} )
                client.shell(openStream);
            }
            function openStream(error,sshStream){
                if(error){ return }
                shell.cli.prettyPrint({ host:varBinds.host, state:'connected'})
                shell.cli.proxy( sshStream.stdin, sshStream.stdout )
                sshStream.stdout.on('close',function(){
                    shell.cli.prettyPrint({ host:varBinds.host, state:'closed'})
                    shell.cli.prompt()
                })
            }
            function end(err){
                if(err){ shell.cli.prettyPrint( err ) }
                shell.cli.input.resume()
                shell.cli.prompt()
                client.destroy()
                
            }
        
    })
}

shell.treeSearch = treeSearch
shell.login     = login
shell.sshClient = sshClient
