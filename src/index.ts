// import index from "./glowing-cube.html";
import index from "./glowing-cube-2.html";

Bun.serve({
  routes: {
    "/": index,
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Server running at http://localhost:3000");
