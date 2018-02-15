var asn1js          = require('asn1js');
var snmp            = require('snmp-native');
var util            = require('util');
console.log(asn1js)
var MIB = {
        ObjectName : 'OBJECT IDENTIFIER',
        ObjectSyntax : { CHOICE: 
                           [ [ 'simple', 'SimpleSyntax' ],
                             [ 'application-wide', 'ApplicationSyntax' ] ] },
        SimpleSyntax : { CHOICE: 
                           [ [ 'integer-value',
                               [ 'INTEGER', { min: -2147483648, max: 2147483647 } ] ],
                             [ 'string-value',
                               [ 'OCTET STRING', { SIZE: { min: 0, max: 65535 } } ] ],
                             [ 'objectID-value', 'OBJECT IDENTIFIER' ] ] },
        ApplicationSyntax : { CHOICE: 
                               [ [ 'ipAddress-value', 'IpAddress' ],
                                 [ 'counter-value', 'Counter32' ],
                                 [ 'timeticks-value', 'TimeTicks' ],
                                 [ 'arbitrary-value', 'Opaque' ],
                                 [ 'big-counter-value', 'Counter64' ],
                                 [ 'unsigned-integer-value', 'Unsigned32' ] ] },
        IpAddress : { tag: { class: 'APPLICATION', number: 0 },
                      definition: 'IMPLICIT',
                      type: [ 'OCTET STRING', { SIZE: 4 } ] },
        Counter32 : { tag: { class: 'APPLICATION', number: 1 },
                      definition: 'IMPLICIT',
                      type: [ 'INTEGER', { min: 0, max: 4294967295 } ] },
        TimeTicks : { tag: { class: 'APPLICATION', number: 3 },
                      definition: 'IMPLICIT',
                      type: [ 'INTEGER', { min: 0, max: 4294967295 } ] },
        Opaque :    { tag: { class: 'APPLICATION', number: 4 },
                      definition: 'IMPLICIT',
                      type: 'OCTET STRING' },
        Counter64 : { tag: { class: 'APPLICATION', number: 6 },
                      definition: 'IMPLICIT',
                      type: [ 'INTEGER', { min: 0, max: 18446744073709552000 } ] },
        Unsigned32 :{ tag: { class: 'APPLICATION', number: 2 },
                      definition: 'IMPLICIT',
                      type: [ 'INTEGER', { min: 0, max: 4294967295 } ] },
        iso :        
                    { 'OBJECT IDENTIFIER': { '::=': [ 'root', 1 ] } },
        org :        
                    { 'OBJECT IDENTIFIER': { '::=': [ 'iso', 3 ] } },
        dod :        
                    { 'OBJECT IDENTIFIER': { '::=': [ 'org', 6 ] } },
        internet :        
                    { 'OBJECT IDENTIFIER': { '::=': [ 'dod', 1 ] } },
        private :        
                    { 'OBJECT IDENTIFIER': { '::=': [ 'internet', 4 ] } },
        enterprises :        
                    { 'OBJECT IDENTIFIER': { '::=': [ 'private', 1 ] } },
                    
                                

        //enterprises arc              
        primeEuler :
                    { 'OBJECT IDENTIFIER': { '::=': [ 'enterprises', 51031 ] } },
        //Standard Stream IO arc
        stdioe : 
                    { 'OBJECT IDENTIFIER': { '::=': [ 'primeEuler', 1 ] } },
        stdin : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'stream',
                        ACCESS: 'read',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'A standard Input Stream'],
                        '::=': [ 'stdioe', 1 ] } },
        stdout : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'stream',
                        ACCESS: 'write',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'A standard Output Stream'],
                        '::=': [ 'stdioe', 2 ] } },
        stderr : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'stream',
                        ACCESS: 'write',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'A standard Error Stream'],
                        '::=': [ 'stdioe', 3 ] } },
        //Shell    
        sheldon : 
                    { 'OBJECT IDENTIFIER': { '::=': [ 'primeEuler', 2 ] } },
        //Readline arc
        lineman : 
                    { 'OBJECT IDENTIFIER': { '::=': [ 'sheldon', 1 ] } },
        lineEntry : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'LineEntry',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'A line contaning text and cursor position read from stdin'],
                        '::=': [ 'lineman', 1 ] } },
        LineEntry : 
                    { SEQUENCE: 
                      [ [ 'lineText', 'OCTET STRING' ],
                        [ 'lineCursor', 'INTEGER' ] ] },
        lineText : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'OCTET STRING',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'Buffer of text in the line.'],
                        '::=': [ 'lineEntry', 1 ] } },
        lineCursor : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'INTEGER',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'Buffer cursor position of the line'],
                        '::=': [ 'lineEntry', 2 ] } },
                        
        //Parsed Structure                
        structuredPipline: 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: [ 'SEQUENCE OF', 'StructuredEntry' ],
                        ACCESS: 'not-accessible',
                        STATUS: 'mandatory',
                        DESCRIPTION: 
                         [ 'A table containing structured objects',
                           'from the parsed line.' ],
                        '::=': [ 'sheldon', 2 ] } },
        structuredEntry: 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'StructuredEntry',
                        ACCESS: 'read-only',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Structured object', 'from the parsed line.' ],
                        '::=': [ 'structuredPipline', 1 ] } },
        StructuredEntry: 
                    { SEQUENCE: 
                      [ [ 'structuredIndex', 'INTEGER' ],
                        [ 'structuredObject', 'OBJECT IDENTIFIER' ],
                        [ 'structuredVarBinds', 'structuredVarBinds' ] ] },
        structuredIndex:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'INTEGER',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'structuredEntry', 1 ] } },
        structuredObject:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'OBJECT IDENTIFIER',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'structuredEntry', 2 ] } },
        structuredVarBinds:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: ['SEQUENCE OF','StructuredVarBindEntry'],
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'structuredEntry', 2 ] } },
        structuredVarBindEntry:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'StructuredVarBindEntry',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        INDEX:'structuredVarBinIndex',
                        '::=': [ 'structuredVarBinds', 1 ] } },
        StructuredVarBindEntry: 
                    { SEQUENCE: 
                      [ [ 'structuredVarBinIndex', 'INTEGER' ],
                        [ 'structuredVarBindOID', 'OBJECT IDENTIFIER' ],
                        [ 'structuredVarBindValue', 'ObjectSyntax' ] ] },
        structuredVarBinIndex:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'INTEGER',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'structuredVarBindEntry', 1 ] } },
        structuredVarBindOID:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'OBJECT IDENTIFER',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'structuredVarBindEntry', 2 ] } },
        structuredVarBindValue:
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'ObjectSyntax',
                        ACCESS: 'read-write',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'structuredVarBindEntry', 3 ] } },
                        
                        
        
        
        //REPL arc         
        repl : 
                    { 'OBJECT IDENTIFIER': { '::=': [ 'sheldon', 2 ] } },
        read : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'PROCEDURE CALL',
                        ACCESS: 'not-accessiblee',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Parses lineEntry and populates structuredPipline.' ],
                        '::=': [ 'repl', 1 ] } },
        eval : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'PROCEDURE CALL',
                        ACCESS: 'not-accessiblee',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Evaluates each structuredObject in structuredPipline',
                                       'and passes results as structuredVarBinds to next ',
                                       'structuredEntry. Populates structuredResultsTable with ',
                                       'results from the structuredPipline.'],
                        '::=': [ 'repl', 2 ] } },
        print : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'PROCEDURE CALL',
                        ACCESS: 'not-accessiblee',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Formats structuredResultsTable and writes it to stdout' ],
                        '::=': [ 'repl', 3 ] } }, 
        loop : 
                    { 'OBJECT-TYPE': 
                      { SYNTAX: 'PROCEDURE CALL',
                        ACCESS: 'not-accessiblee',
                        STATUS: 'mandatory',
                        DESCRIPTION: [ 'Resets lineEntry, structuredPipline and structuredResultsTable.' ],
                        '::=': [ 'repl', 4 ] } }, 
        //
        functionParameters:
                    { 'OBJECT-TYPE':
                       { SYNTAX: [ 'InternationalDisplayString', { SIZE: { min: 0, max: 128 } } ],
                         'MAX-ACCESS': 'read-only',
                         STATUS: 'current',
                         DESCRIPTION:
                          [ 'A description of the parameters supplied to this',
                            'software when it was initially loaded.' ],
                         '::=': [ 'hrSWRunEntry', 5 ] } }
        
        

    }
    var OID = {};

function DEFINITION(ObjectName){
    var Definition  = MIB[ ObjectName ];
    var DefType     = TYPE_OF( Definition );
    var syntax = [];
    switch(DefType){
        case 'string':
            syntax[0]   = Definition
            break;
        case 'array':
            syntax      = Definition
            break;
        case 'object':
            syntax[0]   = Object.keys(Definition)[0]
            syntax[1]   = Definition[ syntax[0] ]
            //ApplicationSyntax
            if(syntax[0]==='tag'){
                
                switch(TYPE_OF( Definition.type)){
                    case 'string':
                        syntax = [Definition.type]
                        break;
                    case 'array':
                        syntax = Definition.type
                        break;
                    default:
                        break;
                        
                }
                //console.log(ObjectName, util.inspect( syntax, false, 10, true))
            }
            break;
    }
    //console.log(util.inspect(syntax, false, 10, true))
    return syntax
}
function TYPE_OF(object){
    var type     = typeof object;
        if(Array.isArray(object)){type = 'array'}
        
    return type
}
function OID_VALUE(ObjectName){
    var OBJECT = DEFINITION(ObjectName)
    var objectID_value = [];
    var oid = []
    
    if(OBJECT[1] && OBJECT[1]['::=']){
        objectID_value = OBJECT[1]['::=']
    }else{
        //console.log(OBJECT[0])
        return
    }
    if(typeof objectID_value[0] === 'number'){
        oid = objectID_value
    }else{
        oid.unshift(objectID_value[1])
        while(objectID_value[0]!=='root' && MIB[objectID_value[0]] ){
            objectID_value = MIB[ objectID_value[0] ][ Object.keys( MIB[ objectID_value[0] ] )[0] ]['::=']
            oid.unshift(objectID_value[1])
        }
    }
    return oid.join('.')



}
function SYNTAX_OF(object){
        if( object.length===1 ){ return object }
    var syntax  = object[1]['SYNTAX'];
    var synType = TYPE_OF( syntax )

        if( synType === 'string' ){
            syntax   =  [syntax]
        }else if(synType === 'undefined'){
            syntax  = object
        }
        return syntax
}
function SYNTAX_CHAIN(SYNTAX){
        var chain = []
        if(!MIB[SYNTAX[0]]){
                //SimpleSyntax
                return SYNTAX
               // console.log(ObjectName, util.inspect(SYNTAX, false, 10, true))
                
        }else{
            chain = chain.concat(SYNTAX)
            while(MIB[SYNTAX[0]]){
                OBJECT = DEFINITION(SYNTAX[0])
                SYNTAX = SYNTAX_OF(OBJECT)
                chain = chain.concat(SYNTAX)
            }
            return chain
            //console.log(ObjectName, util.inspect( SYNTAX, false, 10, true))
            
        }
}
function mibCompileV3(){
    //SMIv2 SNMPv2
    var MACRO = {
        'IMPORTS':function(){
            
        },
        'EXPORTS':function(){
            
        },
        //TYPE NOTATION
        'OBJECT-TYPE':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            var SYNTAX = SYNTAX_OF(OBJECT)
            var chain = []
            //VALUE NOTATION ::= value(VALUE ObjectName)
            if(OBJECT[1].INDEX){
                //SYNTAX.push(['INDEX',OBJECT[1].INDEX])
            }
            //return SYNTAX
            
            if(!MIB[SYNTAX[0]]){
                //SimpleSyntax
                return SYNTAX
               // console.log(ObjectName, util.inspect(SYNTAX, false, 10, true))
                
            }else{
                chain = chain.concat(SYNTAX)
                while(MIB[SYNTAX[0]]){
                    OBJECT = DEFINITION(SYNTAX[0])
                    SYNTAX = SYNTAX_OF(OBJECT)
                    chain = chain.concat(SYNTAX)
                }
                return chain
                //console.log(ObjectName, util.inspect( SYNTAX, false, 10, true))
                
            }
            
        },
        'MODULE-IDENTITY':function(ObjectName){
            //INFORMATIONAL
            //VALUE NOTATION ::= value(VALUE OBJECT IDENTIFIER)
            return ObjectName
        }, 
        'OBJECT-IDENTITY':function(ObjectName){
            //INFORMATIONAL
            //VALUE NOTATION ::= value(VALUE OBJECT IDENTIFIER)
            return ObjectName
        }, 
        'NOTIFICATION-TYPE':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            //VALUE NOTATION ::= value(VALUE NotificationName)
            return OBJECT[1].OBJECTS
        },
        'OBJECT-GROUP':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
             //VALUE NOTATION ::= value(VALUE OBJECT IDENTIFIER)
            return OBJECT[1].OBJECTS
        },
        'NOTIFICATION-GROUP':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            //VALUE NOTATION ::= value(VALUE OBJECT IDENTIFIER)
            return OBJECT[1].NOTIFICATIONS
        },
        'MODULE-COMPLIANCE':function(ObjectName){
             //VALUE NOTATION ::= value(VALUE OBJECT IDENTIFIER)
            return ObjectName
        },
        'AGENT-CAPABILITIES':function(ObjectName){
             //VALUE NOTATION ::= value(VALUE OBJECT IDENTIFIER)
            return ObjectName
        },
        'TEXTUAL-CONVENTION':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            var SYNTAX = SYNTAX_OF(OBJECT)
            //VALUE NOTATION ::= value(VALUE Syntax)
            return SYNTAX
            
            if(!MIB[SYNTAX[0]]){
                return SYNTAX
                //console.log(ObjectName, util.inspect(SYNTAX, false, 10, true))
            }else{
                OBJECT = DEFINITION(SYNTAX[0])
                SYNTAX = SYNTAX_OF(OBJECT)
                return SYNTAX
                //console.log(ObjectName, util.inspect( SYNTAX, false, 10, true))
                
            }
        },
        'TRAP-TYPE':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            //console.log(OBJECT[1]['::='])
        },
        //VALUE NOTATION
        '::=':function(ObjectName){
            
        }
    }
    //ASN1
    var StructuredType = {
        'SEQUENCE':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            return(OBJECT[1])
            //console.log(util.inspect(['INDEX',OBJECT[1].INDEX], false, 10, true))
            //console.log(OBJECT)
        },
        'SEQUENCE OF':function(){
            
            var schema =  function(parameters){
        		// AuthorityInfoAccess OID ::= 1.3.6.1.5.5.7.1.1
        		// SubjectInfoAccess OID ::= 1.3.6.1.5.5.7.1.11
        		//
        		//AuthorityInfoAccessSyntax  ::=
        		//SEQUENCE SIZE (1..MAX) OF AccessDescription
        
        		/**
        		 * @type {Object}
        		 * @property {string} [blockName]
        		 * @property {string} [accessDescriptions]
        		 */
        		//const names = getParametersValue(parameters, "names", {});
        		
        		var names = {
        		    blockName:  'LineEntry',
        		    lineEntry:  '1.3.6.1.4.1.51031.2.1.1.1',
        		    lineText:   '1.3.6.1.4.1.51031.2.1.1.1.1',
        		    lineCursor: '1.3.6.1.4.1.51031.2.1.1.1.2',
        		    LineEntry : 
                    { SEQUENCE: 
                      [ [ 'lineText', 'OCTET STRING' ],
                        [ 'lineCursor', 'INTEGER' ] ] },
                     schema:function(){
                         
                     }
        		    
        		}
        
        		return (new asn1js.Sequence({
        			name: (names.blockName || ""),
        			value: [
        				new asn1js.Repeated({
        					name: (names.lineEntry || ""),
        					value: names.LineEntry.schema()
        				})
        			]
        		}));
        	}
	
	
	
	
	
            
        },
        'SET':function(){
            
        },
        'SET OF':function(){
            
        },
        'CHOICE':function(){
            
        },
        'SELECTION':function(){
            
        },
        'ANY':function(){
            
        }
    }
    /*
    -- the "base types" defined here are:
    --   3 built-in ASN.1 types: INTEGER, OCTET STRING, OBJECT IDENTIFIER
    --   8 application-defined types: Integer32, IpAddress, Counter32,
    --              Gauge32, Unsigned32, TimeTicks, Opaque, and Counter64
    */
    var SimpleSyntax = {
        'OBJECT IDENTIFIER':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
            if(OBJECT[1] && OBJECT[1]['::=']){
                var oid = OID_VALUE( ObjectName )
                //console.log(util.inspect(oid, false, 10, true))
                return oid
            }else{
                console.log(ObjectName, util.inspect(OBJECT, false, 10, true))
                return ObjectName
            }
            
        },
        'OCTET STRING':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
        },
        'INTEGER':function(ObjectName){
            var OBJECT = DEFINITION(ObjectName)
        }
    }
    var ApplicationSyntax = {
        
    }
    Object.keys(snmp.DataTypes).forEach(function(DataType){
        ApplicationSyntax[snmp.DataTypes[DataType]] = DataType
    })
    Object.keys(MIB).forEach(function(ObjectName){
        if(MACRO[ObjectName]){
            //MACRO DEFINITION
        }else{
            //OBJECT DEFINITION
            var OBJECT = DEFINITION(ObjectName);
            var SYNTAX = MACRO[ OBJECT[0] ] || SimpleSyntax[ OBJECT[0] ] || StructuredType[ OBJECT[0] ] 
                
                

            
            if(SYNTAX){
                //SYNTAX(ObjectName)
                if(OBJECT[0] === 'TEXTUAL-CONVENTION' ||OBJECT[0] === 'SEQUENCE'  ){
                    //console.log(ObjectName, OBJECT[0], util.inspect(SYNTAX(ObjectName), false, 10, true))
                }else{
                    OID[OID_VALUE( ObjectName )] = ObjectName
                    console.log(ObjectName, OBJECT[0], util.inspect(SYNTAX(ObjectName), false, 10, true))
                }
            }
            
        }
        
        
    })

}


mibCompileV3()
    
/*    
var poo =  asn1js.Sequence({
			name: ('lineText' || ""),
			value: [
				 new asn1js.ObjectIdentifier({ name: ('1.3.6.1.4.1.51031.1.2.1.1' || "") }),
				 new asn1js.OctetString({ value:'this is some text' })
			]
		}) 
*/
		
//console.log(poo)