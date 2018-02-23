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
function longestInCommon(candidates, index) {
        var i, ch, memo
        do {
            memo = null
            for (i = 0; i < candidates.length; i++) {
                ch = candidates[i].charAt(index)
                if (!ch) break;
                if (!memo) memo = ch
                else if (ch != memo) break;
            }
        } while (i == candidates.length && ++index)

        return candidates[0].slice(0, index)
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

    // walk the path of nodes

    while(siblings.length === 0 && n < nodes.length){
        n++;
        path        = nodes.slice(0, n).join('.');
        subTree     =  _.get(tree, path);
        defined     =  _.has(tree, path);
        subTree     = subTree || tree
        //step back to parent node branch if subTree is undefined
        path        = defined? path : nodes.slice(0, n-1).join('.');
        //strings that start the same as current string (node[n])
        siblings    = Object.keys(subTree).filter( startsWith )//node[n]
        //is a valid string
        isNode      = siblings.indexOf( nodes[n] ) > -1;
        //is last string
        isLeaf      = ( n === nodes.length-1 );
        //longest string in common with siblings
        //autocomplete string
        if( siblings.length > 1 ){
            nodes[n] = longestInCommon(siblings, nodes[n].length);
            path   = nodes.slice(0, n+1).join('.');
        }
        //go to next node if not leaf
        if( siblings.length > 1 && isNode && !isLeaf ){
            //child
            siblings = [nodes[n]]
        }
        //set path if leaf node
        //only child
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
        //SCHEMA
        shell.DEFINITIONS = {
            'username':{ 'OBJECT-TYPE': 
                           { SYNTAX: [ 'OCTET STRING', { SIZE: { min: 1, max: 32 } } ],
                             'MAX-ACCESS': 'read-write',
                             STATUS: 'current',
                             DESCRIPTION: 
                              [ 'A human readable string representing the name of the user.',
                                'This is the (User-based Security) Model dependent security ID.'],
                             '::=': [ 'sheldon', 1 ] } },
            'login':{ 'OBJECT-TYPE': 
                           { SYNTAX: [ 'function', function(username,password){
                               
                               shell.cli.question('username',function(response){
                                   
                               })
                           } ],
                             'MAX-ACCESS': 'execute',
                             STATUS: 'current',
                             DESCRIPTION: 
                              [ 'Request username and password for authentication.',
                                'This is the (User-based Security) Model dependent security ID.'],
                             '::=': [ 'sheldon', 1 ] } },

        }
        //SYNTAX Parers
        shell.simple_syntax = {
            'OCTET STRING':function(string,constraints){
                
            },
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
            },
            'function': function(callback){
                return callback()
            }
        }
        //EVALUATION
        shell.eval = {
            js:function(line){
                shell.cli.prettyPrint(eval('shell.' + line))
            }
        }
        
        function completer(line) {
            var buffer      = shell.cli.linebuffer.get()
            //current node / word
            var lexeme      =  buffer.words[ buffer.index ] || ''
            //
            var objectTree  = shell;//
            if(buffer.index > 1){
                //GET_PARAMETERS( shell[ buffer.words[0] ] )
                objectTree = {}//
            }
            
            
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

