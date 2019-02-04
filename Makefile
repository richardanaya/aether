build:
	cd compiler && node generate.js && cp compiler.wasm ../cli/src/compiler.wasm
	cd cli && cargo build --release
	cp cli/target/release/aether aether
	./aether examples/helloworld/helloworld.b examples/helloworld/helloworld.wasm
