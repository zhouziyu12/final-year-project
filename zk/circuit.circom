pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

template ModelProver() {
    // Private input: 你的密钥 (只有你知道)
    signal input secret;
    // Public input: 模型ID (大家都知道)
    signal input modelId;
    // Output: 承诺/Hash (上链验证用)
    signal output commitment;

    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== secret;
    poseidon.inputs[1] <== modelId;

    commitment <== poseidon.out;
}

component main {public [modelId]} = ModelProver();
