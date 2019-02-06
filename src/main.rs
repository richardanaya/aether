extern crate parity_wasm;
extern crate wasmi;
use std::env;
use std::fs::File;
use std::io;
use std::io::prelude::*;
use std::str;
use wasmi::{ExternVal, FuncRef, ModuleImportResolver, Error as InterpreterError,ValueType,Signature,FuncInstance,ImportsBuilder,Externals, Trap, RuntimeArgs,MemoryInstance, ModuleInstance, NopExternals,RuntimeValue};

struct ExternalHandler<'a> {
    module: &'a ModuleInstance,
}

impl<'a> Externals for ExternalHandler<'a> {
    fn invoke_index(
        &mut self,
        index: usize,
        args: RuntimeArgs,
    ) -> Result<Option<RuntimeValue>, Trap> {
        match index {
            LOG_FUNC_INDEX => {
                let mut idx: i32 = args.nth(0);
                let mut buf:Vec<u8> = vec![];
                if let Some(ExternVal::Memory(i)) = self.module.export_by_name("memory") {
                    let m: &MemoryInstance = &i;
                    loop {
                            let c: u8 = m.get_value((idx) as u32).unwrap();
                            if c == 0 {
                                break;
                            }
                            buf.push(c);
                            idx += 1;
                    }
                }
                println!("{}", str::from_utf8(&buf).unwrap());
                Ok(None)
            }
            _ => panic!("unknown function index"),
        }
    }
}

struct RuntimeModuleImportResolver;

const LOG_FUNC_INDEX: usize = 0;

impl<'a> ModuleImportResolver for RuntimeModuleImportResolver {
    fn resolve_func(
        &self,
        field_name: &str,
        _signature: &Signature,
    ) -> Result<FuncRef, InterpreterError> {
        let func_ref = match field_name {
            "log" => FuncInstance::alloc_host(
                Signature::new(&[ValueType::I32][..], None),
                LOG_FUNC_INDEX,
            ),
            _ => {
                return Err(InterpreterError::Function(format!(
                    "host module doesn't export function with name {}",
                    field_name
                )));
            }
        };
        Ok(func_ref)
    }
}


fn main() -> io::Result<()> {
    let mut imports = ImportsBuilder::new();
    imports.push_resolver("env", &RuntimeModuleImportResolver);
    // include the bytes of our compiler
    let compiler_bytes = include_bytes!("compiler.wasm");

    // get args
    let args: Vec<String> = env::args().collect();
    if args.len() != 3 {
        println!("aether <input.b> <output.wasm>");
        return Ok(());
    }
    let input = &args[1];
    let output = &args[2];

    // read the text of input file to compile
    let mut f = File::open(input)?;
    let mut buffer = Vec::new();
    f.read_to_end(&mut buffer)?;

    // load web assembly module
    let module = parity_wasm::deserialize_buffer(compiler_bytes).expect("File to be deserialized");
    let loaded_module = wasmi::Module::from_parity_wasm_module(module).expect("Module to be valid");
    let main = ModuleInstance::new(&loaded_module, &imports)
        .expect("Failed to instantiate module")
        .run_start(&mut NopExternals)
        .expect("Failed to run start function in module");
    let mut externals = ExternalHandler {
        module:&main
    };

    // call malloc to get a place to put our input
    let input_start = match main.invoke_export("malloc", &vec![RuntimeValue::I32(buffer.len() as i32)], &mut externals)
        .expect("").unwrap() {
        RuntimeValue::I32(i) => i,
        _ => panic!("not sure why i got this")
    };

    // put code text at start of memory from malloc
    if let Some(ExternVal::Memory(i)) = main.export_by_name("memory") {
        let m: &MemoryInstance = &i;
        m.set(input_start as u32, &buffer).unwrap();
    }

    // call main
    let output_start = match main.invoke_export("main", &vec![RuntimeValue::I32(input_start),RuntimeValue::I32(buffer.len() as i32)], &mut externals)
        .expect("").unwrap() {
        RuntimeValue::I32(i) => i,
        _ => panic!("not sure why i got this")
    };

    if let Some(ExternVal::Memory(i)) = main.export_by_name("memory") {
        let m: &MemoryInstance = &i;
        // read how long our wasm binary is
        let length: u32 = m.get_value((output_start-5) as u32).unwrap();
        // get the wasm binary
        let output_bytes = m.get(output_start as u32, length as usize).unwrap();
        // write to file
        let mut buffer = File::create(output)?;
        buffer.write(&output_bytes)?;
    }
    Ok(())
}
