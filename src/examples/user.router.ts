import { Router } from "../router";
import { User } from "./user.model";
import { RouterConfig, UseMiddleware } from "../decorators";
import { Get, Post } from "../decorators";
import { RequestContext, ResponseContext } from "../interfaces";
import { Logger } from "../logger";
import { LoggerMiddleware } from "./logger.middleware";

/**
 * Example UserRouter extending Router with correct decorator usage
 */
@RouterConfig({
  model: User,
  route: "/users",
})
@UseMiddleware(LoggerMiddleware) // Apply middleware to all routes in this router
export class UserRouter extends Router<typeof User> {
  /**
   * Example GET method to fetch all users
   */
  @Get("/")
  async getAllUsers(req: RequestContext, res: ResponseContext) {
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
