extern crate parity_wasm;
extern crate wasmi;
use std::env;
use std::fs::File;
use std::io;
use std::io::prelude::*;
use wasmi::{ExternVal, ImportsBuilder, MemoryInstance, ModuleInstance, NopExternals};

fn main() -> io::Result<()> {
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
    let main = ModuleInstance::new(&loaded_module, &ImportsBuilder::default())
        .expect("Failed to instantiate module")
        .run_start(&mut NopExternals)
        .expect("Failed to run start function in module");

    // put code text at start of memory
    if let Some(ExternVal::Memory(i)) = main.export_by_name("memory") {
        let m: &MemoryInstance = &i;
        // set first u32 as the length of the text
        m.set_value(0,buffer.len() as u32).unwrap();
        // set mem[4] = 0 representing not free
        // set code text in memory starting at mem[5]
        m.set(5, &buffer).unwrap();
    }

    // call main
    main.invoke_export("main", &vec![], &mut NopExternals)
        .expect("");

    if let Some(ExternVal::Memory(i)) = main.export_by_name("memory") {
        let m: &MemoryInstance = &i;
        // read how long our wasm binary is
        let length: u32 = m.get_value(0).unwrap();
        // get the wasm binary
        let output_bytes = m.get(4, length as usize).unwrap();
        // write to file
        let mut buffer = File::create(output)?;
        buffer.write(&output_bytes)?;
    }
    Ok(())
}
