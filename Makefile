build:
	cd compiler && node generate.js && cp compiler.wasm ../src/compiler.wasm
	cargo build --release
	cp target/release/aether aether
	./aether examples/helloworld/helloworld.ae examples/helloworld/helloworld.wasm
