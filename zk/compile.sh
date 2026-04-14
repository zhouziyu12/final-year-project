#!/bin/bash

# ============================================
# ZK Circuit Compilation Script
# ============================================
# This script compiles the Circom circuit and generates proving/verification keys.
#
# Prerequisites:
#   - circom (https://docs.circom.io/getting-started/installation/)
#   - snarkjs (npm install -g snarkjs)
#   - powers of tau ceremony file (pot12_final.ptau)
#
# Usage:
#   ./compile.sh [circuit_name]
#
# Example:
#   ./compile.sh circuit
# ============================================

set -e

CIRCUIT_NAME=${1:-circuit}
BUILD_DIR="./build"
PTAU_FILE="./pot12_final.ptau"

echo "🔧 ZK Circuit Compilation"
echo "=========================="
echo "Circuit: $CIRCUIT_NAME"
echo "Build dir: $BUILD_DIR"
echo ""

# Create build directory
mkdir -p "$BUILD_DIR"
mkdir -p "$BUILD_DIR/${CIRCUIT_NAME}_cpp"
mkdir -p "$BUILD_DIR/${CIRCUIT_NAME}_js"

# Step 1: Compile circuit
echo "📦 Step 1: Compiling circuit..."
circom "$CIRCUIT_NAME.circom" \
    --r1cs \
    --wasm \
    --sym \
    --c "$BUILD_DIR/${CIRCUIT_NAME}_cpp" \
    -o "$BUILD_DIR"

echo "✅ Circuit compiled successfully!"

# Step 2: Generate proving key (requires PTAU)
echo ""
echo "🔐 Step 2: Generating proving key..."
if [ ! -f "$PTAU_FILE" ]; then
    echo "⚠️  PTAU file not found. Skipping trusted setup."
    echo "   Download pot12_final.ptau from:"
    echo "   https://github.com/iden3/snarkjs#7-prepare-phase-2"
else
    # Start new ceremony or use existing
    if [ -f "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey" ]; then
        echo "Found existing zkey, contributing..."
        npx snarkjs zkey contribute \
            "$BUILD_DIR/${CIRCUIT_NAME}_0000.zkey" \
            "$BUILD_DIR/${CIRCUIT_NAME}_0001.zkey" \
            --name="First contribution" -e="random entropy"
        
        npx snarkjs zkey contribute \
            "$BUILD_DIR/${CIRCUIT_NAME}_0001.zkey" \
            "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" \
            --name="Second contribution" -e="more random entropy"
    else
        # Start from scratch (needs ceremony)
        echo "⚠️  Starting new zkey requires a trusted setup ceremony."
        echo "   Using existing pot12_final.ptau for verification key generation."
    fi
    
    # Export verification key
    if [ -f "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" ]; then
        echo "📝 Exporting verification key..."
        npx snarkjs zkey export verificationkey \
            "$BUILD_DIR/${CIRCUIT_NAME}_final.zkey" \
            "$BUILD_DIR/verification_key.json"
        
        echo "✅ Verification key exported to: $BUILD_DIR/verification_key.json"
    fi
fi

# Step 3: Generate sample input
echo ""
echo "📝 Step 3: Creating sample input..."
cat > "$BUILD_DIR/input.json" << 'EOF'
{
    "modelId": 123,
    "secret": 42,
    "messageHash": 424242
}
EOF

echo "✅ Sample input created: $BUILD_DIR/input.json"

# Step 4: Generate witness (if wasm exists)
echo ""
echo "🧮 Step 4: Testing witness generation..."
if [ -f "$BUILD_DIR/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm" ]; then
    npx snarkjs wtns calculate \
        "$BUILD_DIR/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm" \
        "$BUILD_DIR/input.json" \
        "$BUILD_DIR/witness.wtns"
    
    echo "✅ Witness generated: $BUILD_DIR/witness.wtns"
else
    echo "⚠️  WASM not found, skipping witness generation"
fi

echo ""
echo "🎉 Compilation complete!"
echo ""
echo "Next steps:"
echo "  1. Run: npx snarkjs zkey export solidityverifier \\"
echo "           $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \\"
echo "           contracts/Verifier.sol"
echo "  2. Deploy Verifier.sol to your blockchain"
echo "  3. Use the frontend to generate proofs"
