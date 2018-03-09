# sheldon.js
A node.js unix-like shell based on [Sheldon] (http://garfield.wikia.com/wiki/Sheldon).

The project relies heavely on a few core modules:
+ [keypress](https://github.com/TooTallNate/keypress) - Emits keypress events from any readble stream such as `process.stdin`.
+ [lineman](https://github.com/PrimeEuler/sheldon.js/blob/master/lib/lineman.js) - Line manager listens for keypress events and navigates and emits a line buffer much like [readline](https://github.com/nodejs/node/blob/master/lib/readline.js).
+ [sheldon.js](https://github.com/PrimeEuler/sheldon.js) - Sheldon listens for line and keypress events to provide a thin shell around javascript. It parses emited lines into arguments. The first argument is assumed to be the path to a javascript object and is passed to the [lodash](https://github.com/lodash/lodash) `_.get(shell, path)` function. The `TAB` key either auto completes the path or returns an array of posible matches. If the `typeOf` javascipt object is `function`,  the parameter names of the function are read and the rest of the arguments are applied by name or in order to the function and it is called. If any parameter names are missing from the arguments, `lineman` asks/prompts for those parameters by name.  All other objects are formatted with `util.inspect` and written to a writeable stream such as `process.stdout` via `lineman`. 
Example:
```javascript
var sheldon = require('../../').sheldon
var shell = new sheldon()
  shell.os = require("os")
  process.stdin.pipe(shell.io).pipe(process.stdout)
  process.stdout.on('resize',function(){
      shell.io.stdout.setSize(process.stdout)
  })
```
