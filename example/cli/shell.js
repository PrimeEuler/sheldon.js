var sheldon = require('../../').sheldon
var shell = new sheldon()

process.stdin.pipe(shell.io).pipe(process.stdout)
process.stdout.on('resize',function(){
    shell.io.stdout.setSize(process.stdout)
})
