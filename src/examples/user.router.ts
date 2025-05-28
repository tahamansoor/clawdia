import { Router } from "../router";
import { User } from "./user.model";
import { RouterConfig } from "../decorators";
import { Get, Post } from "../decorators"; // Assuming these decorators exist
import { RequestContext, ResponseContext } from "../interfaces";
import { Logger } from "../logger";
import { log } from "node:console";

/**
 * Example UserRouter extending Router with correct decorator usage
 *
 * 1. Apply the RouterConfig decorator to the router class, not a method
 * 2. Use the correct generic parameter (typeof User)
 * 3. Provide both required options: model and route
 */
@RouterConfig({
  model: User,
  route: "/users",
})
export class UserRouter extends Router<typeof User> {
  /**
   * Example GET method to fetch all users
   */
  @Get("/")
  async getAllUsers(req: RequestContext, res: ResponseContext) {
    // The model property is available from the base Router class
    const users = await this.model.findAll();
    res.return(200, users);
  }

  /**
   * Example POST method to create a user
   */
  @Post("/")
  async createUser(req: RequestContext, res: ResponseContext) {
    const userData = req.body;
    Logger.info("Creating user", JSON.stringify(userData));
    const newUser = await this.model.create(userData);
    res.return(201, newUser);
  }
}
