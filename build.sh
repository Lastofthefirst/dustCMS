#!/bin/bash

set -e

echo "Building dustCMS..."

# Install dependencies
echo "Installing dependencies..."
bun install

# Build single binary
echo "Compiling to single binary..."
bun build src/main.ts --compile --outfile cms-server

echo "Build complete! Binary: ./cms-server"
echo ""
echo "Usage:"
echo "  ./cms-server setup    - Run setup wizard"
echo "  ./cms-server          - Start server"
