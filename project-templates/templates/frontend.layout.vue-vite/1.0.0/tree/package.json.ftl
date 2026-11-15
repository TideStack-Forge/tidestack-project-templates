{
  "name": ${esc.json(packageName)},
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "vite --host 0.0.0.0",
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "test:contract": "node --test tests/layout-parcels-contract.test.cjs"
  },
  "dependencies": {
    "ouroboros-sdk": "^1.6.0-beta.6",
    "qiankun": "^2.10.16",
    "vue": "^3.5.40"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.8",
    "vite": "^8.1.5"
  }
}
