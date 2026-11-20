import path from 'path';
import { defineConfig } from 'vitest/config';

// Config própria do vitest, à parte da do Next: os testes da nota são de
// função pura e não tocam no DOM, então basta o alias "@" e o ambiente node.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
