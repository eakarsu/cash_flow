import 'express-serve-static-core';
declare module 'express-serve-static-core' {
  interface Request {
    userTokens?: any; // Or type this more strictly if you know the shape
  }
}
