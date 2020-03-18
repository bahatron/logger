npm ci
./test.sh || exit 1
npm version ${VERSION:-patch} || exit 1
npm publish --access public