npm ci
./test.sh || exit 1
npm version ${VERSION:-patch}
npm publish --access public