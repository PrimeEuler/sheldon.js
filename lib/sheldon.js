var stdioe      = require('./stdioe');
var lineman     = require('./lineman')();
var _           = require('lodash');
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
    return { path:path, siblings:siblings }
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
        shell.eval = {
            js:function(line){
                shell.cli.prettyPrint(eval('shell.' + line))
            }
        }
        
        function completer(line) {
            var buffer      = shell.cli.linebuffer.get()
            var lexeme      =  buffer.words[ buffer.index ] || ''
            var objectTree  = shell;
            var subTree     = treeSearch( objectTree, lexeme.slice(0, buffer.offset) )

            buffer.words[ buffer.index ] = subTree.path//lexem auto complete
            line = buffer.words.join(" ")
            buffer.cursor = buffer.cursor - buffer.offset + buffer.words[ buffer.index ].length
            //error,[cursor word matches, line, cursor ]
            return (null, [ subTree.siblings , line, buffer.cursor]);
        
        }

    var config      = { input:  shell.io.stdin, 
                        output: shell.io.stdout, 
                        prompt: 'sheldon',
                        caret: '>',
                        terminal: true,
                        completer:completer }
                        
        shell.cli   = lineman.createInterface( config )

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
                shell.eval.js(line) 
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

