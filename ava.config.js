module.exports = {
  extensions: ['ts'],
  files: ['**/test/**', '!**/fixtures/**', '!**/helpers/**', '!**/recipes/**', '!**/types.ts'],
  require: ['@swc-node/register']
};
