var fs = require('fs');
let seed = require("@richardanaya/seed");
let {flatten,str,vec,bytevec,int,uint,I32,FUNC,EXPORT_FUNCTION,END,I32_CONST,SECTION_TYPE,
  SECTION_FUNCTION,SECTION_EXPORT,SECTION_CODE,MAGIC_NUMBER,VERSION_1,EXPORT_MEMORY,
  SECTION_MEMORY,LIMIT_MIN_MAX,I32_STORE,I32_STORE8,SECTION_DATA} = seed;

let code_data_start = 10000;
let code_total_bytes_idx = 44;
let compiled_start = [0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,5,4,1,1,2,10,7,17,2,4,109,97,105,110,0,0,6,109,101,109,111,114,121,2,0,10,6,1]
let code_data = [uint(0),I32_CONST,int(code_data_start),END,bytevec(compiled_start)]

// main() -> i32 { return 42 }
let main_function_index = 0
let main_export = [str("main"),EXPORT_FUNCTION,main_function_index]
let main_function_signature = [FUNC,vec([]),vec([])] // function signature returns 42
let main_function_code = bytevec([
  vec([
    [10, I32] // 10 local variables to use x0..x9
  ]),
  I32_CONST, int(0),
  I32_CONST, int(44),
  I32_STORE8, int(0), int(0),
  END
])

//lets make memory at least 2 pages and at most 10 pages long
let memory = [LIMIT_MIN_MAX,uint(2),uint(10)]
// export our memory as "memory" so host can read/modify
let memory_export = [str("memory"),EXPORT_MEMORY,0]

// function signatures go in this section
let type_section = [SECTION_TYPE,bytevec(vec([main_function_signature]))];

// we only have one function (main), and its going to use the first type
let functions_section = [SECTION_FUNCTION,bytevec(vec([int(main_function_index)]))];

let memory_section = [SECTION_MEMORY,bytevec(vec([memory]))]

let export_section = [SECTION_EXPORT,bytevec(vec([main_export,memory_export]))]

// we only have our main function code
let code_section = [SECTION_CODE,bytevec(vec([main_function_code]))]

let data_section = [SECTION_DATA,bytevec(vec([code_data]))]

// put it all together as a module
let app = [
  MAGIC_NUMBER,
  VERSION_1,
  type_section,
  functions_section,
  memory_section,
  export_section,
  code_section,
  data_section
]

// print it out for debugging
console.log(JSON.stringify(flatten(app)));

// write it to test.wasm
fs.writeFileSync('compiler.wasm',Buffer.from(flatten(app)))
