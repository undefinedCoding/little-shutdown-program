echo "Build electron application:"
echo "-> Install dependencies..."
npm install
echo "-> Windows x64 nsis and unpacked build..."
npm run build-win
echo "Build finished"
