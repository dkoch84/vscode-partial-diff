#!/usr/bin/env bash

# Test script to validate the release workflow asset path logic
# This script simulates the release workflow and verifies that the asset_path
# points to a file that actually exists after packaging.
#
# This test ensures that issue #8 (release workflow fails to find asset) is fixed.

set -e

echo "=== Testing Release Workflow Asset Path Logic ==="
echo "This test validates the fix for issue #8: Release workflow fails to find asset"
echo

# Get the package version (simulate the workflow step)
PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo "📦 Package version from package.json: $PACKAGE_VERSION"

# Check that .vsix files exist (should be created by the packaging step)
VSIX_FILES=(*.vsix)
if [ ! -f "${VSIX_FILES[0]}" ]; then
    echo "❌ ERROR: No .vsix files found. Make sure 'yarn package' was run first."
    exit 1
fi

echo "📁 Available .vsix files: ${VSIX_FILES[*]}"
echo

# Test the workflow logic from .github/workflows/release.yml
echo "🔍 Testing current release workflow logic..."

# This is the asset_path logic from the workflow:
# asset_path: ./partial-diff-${{ steps.package-version.outputs.version }}.vsix
EXPECTED_ASSET_PATH="./partial-diff-${PACKAGE_VERSION}.vsix"
EXPECTED_FILE="partial-diff-${PACKAGE_VERSION}.vsix"

echo "   Expected asset_path: $EXPECTED_ASSET_PATH"

if [ -f "$EXPECTED_FILE" ]; then
    echo "   ✅ SUCCESS: Asset file exists at expected path"
    FILE_SIZE=$(du -h "$EXPECTED_FILE" | cut -f1)
    echo "   📊 File size: $FILE_SIZE"
else
    echo "   ❌ FAILURE: Asset file does not exist at expected path"
    echo "   🔍 Available files:"
    ls -la *.vsix 2>/dev/null || echo "      (no .vsix files found)"
    exit 1
fi

echo

# Test scenarios with different tag name formats
echo "🏷️  Testing asset_name with different tag formats..."
echo "   (asset_name is the download name and doesn't need to match a file)"

# Common tag patterns used in GitHub releases
TEST_TAGS=("v${PACKAGE_VERSION}" "v1.4.0" "v1.5.0" "${PACKAGE_VERSION}")

for TAG in "${TEST_TAGS[@]}"; do
    # This is the asset_name logic from the workflow:
    # asset_name: partial-diff-${{ github.event.release.tag_name }}.vsix
    ASSET_NAME="partial-diff-${TAG}.vsix"
    echo "   📋 Tag '$TAG' -> asset_name: $ASSET_NAME"
done

echo

# Demonstrate what would happen with the old broken logic
echo "⚠️  Testing old broken logic (what caused the original issue)..."
echo "   If asset_path used tag_name instead of package version:"

for TAG in "${TEST_TAGS[@]}"; do
    BROKEN_ASSET_PATH="./partial-diff-${TAG}.vsix"
    BROKEN_FILE="partial-diff-${TAG}.vsix"
    
    if [ -f "$BROKEN_FILE" ]; then
        STATUS="✅ would work"
    else
        STATUS="❌ would fail (file not found)"
    fi
    
    echo "   🏷️  Tag '$TAG' -> asset_path: $BROKEN_ASSET_PATH ($STATUS)"
done

echo

# Verify workflow file syntax
echo "📋 Verifying .github/workflows/release.yml..."

WORKFLOW_FILE=".github/workflows/release.yml"

# Check that workflow uses package version for asset_path
if grep -q "steps\.package-version\.outputs\.version" "$WORKFLOW_FILE"; then
    echo "   ✅ asset_path uses package.json version (correct)"
else
    echo "   ❌ asset_path does not use package.json version"
    exit 1
fi

# Check that workflow uses tag_name for asset_name
if grep -q "github\.event\.release\.tag_name" "$WORKFLOW_FILE"; then
    echo "   ✅ asset_name uses release tag name (correct)"
else
    echo "   ❌ asset_name does not use release tag name"
    exit 1
fi

echo

echo "🎉 All tests passed!"
echo "   The release workflow should now work correctly with any tag format."
echo "   Issue #8 (Release workflow fails to find asset) is fixed."