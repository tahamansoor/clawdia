# Example

This example demonstrates the correct use of Clawdia

## Key Points

1. **Decorator Application**:
   - The `@RouterConfig` decorator must be applied to the router class itself, not to any methods.
   - It must be placed immediately before the class declaration.

2. **Model Configuration**:
   - Pass the actual model class (not an instance) to the `model` property.
   - The model class must extend `BaseModel`.

3. **Router Extension**:
   - Your router class must extend the `Router<typeof YourModel>` base class.
   - Use the correct generic parameter - `typeof YourModel`, not just `YourModel`.

4. **Server Configuration**:
   - When configuring the `Clawdia` server, pass the router class itself, not an instance.
   - Example: `routers: [UserRouter]`, not `routers: [new UserRouter()]`.

## Running the Example

To run this example:

```bash
# Build the project
npm run build

# Run the example server
node dist/examples/server.js
```
