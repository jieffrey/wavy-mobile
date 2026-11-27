const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// three >= 0.18x: entry `require` (build/three.cjs) memanggil process.emitWarning, yang tidak ada di
// React Native, dan @react-three/fiber/native memakai require('three'). Arahkan import persis 'three'
// ke build ESM supaya three.cjs tidak pernah masuk bundle. Subpath (three/examples/jsm/*, three/addons,
// three/webgpu) tidak disentuh dan tetap lewat resolusi `exports` biasa.
// require.resolve('three') di Node = build/three.cjs, jadi folder build/ diambil dari situ.
const THREE_ESM = path.join(path.dirname(require.resolve('three')), 'three.module.js');

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: THREE_ESM };
  return (upstreamResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
