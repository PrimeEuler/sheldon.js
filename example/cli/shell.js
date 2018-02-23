var sheldon = require('../../').sheldon
var shell = new sheldon()
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
process.stdin.pipe(shell.io).pipe(process.stdout)
process.stdout.on('resize',function(){
    shell.io.stdout.setSize(process.stdout)
})
