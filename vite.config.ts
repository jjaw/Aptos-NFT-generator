import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
  },
  plugins: [
    react(),
    // Custom plugin to handle API routes in development
    {
      name: 'api-routes',
      configureServer(server) {
        server.middlewares.use('/api', async (req, res, next) => {
          if (req.url?.startsWith('/api/nft/')) {
            try {
              // Dynamically import and execute the API function
              const apiPath = req.url.replace('/api/', './api/').replace(/\?.*$/, '');
              let modulePath;
              
              if (apiPath.includes('/collection/list')) {
                modulePath = './api/nft/collection/list.js';
              } else if (apiPath.includes('/collection/traits')) {
                modulePath = './api/nft/collection/traits.js';
              } else if (apiPath.includes('/collection/stats')) {
                modulePath = './api/nft/collection/stats.js';
              } else if (apiPath.includes('/rarity/refresh')) {
                modulePath = './api/nft/rarity/refresh.js';
              } else if (apiPath.match(/\/metadata\/\d+$/)) {
                modulePath = './api/nft/metadata/[id].js';
              } else {
                return next();
              }

              console.log(`Executing API function: ${modulePath} for ${req.url}`);
              
              // Import the API function
              const apiModule = await import(path.resolve(process.cwd(), modulePath));
              const apiFunction = apiModule.default;
              
              // Create mock request/response objects
              const mockReq = {
                method: req.method,
                query: new URLSearchParams(req.url?.split('?')[1] || ''),
                url: req.url,
                headers: req.headers
              };
              
              // Convert URLSearchParams to object for easier access
              const queryObj = {};
              mockReq.query.forEach((value, key) => {
                if (queryObj[key]) {
                  if (Array.isArray(queryObj[key])) {
                    queryObj[key].push(value);
                  } else {
                    queryObj[key] = [queryObj[key], value];
                  }
                } else {
                  queryObj[key] = value;
                }
              });
              mockReq.query = queryObj;
              
              const mockRes = {
                setHeader: (key, value) => res.setHeader(key, value),
                status: (code) => ({
                  json: (data) => {
                    res.statusCode = code;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                  end: (data) => {
                    res.statusCode = code;
                    res.end(data);
                  }
                }),
                json: (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                end: (data) => res.end(data)
              };
              
              await apiFunction(mockReq, mockRes);
            } catch (error) {
              console.error('API execution error:', error);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal server error', details: error.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"),
    },
  },
});
