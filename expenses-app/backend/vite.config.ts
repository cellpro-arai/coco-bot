import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
    },
    // ソースマップは本番環境では不要
    sourcemap: false,
    minify: false,
    // 出力ディレクトリ
    outDir: '../dist',
    rollupOptions: {
      output: {
        entryFileNames: 'Code.gs',
        format: 'es',
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
