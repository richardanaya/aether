var fs = require('fs');
let seed = require("@richardanaya/seed");
let {flatten,str,vec,bytevec,int,uint,I32,FUNC,EXPORT_FUNCTION,END,I32_CONST,SECTION_TYPE,
  SECTION_FUNCTION,SECTION_EXPORT,SECTION_CODE,MAGIC_NUMBER,VERSION_1,EXPORT_MEMORY,
  SECTION_MEMORY,LIMIT_MIN_MAX,I32_STORE,I32_STORE8} = seed;

// main() -> i32 { return 42 }
let main_function_index = 0
let main_export = [str("main"),EXPORT_FUNCTION,main_function_index]
let main_function_signature = [FUNC,vec([]),vec([])] // function signature returns 42
let main_function_code = bytevec([
  vec([]),              // no local variables
  [I32_CONST, int(0)],
  [I32_CONST, int(12)],
  [I32_STORE,  int(0), int(0)],
  [I32_CONST, int(4)],
  [I32_CONST, int(42)],
  [I32_STORE8,  int(0), int(0)],
  [I32_CONST, int(5)],
  [I32_CONST, int(43)],
  [I32_STORE8,  int(0), int(0)],
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

// put it all together as a module
let app = [
  MAGIC_NUMBER,
  VERSION_1,
  type_section,
  functions_section,
  memory_section,
  export_section,
  code_section
]

// print it out for debugging
console.log(JSON.stringify(app));

// write it to test.wasm
fs.writeFileSync('compiler.wasm',Buffer.from(flatten(app)))
