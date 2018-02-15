var _           = require('lodash');

function index(obj,is, value) {
    if (typeof is == 'string')
        return index(obj,is.split('.'), value);
    else if (is.length==1 && value!==undefined)
        return obj[is[0]] = value;
    else if (is.length==0)
        return obj;
    else
        return index(obj[is[0]],is.slice(1), value);
}
/*
> obj = {a:{b:{etc:5}}}

> index(obj,'a.b.etc')
5
> index(obj,['a','b','etc'])   #works with both strings and lists
5

> index(obj,'a.b.etc', 123)    #setter-mode - third argument (possibly poor form)
123

> index(obj,'a.b.etc')
123
*/
Object.unflatten = function(data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in data) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = data[p];
    }
    return resultholder[""] || resultholder;
};
Object.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        //console.log(result)
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
}




function parser(){
    var WORDS           =  /"[^"]*"|[^\s"]+/g;
    var JS_PARAMETERS   = /([^\s,]+)/g;
    var JS_COMMENTS     = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
    var self = {
            _:_,
            lexer:function(lineBuffer){
                var leading     = lineBuffer.line.slice(0, lineBuffer.cursor )
                var words       = leading.match(WORDS)||[];
                var space       = leading.lastIndexOf(' ')===leading.length-1;
                var index       = words.length - (space?0:1);
                    words       = lineBuffer.line.match(WORDS)||[];
                var tokens      = self.tokenize(words)
                    if(tokens.length === 0){ tokens[0]={ type:'<target>', word:''} }
                    if(typeof tokens[index] === 'undefined'){ tokens[index] = { type:'<value>', word:'' }  }
                return { tokens:tokens, index:index }
                
            },
            tokenize:function(words){
                var tokens      = [];
                for (var i = 0; i < words.length; i++ ){
                    var w = words[i];
                    var t = '<value>';          //  literal
                    if( w.indexOf('--')===0){   //  operator
                        t   = '<key>'           //  identifier
                        w   = w.replace('--','')
                    }else if(w.indexOf('-')===0){
                        t   = '<key>'           //  identifier
                        w   = w.replace('-','') //  operator
                    }else if(i===0){
                        t   = '<target>'        //  identifier
                    }
                    tokens.push({ type:t, word:w })
                }
                return tokens
            },
            matchInList:function(list,string){
                function startsWith(value){
                    if(typeof value === 'string'){
                        return value.indexOf(string)===0
                    }else{
                        return false
                    }
                    
                }
                return list.filter(startsWith)||[];
            },
            longestInCommon:function(candidates, index) {
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
            },
            searchTree:function(path,object){
                    //root ancestors... node
                    //node  = ancestors[index]
                    var hops        = (typeof path === 'string')? path.split('.',-1) : [];
                    var hop         = -1;
                    var nextHops    = [];
                    var found       = false;
                    var isHop       = false;
                    var isLast      = false;
            
                    while(nextHops.length === 0 && hop < hops.length){
                            hop ++;
                            path        = hops.slice(0, hop).join('.');
                            //
                            //
                            nextHops    = self.matchInList( Object.keys( _.get(object, path) || object) , hops[hop])
                            isHop       = nextHops.indexOf(hops[hop])>-1;
                            isLast      = (hop === hops.length-1);
            
                            if (nextHops.length > 1 ){
                                hops[hop] = self.longestInCommon(nextHops, hops[hop].length);
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
                    
                    return ({ commonPath:path, nextHops: nextHops })
                    
                },
            getDecendents:function(object){
                var kv = Object.flatten(object)
                return kv//Object.keys(kv)
            
            },
            autoComplete:function(buffer,tree){
                var structure   = self.lexer(buffer)
                var path = structure.tokens[0].word
                var paths = self.getDecendents(tree)
                var matches = self.matchInList(paths,path)
                    structure.tokens[0].word = self.longestInCommon( matches, path.length )
                return structure
                //var paths       = lineparser.searchTree(structure.tokens[0].word,tree)
                
            },
            getParameters:function(functionString){
                functionString = functionString.replace(JS_COMMENTS, '');
                functionString = functionString.slice(
                    functionString.indexOf('(')+1, 
                    functionString.indexOf(')')
                    ).match(JS_PARAMETERS);
                return(functionString)
            },
    }
    return self
}
module.exports = parser