function ts(){
    //Local Terminal Server
    //
    var LtsLineEntry = { 
        SEQUENCE:
           [ [ 'tsLineActive', 'INTEGER' ],
             [ 'tsLineType', 'INTEGER' ],
             [ 'tsLineAutobaud', 'INTEGER' ],
             [ 'tsLineSpeedin', 'INTEGER' ],
             [ 'tsLineSpeedout', 'INTEGER' ],
             [ 'tsLineFlow', 'INTEGER' ],
             [ 'tsLineModem', 'INTEGER' ],
             [ 'tsLineLoc', 'DisplayString' ],
             [ 'tsLineTerm', 'DisplayString' ],
             [ 'tsLineScrlen', 'INTEGER' ],
             [ 'tsLineScrwid', 'INTEGER' ],
             [ 'tsLineEsc', 'DisplayString' ],
             [ 'tsLineTmo', 'INTEGER' ],
             [ 'tsLineSestmo', 'INTEGER' ],
             [ 'tsLineRotary', 'INTEGER' ],
             [ 'tsLineUses', 'INTEGER' ],
             [ 'tsLineNses', 'INTEGER' ],
             [ 'tsLineUser', 'DisplayString' ],
             [ 'tsLineNoise', 'INTEGER' ],
             [ 'tsLineNumber', 'INTEGER' ],
             [ 'tsLineTimeActive', 'INTEGER' ] ] 
        
    }
    var tsLineType = { 
        'OBJECT-TYPE':
           { SYNTAX:
              [ 'INTEGER',
                { '1': 'unknown',
                  '2': 'console',
                  '3': 'terminal',
                  '4': 'line-printer',
                  '5': 'virtual-terminal',
                  '6': 'auxiliary' } ],
             ACCESS: 'read-only',
             STATUS: 'mandatory',
             DESCRIPTION: [ 'Type of line.' ],
             '::=': [ 'ltsLineEntry', 2 ] } 
        
    }
    var LtsLineSessionEntry = { 
        SEQUENCE:
           [ [ 'tslineSesType', 'INTEGER' ],
             [ 'tslineSesDir', 'INTEGER' ],
             [ 'tslineSesAddr', 'IpAddress' ],
             [ 'tslineSesName', 'DisplayString' ],
             [ 'tslineSesCur', 'INTEGER' ],
             [ 'tslineSesIdle', 'INTEGER' ],
             [ 'tslineSesLine', 'INTEGER' ],
             [ 'tslineSesSession', 'INTEGER' ] ] 
        
    }
    var tslineSesType = { 
        'OBJECT-TYPE':
           { SYNTAX:
              [ 'INTEGER',
                { '1': 'unknown',
                  '2': 'pad',
                  '3': 'stream',
                  '4': 'rlogin',
                  '5': 'telnet',
                  '6': 'tcp',
                  '7': 'lat',
                  '8': 'mop',
                  '9': 'slip',
                  '10': 'xremote',
                  '11': 'rshell' } ],
             ACCESS: 'read-only',
             STATUS: 'mandatory',
             DESCRIPTION: [ 'Type of session.' ],
             '::=': [ 'ltsLineSessionEntry', 1 ] } 
        
    }
             
             
             
}
