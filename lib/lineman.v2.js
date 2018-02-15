var _keypress    = require('keypress');
var util        = require('util'),
    inherits    = util.inherits,
    EventEmitter = require('events');
    
Array.prototype.peek = function(){
    return this[this.length -1]
}
String.prototype.splice = function (idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};
String.prototype.del = function (idx) {
    return (this.slice(0, idx - 1) + this.slice(idx));
};
inherits(lineman, EventEmitter)
function lineman(stdin){
    
    var line        = ''
    var cursor      = 0
    var history     = [];
    var index       = 0;
    var buffer = { line:'', cursor:0 }
    
    var self = this;
        self.listening = true
        self.stream = stdin
    //line editing
    function keypress(ch, key){
        key = key || {};
        if (key.name == 'escape') return;
        if (key.ctrl && key.shift) {
            switch (key.name) {
              case 'backspace':
                _deleteLineLeft();
                break;
            
              case 'delete':
                _deleteLineRight();
                break;
            }
        }
        else if (key.ctrl) {
            switch (key.name) {
                case 'b':
                    self.emit('ctrl-b');
                    break;
                case 'c':
                    self.emit('ctrl-c')
                    break;
                case 'h': // delete left
                    _deleteLeft();
                    break;
                case 'd': // delete right or EOF
                    _deleteRight();
                    break;
                case 'u': // delete the whole line
                    _deleteLine();
                    break;
                case 'k': // delete from current to end of line
                    _deleteLineRight();
                    break;
                case 'a': // go to the start of the line
                    _moveCursor(-Infinity);
                    break;
                case 'e': // go to the end of the line
                    _moveCursor(+Infinity);
                    break;
                case 'b': // back one character
                    _moveCursor(-1);
                    break;
                case 'f': // forward one character
                    _moveCursor(+1);
                    break;
                case 'l': // clear the whole screen
                    break;
                case 'n': // next history item
                    _historyNext();
                    break;
                case 'p': // previous history item
                    _historyPrev();
                    break;
                case 'z':
                    self.emit('ctrl-z')
                    break;
                case 'w': // delete backwards to a word boundary
                case 'backspace':
                    _deleteWordLeft();
                    break;
                case 'delete': // delete forward to a word boundary
                    _deleteWordRight();
                    break;
                case 'left':
                    _wordLeft();
                    break;
                case 'right':
                    _wordRight();
                    break;
                }
        }
        else if (key.meta) {
            switch (key.name) {
                case 'b': // backward word
                    _wordLeft();
                    break;
                case 'f': // forward word
                    _wordRight();
                    break;
                case 'd': // delete forward word
                case 'delete':
                    _deleteWordRight();
                    break;
                case 'backspace': // delete backwards to a word boundary
                    _deleteWordLeft();
                    break;
            }
        }
        else{
            switch(key.name){
                case 'up':
                    _historyNext();
                    break;
                case 'down':
                    _historyPrev();
                    break;
                case 'left':
                    _moveCursor(-1)
                    break;
                case 'right':
                    _moveCursor(+1)
                    break;
                case 'delete':
                    _deleteRight()
                    break;
                case 'backspace':
                    _deleteLeft();
                    break;
                case 'home':
                    _moveCursor(-Infinity);
                    break;
                case 'end':
                    _moveCursor(+Infinity);
                    break;
                case 'insert':
                    break;
                case 'enter':
                    _line();
                    break;
                case 'return':
                    _line();
                    break;
                case 'tab':
                    //_tabComplete( { line : line, cursor: cursor } )
                    break;
                default:
                    if(!ch){
                        if(key.sequence){
                            ch = key.sequence
                        }else
                        {
                            ch=''
                        }
                    }
                    _insertString(ch)
                    break;
            }
        }
        buffer.cursor     = cursor;
        buffer.line       = line;
        if(key.name==='return' || key.name==='enter' ){
           self.emit('line',history.peek())
        }else if(key.name === 'tab'){
            self.emit( key.name , buffer )
        }else{
           self.emit('read',buffer)
        }
        
        
    }
    function _insertString(value) {
        line = line.splice(cursor, 0, value);
        cursor += value.length;
    }
    function _line(){
        var pos = history.indexOf(line);
        (pos > -1)?history.splice(pos, 1):null;
        history.push(line);
        line='';
        cursor = 0;
        index = 0;
    }
    function _moveCursor(dx){
        if(cursor >= 0 &&  cursor <= line.length ){
            cursor+=dx;
        }
        if(cursor < 0 ){ cursor = 0 }
        if(cursor > line.length){ cursor = line.length }
    }
    function _wordLeft(){
        if (cursor > 0) {
            var leading = line.slice(0, cursor);
            var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
            _moveCursor(-match[0].length);
        }
    }
    function _wordRight(){
        if (cursor < line.length) {
            var trailing = line.slice(cursor);
            var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
            _moveCursor(match[0].length);
        }
    }
    function _deleteLeft() {
        if (line.length > 0 && cursor > 0) {
            line = line.del(cursor);
            cursor--;
        }
    }
    function _deleteRight() {
        if (line.length > 0 && cursor >= 0) {
            line = line.del( cursor + 1 );
        }
    }
    function _deleteWordLeft(){
        if (this.cursor > 0) {
            var leading = line.slice(0, cursor);
            var match = leading.match(/([^\w\s]+|\w+|)\s*$/);
            leading = leading.slice(0, leading.length - match[0].length);
            line = leading + line.slice(cursor, line.length);
            cursor = leading.length;
        }
    }
    function _deleteWordRight(){
        if (cursor < line.length) {
            var trailing = line.slice(cursor);
            var match = trailing.match(/^(\s+|\W+|\w+)\s*/);
            line = line.slice(0, cursor) + trailing.slice(match[0].length);
        }
    }
    function _deleteLine(){
        cursor = 0;
        line = '';
    }
    function _deleteLineLeft(){
        line = line.slice(cursor);
        cursor = 0;
    }
    function _deleteLineRight(){
        line = line.slice(0, cursor);
    }
    function _historyNext() {
        if( index < history.length ){ index ++; }
        line = history[ history.length - index ] || ''
        cursor = line.length;
    }
    function _historyPrev() {
        if( index > 0 ){
            index --;
            line    = history[  history.length - index ] || ''
            cursor  = line.length;
        }
    }
    function _tabComplete(line) {
        self.emit('tab',line)
    }
    _keypress(stdin)
    stdin.on('keypress', function(ch,key){
            self.listening? keypress(ch,key):null ;
            if(!self.listening && key && key.ctrl && key.name === 'c'){
                self.emit('ctrl-c') 
            }
    })
    self.get = function (){
        return({ line:line , cursor:cursor})
    }
    self.set = function (buffer,echo){
        line = buffer.line
        cursor = buffer.cursor
        echo===true?self.emit('read',buffer):null;
    }
    //
    self.createInterface = function(options){
        options = options||{
            input:'<Readable>',
            output:'<Writable>',
            completer:'<Function>',
            terminal:'<Boolean>',
            historySize: '<number>',
            prompt: '<string>',
            crlfDelay: '<number>',
            removeHistoryDuplicates: '<boolean>'
            
        }
    }
}
module.exports = lineman;

