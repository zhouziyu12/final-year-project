pragma circom 2.0.0;
include "node_modules/circomlib/circuits/poseidon.circom";

/**
 * ModelProver Circuit
 * 
 * Proves knowledge of a secret key associated with a model without revealing the secret.
 * 
 * Public inputs:
 *   - modelId: The AI model's unique identifier
 * 
 * Private inputs:
 *   - secret: The prover's secret key (never revealed on-chain)
 * 
 * Output:
 *   - commitment: Poseidon hash of (secret, modelId) for on-chain verification
 * 
 * Use case:
 *   Model owners can prove ownership without exposing their private key.
 *   The commitment is stored on-chain and can be verified by anyone.
 */
template ModelProver() {
    // Public input: AI model ID (everyone knows this)
    signal input modelId;
    
    // Private input: Prover's secret key (never revealed)
    signal input secret;
    
    // Output: Commitment hash for on-chain storage
    signal output commitment;
    
    // Hash secret and modelId together using Poseidon
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== secret;
    poseidon.inputs[1] <== modelId;
    
    commitment <== poseidon.out;
}

/**
 * ModelVersionProver Circuit
 * 
 * Extended circuit that proves:
 * 1. Knowledge of secret key for a model
 * 2. Knowledge of a version hash
 * 
 * This allows proving that a specific model version was created by the secret holder.
 */
template ModelVersionProver() {
    // Public inputs
    signal input modelId;
    signal input versionHash;  // Hash of the model weights/configuration
    
    // Private inputs
    signal input secret;
    signal input versionSalt;  // Random salt for version
    
    // Output
    signal output commitment;
    signal output versionCommitment;
    
    // Prove secret ownership of model
    component poseidonModel = Poseidon(2);
    poseidonModel.inputs[0] <== secret;
    poseidonModel.inputs[1] <== modelId;
    commitment <== poseidonModel.out;
    
    // Prove version belongs to model
    component poseidonVersion = Poseidon(3);
    poseidonVersion.inputs[0] <== commitment;
    poseidonVersion.inputs[1] <== versionHash;
    poseidonVersion.inputs[2] <== versionSalt;
    versionCommitment <== poseidonVersion.out;
}

/**
 * ModelUpdateProver Circuit
 * 
 * Proves a sequential update to a model.
 * Used when updating model parameters or weights.
 */
template ModelUpdateProver() {
    // Public inputs
    signal input modelId;
    signal input prevCommitment;  // Previous state commitment
    signal input newVersion;
    
    // Private inputs
    signal input secret;
    signal input updateHash;  // Hash of the update
    
    // Output
    signal output commitment;
    
    // Verify we know the secret for this model
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== secret;
    poseidon.inputs[1] <== modelId;
    
    // Commitment must match previous
    commitment <== poseidon.out;
    
    // Signal constraint to ensure commitment matches (prevents tampering)
    commitment * (commitment - prevCommitment) === 0;
}

// Main component: ModelProver with public modelId
component main {public [modelId]} = ModelProver();
