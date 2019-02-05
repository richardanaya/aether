var fs = require('fs');
let {flatten,str,vec,bytevec,int,uint,I32,FUNC,DESC_FUNCTION,END,I32_CONST,SECTION_TYPE,
  SECTION_FUNCTION,SECTION_EXPORT,SECTION_CODE,MAGIC_NUMBER,VERSION_1,DESC_MEMORY,
  SECTION_MEMORY,LIMIT_MIN_MAX,SECTION_GLOBAL,MUTABLE,NOP,BLOCK,GLOBAL_GET,
  LOCAL_SET,LOCAL_GET,LOOP,I32_LOAD8_U,SET_LOCAL,I32_STORE8,EMPTY,BR,IF,I32_EQ,
  SECTION_IMPORT,THEN,I32_STORE,I32_ADD,I32_MUL,raw,IMMUTABLE,GLOBAL_SET,DESC_GLOBAL,SECTION_DATA,
  CALL} = require("wasmly");

let LOG = 0
let MAIN = 1
let MALLOC = 2
let MEMCOPY = 3
let ARRAY_NEW = 4
let STR_NEW = 5

// main(file_start:i32) -> wasm_start:i32
let main_code = bytevec([
  vec([
    [1,I32]
  ]), //s:str
  // s = str_new(7)
  I32_CONST, 7,
  CALL,      STR_NEW,
  LOCAL_SET, 1,
  //s[0] = "*"
  LOCAL_GET, 1,
  I32_CONST, 42,
  I32_STORE8, 0, 0,
  //log()
  LOCAL_GET, 1,
  CALL, LOG,
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
  // memorycurrent_heap = length
  GLOBAL_GET, 0,
  LOCAL_GET,  0,
  I32_STORE,  0, 0,
  // global.heap = current_heap + 1 + length
  LOCAL_GET,  1,
  I32_CONST,  1,
  I32_ADD,
  LOCAL_GET,  0,
  I32_ADD,
  GLOBAL_SET, 0,
  // return current_heap + 1
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
    [1,I32]
  ]),
  // s = malloc(4+length*size)
  LOCAL_GET, 0,
  LOCAL_GET, 1,
  I32_MUL,
  I32_CONST, 4,
  I32_ADD,
  CALL, MALLOC,
  LOCAL_SET,2,
  // s[0..3] = length
  LOCAL_GET,2,
  LOCAL_GET,0,
  I32_STORE, 0, 0,
  // return s
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


// str_data - returns the memory position of the strings data
// str_data(s:i32) -> mem_position:i32
let str_data = bytevec([
  vec([]),
  // return s+4
  // data starts after array length
  LOCAL_GET, 0,
  I32_CONST, 4,
  I32_ADD,
  END
])

// str_set_char - returns a character of index of string
// str_set_char(s:i32,i:i32,byte:i32)
let str_set_char = bytevec([
  vec([]),
  //return array_new(length+1,1) //we add 1 so there's a zero character at end
  LOCAL_GET, 0,
  I32_CONST, 1,
  I32_ADD,
  I32_CONST, 1,
  CALL, ARRAY_NEW,
  END
])

// str_get_char - returns a character of index of string
// str_get_char(s:i32,i:i32) -> reference:i32
let str_get_char = bytevec([
  vec([]),
  //return array_new(length+1,1) //we add 1 so there's a zero character at end
  LOCAL_GET, 0,
  I32_CONST, 1,
  I32_ADD,
  I32_CONST, 1,
  CALL, ARRAY_NEW,
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
  ])),
  SECTION_IMPORT,bytevec(vec([
    [str("env"),str("log"),DESC_FUNCTION,2],
  ])),
  SECTION_FUNCTION,bytevec(vec([
    int(0), //main
    int(0), //malloc
    int(1), //memcopy
    int(3), //array_new
    int(0), //str_new
  ])),
  SECTION_MEMORY,bytevec(vec([
    [LIMIT_MIN_MAX,uint(2),uint(10)]
  ])),
  SECTION_GLOBAL,bytevec(vec([
    [I32,MUTABLE,I32_CONST, int(0),END]
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
  ])),
  SECTION_DATA,bytevec(vec([
    [uint(0),I32_CONST,int(9000),END,bytevec(raw("goodbye"))],
    [uint(0),I32_CONST,int(10000),END,bytevec([])]
  ]))
]

fs.writeFileSync('compiler.wasm',Buffer.from(flatten(app)))
