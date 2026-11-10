import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';export default defineConfig({plugins:[react()],build:{outDir:'../dist',emptyOutDir:true},server:{allowedHosts:['terminal.local'],proxy:{'/api':'http://127.0.0.1:4001'}}});
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

