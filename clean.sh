echo "Clean repository (remove unnecessary files):"
echo "-> Remove node modules directory..."
rm -rf node_modules
echo "-> Remove build directory..."
rm -rf dist
echo "-> Remove package.json file..."
rm -f package-lock.json
echo "Repository cleaned"
