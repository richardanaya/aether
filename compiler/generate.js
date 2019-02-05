var fs = require('fs');
let seed = require("@richardanaya/seed");
let {flatten,str,vec,bytevec,int,uint,I32,FUNC,EXPORT_FUNCTION,END,I32_CONST,SECTION_TYPE,
  SECTION_FUNCTION,SECTION_EXPORT,SECTION_CODE,MAGIC_NUMBER,VERSION_1,EXPORT_MEMORY,
  SECTION_MEMORY,LIMIT_MIN_MAX,SECTION_GLOBAL,MUTABLE,NOP,BLOCK,GLOBAL_GET,
  LOCAL_SET,LOCAL_GET,LOOP,I32_LOAD8_U,SET_LOCAL,I32_STORE8,EMPTY,BR,IF,I32_EQ,THEN,I32_STORE,I32_ADD,IMMUTABLE,GLOBAL_SET,EXPORT_GLOBAL,SECTION_DATA} = seed;

// main(file_start:i32) -> wasm_start:i32
let main_code = bytevec([
  vec([]),
  I32_CONST,  int(5),
  END
])

// malloc(length:i32) -> i32
let malloc_code = bytevec([
  vec([
    [1, I32] // current_heap:i32
  ]),
  // current_heap = global.heap
  [GLOBAL_GET, int(0)],
  [LOCAL_SET,  int(1)],
  // memory[current_heap] = length
  [GLOBAL_GET, int(0)],
  [LOCAL_GET,  int(0)],
  [I32_STORE,  int(0), int(0)],
  // global.heap = current_heap + 1 + length
  [LOCAL_GET,  int(1)],
  [I32_CONST,  int(1)],
  [I32_ADD],
  [LOCAL_GET,  int(0)],
  [I32_ADD],
  [GLOBAL_SET, int(0)],
  // return current_heap + 1
  [LOCAL_GET,  int(1)],
  [I32_CONST,  int(5)],
  [I32_ADD],
  END
])

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

let app = [
  MAGIC_NUMBER,
  VERSION_1,
  SECTION_TYPE,bytevec(vec([
    [FUNC,vec([I32]),vec([I32])],
    [FUNC,vec([I32,I32,I32]),vec([])],
  ])),
  SECTION_FUNCTION,bytevec(vec([
    int(0), //main
    int(0), //malloc
    int(1), //memcopy
  ])),
  SECTION_MEMORY,bytevec(vec([
    [LIMIT_MIN_MAX,uint(2),uint(10)]
  ])),
  SECTION_GLOBAL,bytevec(vec([
    [I32,MUTABLE,I32_CONST, int(0),END]
  ])),
  SECTION_EXPORT,bytevec(vec([
    [str("main"),EXPORT_FUNCTION,0],
    [str("malloc"),EXPORT_FUNCTION,1],
    [str("memcopy"),EXPORT_FUNCTION,2],
    [str("memory"),EXPORT_MEMORY,0]
  ])),
  SECTION_CODE,bytevec(vec([
    main_code,
    malloc_code,
    memcopy_code,
  ])),
  SECTION_DATA,bytevec(vec([
    [uint(0),I32_CONST,int(9000),END,str("goodbye")],
    [uint(0),I32_CONST,int(10000),END,bytevec([])]
  ]))
]

fs.writeFileSync('compiler.wasm',Buffer.from(flatten(app)))
