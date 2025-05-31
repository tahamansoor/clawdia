/**
 * you'll be import Clawdia
 * like ```import { Clawdia } from "@tahamansoor/clawdia";```
 * after installing it using npm install @tahamansoor/clawdia
 * don't forget to use .npmrc for now. it'll be later put on npm registry so you won't need .npmrc in future
 */

import { Clawdia } from "../clawdia";
import { Logger } from "../logger";
import { UserRouter } from "./user.router";

/**
 * create an instance of Clawdia
 */
const server = new Clawdia({
  port: 3003, // default port will 3003 if not prvided
  routers: [UserRouter], // list of routers
  db: {
    // database configuration
    connectionURI:
      "postgresql://neondb_owner:KWGB9vQnf1ET@ep-floral-credit-a5227uyn-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
    options: {
      query_timeout: 100000,
    },
  },
});

// Start the server
server
  .listen()
  .then(() => Logger.info("Server started successfully"))
  .catch((err) => Logger.error("Failed to start server:", err));
