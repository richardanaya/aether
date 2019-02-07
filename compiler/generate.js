var fs = require('fs');
let {flatten,str,vec,bytevec,int,uint,I32,FUNC,DESC_FUNCTION,END,I32_CONST,SECTION_TYPE,
  SECTION_FUNCTION,SECTION_EXPORT,SECTION_CODE,MAGIC_NUMBER,VERSION_1,DESC_MEMORY,
  SECTION_MEMORY,LIMIT_MIN_MAX,SECTION_GLOBAL,MUTABLE,NOP,BLOCK,GLOBAL_GET,
  LOCAL_SET,LOCAL_GET,LOOP,I32_LOAD8_U,I32_LOAD,SET_LOCAL,I32_STORE8,EMPTY,BR,IF,I32_EQ,
  SECTION_IMPORT,THEN,I32_STORE,I32_ADD,I32_MUL,I32_SUB,raw,IMMUTABLE,GLOBAL_SET,DESC_GLOBAL,SECTION_DATA,
  CALL} = require("wasmly");
let mem = [];
function malloc(){
  return 0;
}
function len(m){
  return m.length;
}

let LOG          = 0
let MAIN         = 1
let MALLOC       = 2
let MEMCOPY      = 3
let ARRAY_NEW    = 4
let STR_NEW      = 5
let STR_SET_CHAR = 6
let STR_CSTRING  = 7
let PRINT        = 8
let STR_GET_CHAR = 9
let STR_FROM_RAW = 10
let STR_LEN      = 11
let STR_CONCAT   = 12
let STR_SUBSTR   = 13
let SWAP         = 14
let ARRAY_INDEX  = 15
let ARRAY_LEN    = 16
let PRINT_STRS   = 17
let ARRAY_SET    = 18

// main(file_start:i32,file_len:i32) -> wasm_start:i32
let main_code = bytevec([
  vec([
    [2,I32] //s:str,a:array
  ]),
  // s = str_from_raw(file_start,file_len)
  LOCAL_GET, 0,
  LOCAL_GET, 1,
  CALL,      STR_FROM_RAW,
  LOCAL_SET, 2,
  //print(concat(s,s))
  LOCAL_GET, 2,
  LOCAL_GET, 2,
  CALL,      STR_CONCAT,
  I32_CONST, 0,
  I32_CONST, 3,
  CALL,      STR_SUBSTR,
  LOCAL_SET, 2,
  LOCAL_GET, 2,
  CALL,      STR_CSTRING,
  LOCAL_GET, 2,
  CALL,      STR_CSTRING,
  I32_CONST, 1,
  I32_ADD,
  CALL,      SWAP,
  // a = array_new(1,4)
  I32_CONST, 2,
  I32_CONST, 4,
  CALL,      ARRAY_NEW,
  LOCAL_SET, 3,
  // array_set(a,0,s)
  LOCAL_GET, 3,
  I32_CONST, 0,
  LOCAL_GET, 2,
  CALL,      ARRAY_SET,
  // array_set(a,1,s)
  LOCAL_GET, 3,
  I32_CONST, 1,
  LOCAL_GET, 2,
  CALL,      ARRAY_SET,
  // print_strs(a)
  LOCAL_GET, 3,
  CALL,      PRINT_STRS,
  // eventually we return memory location of wasm, for now return 5
  I32_CONST, 5,
  END
])

// malloc - defines a region of memory for data and returns a memory reference
// to the start of where data should go
// malloc(length:i32) -> i32
let malloc_code = bytevec([
  vec([
    [1, I32] // current_heap:i32
  ]),
  // current_heap = global.heap
  GLOBAL_GET, 0,
  LOCAL_SET,  1,
  // memory[current_heap..current_heap+3] = length
  GLOBAL_GET, 0,
  LOCAL_GET,  0,
  I32_STORE,  0, 0,
  // global.heap = current_heap + 5 + length
  LOCAL_GET,  1,
  I32_CONST,  5,
  I32_ADD,
  LOCAL_GET,  0,
  I32_ADD,
  GLOBAL_SET, 0,
  // return current_heap + 5
  LOCAL_GET,  1,
  I32_CONST,  5,
  I32_ADD,
  END
])

// memcopy - copies n bytes from source to destination
// memcopy(destation:i32,source:i32,length:i32)
let memcopy_code = bytevec([
  vec([
    [1, I32] // i:i32
  ]),
  // loop
  BLOCK,EMPTY,
  LOOP, EMPTY,
    // if( i == length )
    LOCAL_GET, 3,
    LOCAL_GET, 2,
    I32_EQ,
    IF, EMPTY,
      BR,2,
    END,
    // mem[destination+i] = mem[source+i]
    LOCAL_GET, 3,
    LOCAL_GET, 0,
    I32_ADD,
    LOCAL_GET, 3,
    LOCAL_GET, 1,
    I32_ADD,
    I32_LOAD8_U, 0, 0,
    I32_STORE8, 0, 0,
    // i = i+1
    LOCAL_GET, 3,
    I32_CONST, 1,
    I32_ADD,
    LOCAL_SET, 3,
    BR,0,
  END,
  END,
  END
])

// array_new - returns a memory reference to a piece of memory big enough for n elements of a given size
// array_new(length:i32,elem_size:i32) -> reference:i32
let array_new_code = bytevec([
  vec([
    [1,I32] // m:array
  ]),
  // m = malloc(4+length*size)
  LOCAL_GET, 0,
  LOCAL_GET, 1,
  I32_MUL,
  I32_CONST, 8,
  I32_ADD,
  CALL, MALLOC,
  LOCAL_SET,2,
  // m[0..3] = length
  LOCAL_GET,2,
  LOCAL_GET,0,
  I32_STORE, 0, 0,
  // m[4..7] = size
  LOCAL_GET, 2,
  I32_CONST, 4,
  I32_ADD,
  LOCAL_GET, 1,
  I32_STORE, 0, 0,
  // return m
  LOCAL_GET,2,
  END
])

// str_new - returns a memory reference to a c-string
// str_new(length:i32) -> reference:i32
let str_new_code = bytevec([
  vec([]),
  //return array_new(length+1,1) //we add 1 so there's a zero character at end
  LOCAL_GET, 0,
  I32_CONST, 1,
  I32_ADD,
  I32_CONST, 1,
  CALL, ARRAY_NEW,
  END
])

// str_set_char - returns a character of index of string
// str_set_char(s:str,i:i32,byte:i32)
let str_set_char = bytevec([
  vec([]),
  //s[8+i]=bytes
  LOCAL_GET, 0,
  I32_CONST, 8,
  I32_ADD,
  LOCAL_GET, 1,
  I32_ADD,
  LOCAL_GET, 2,
  I32_STORE, 0,0,
  END
])


// str_cstring - returns the memory position of the strings data
// str_cstring(s:str) -> i32
let str_cstring = bytevec([
  vec([]),
  // return s+8
  // since str is an array, the cstring formatted data starts after the length
  LOCAL_GET, 0,
  I32_CONST, 8,
  I32_ADD,
  END
])

// print - prints a string
// print(s:str)
let print = bytevec([
  vec([]),
  // return s+4
  // since str is an array, the cstring formatted data starts after the length
  LOCAL_GET, 0,
  CALL, STR_CSTRING,
  CALL, LOG,
  END
])

// str_get_char - returns a character of index of string
// str_get_char(s:str,i:i32) -> i32
let str_get_char = bytevec([
  vec([]),
  //return s[8+i]
  LOCAL_GET, 0,
  I32_CONST, 8,
  I32_ADD,
  LOCAL_GET, 1,
  I32_ADD,
  I32_LOAD8_U, 0, 0,
  END
])

// str_from_raw - returns string from raw memory
// str_from_raw(start:i32,length:i32) -> str
let str_from_raw = bytevec([
  vec([
    [1,I32]
  ]),
  // memcopy(str_cstring(str_new(length)),start,length)
  LOCAL_GET, 1,
  CALL,      STR_NEW,
  LOCAL_SET, 2,
  LOCAL_GET, 2,
  CALL,      STR_CSTRING,
  LOCAL_GET, 0,
  LOCAL_GET, 1,
  CALL,      MEMCOPY,
  LOCAL_GET, 2,
  END
])

// str_len - returns length of string (not including /0)
// str_len(s:str) -> i32
let str_len = bytevec([
  vec([]),
  // return s[0..3]-1
  LOCAL_GET, 0,
  I32_LOAD,  0, 0,
  I32_CONST, 1,
  I32_SUB,
  END
])
// str_concat - concats two strings and produces a new string
// str_concat(s1:str,s2:str) -> str
let str_concat = bytevec([
  vec([
    [1,I32] // new_string:str
  ]),
  // new_string = str_new(str_len(s1)+str_len(s2))
  LOCAL_GET, 0,
  CALL,      STR_LEN,
  LOCAL_GET, 1,
  CALL,      STR_LEN,
  I32_ADD,
  CALL,      STR_NEW,
  LOCAL_SET, 2,
  //memcopy(str_cstring(new_string),str_cstring(s1),str_len(s1))
  LOCAL_GET, 2,
  CALL,      STR_CSTRING,
  LOCAL_GET, 0,
  CALL,      STR_CSTRING,
  LOCAL_GET, 0,
  CALL,      STR_LEN,
  CALL,      MEMCOPY,
  //memcopy(str_cstring(new_string)+str_len(s1),str_cstring(s2),str_len(s2))
  LOCAL_GET, 2,
  CALL,      STR_CSTRING,
  LOCAL_GET, 0,
  CALL,      STR_LEN,
  I32_ADD,
  LOCAL_GET, 1,
  CALL,      STR_CSTRING,
  LOCAL_GET, 1,
  CALL,      STR_LEN,
  CALL,      MEMCOPY,
  // return new_string
  LOCAL_GET, 2,
  END
])

// str_substr - returns substring of a string
// str_substr(s:str,i:i32,length:i32) -> str
let str_substr = bytevec([
  vec([]),
  //return str_from_raw(str_cstring(s),length)
  LOCAL_GET,  0,
  CALL,       STR_CSTRING,
  LOCAL_GET,  1,
  I32_ADD,
  LOCAL_GET,  2,
  CALL,       STR_FROM_RAW,
  END
])

// swap - swap the bytes of two places in memory
// swap(a:i32,b:i32)
let swap = bytevec([
  vec([
    [1,I32] // temp:i32
  ]),
  //temp = mem[a]
  LOCAL_GET,  0,
  I32_LOAD8_U,0,0,
  LOCAL_SET,  2,
  //mem[a] = mem[b]
  LOCAL_GET,  0,
  LOCAL_GET,  1,
  I32_LOAD8_U,0,0,
  I32_STORE8, 0,0,
  //mem[b] = temp
  LOCAL_GET,  1,
  LOCAL_GET,  2,
  I32_STORE8, 0,0,
  END
])

// array_index - get memory position of index of array
// array_index(l:list,i:i32)->i32
let array_index = bytevec([
  vec([]),
  // return l+8+i*l[4..7]
  LOCAL_GET,  0,
  I32_CONST,  4,
  I32_ADD,
  I32_LOAD,   0,0,
  LOCAL_GET,  1,
  I32_MUL,
  I32_CONST,  8,
  I32_ADD,
  LOCAL_GET,  0,
  I32_ADD,
  END
])

// array_len - get count of elements in array
// array_len(l:list)->i32
let array_len = bytevec([
  vec([]),
  // return l[0..3]
  LOCAL_GET,  0,
  I32_LOAD,   0,0,
  END
])

// print_strs - print a list of strings
// print_strs(l:list)
let print_strs = bytevec([
  vec([
    [2,I32] // length:i32,i:i32
  ]),
  LOCAL_GET,   0,
  CALL,        ARRAY_LEN,
  LOCAL_SET,   1,
  // loop
  BLOCK,EMPTY,
  LOOP, EMPTY,
    // if( i == length )
    LOCAL_GET, 1,
    LOCAL_GET, 2,
    I32_EQ,
    IF, EMPTY,
      BR,2,
    END,
    // print(array_get(l,i))
    LOCAL_GET, 0,
    LOCAL_GET, 2,
    CALL,      ARRAY_INDEX,
    I32_LOAD,  0,0,
    CALL,      PRINT,
    // i = i+1
    LOCAL_GET, 2,
    I32_CONST, 1,
    I32_ADD,
    LOCAL_SET, 2,
    BR,0,
  END,
  END,
  END
])

// array_set - get count of elements in array
// array_set(a:array,i:i32,v:i32)
let array_set = bytevec([
  vec([]),
  // l[array_index(l,i)+0..3] = v
  LOCAL_GET,  0,
  LOCAL_GET,  1,
  CALL,       ARRAY_INDEX,
  LOCAL_GET,  2,
  I32_STORE,  0,0,
  END
])

let app = [
  MAGIC_NUMBER,
  VERSION_1,
  SECTION_TYPE,bytevec(vec([
    [FUNC,vec([I32]),vec([I32])],
    [FUNC,vec([I32,I32,I32]),vec([])],
    [FUNC,vec([I32]),vec([])],
    [FUNC,vec([I32,I32]),vec([I32])],
    [FUNC,vec([I32,I32,I32]),vec([I32])],
    [FUNC,vec([I32,I32]),vec([])],
  ])),
  SECTION_IMPORT,bytevec(vec([
    [str("env"),str("log"),DESC_FUNCTION,2],
  ])),
  SECTION_FUNCTION,bytevec(vec([
    3, //main
    0, //malloc
    1, //memcopy
    3, //array_new
    0, //str_new
    1, //str_set_char
    0, //str_cstring
    2, //print
    3, //str_get_char
    3, //str_from_raw
    0, //str_len
    3, //str_concat
    4, //str_substr
    5, //swap
    3, //array_index
    0, //array_len
    2, //print_strs
    1, //array_set
  ])),
  SECTION_MEMORY,bytevec(vec([
    [LIMIT_MIN_MAX,2,10]
  ])),
  SECTION_GLOBAL,bytevec(vec([
    [I32,MUTABLE,I32_CONST,0,END]
  ])),
  SECTION_EXPORT,bytevec(vec([
    [str("main"),DESC_FUNCTION,1],
    [str("malloc"),DESC_FUNCTION,2],
    [str("memcopy"),DESC_FUNCTION,3],
    [str("memory"),DESC_MEMORY,0]
  ])),
  SECTION_CODE,bytevec(vec([
    main_code,
    malloc_code,
    memcopy_code,
    array_new_code,
    str_new_code,
    str_set_char,
    str_cstring,
    print,
    str_get_char,
    str_from_raw,
    str_len,
    str_concat,
    str_substr,
    swap,
    array_index,
    array_len,
    print_strs,
    array_set,
  ])),
  SECTION_DATA,bytevec(vec([
    [0,I32_CONST,int(9000),END,bytevec(raw("goodbye"))],
    [0,I32_CONST,int(10000),END,bytevec([])]
  ]))
]

fs.writeFileSync('compiler.wasm',Buffer.from(flatten(app)))
