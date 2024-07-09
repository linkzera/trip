import fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { createTrip } from "./routes/create-trip";

const app = fastify()

// Add schema validator and serializer
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

createTrip(app)

app.listen({ port: 3333 }).then(() => {
  console.log("Server is running on port 3333 🔥")
})