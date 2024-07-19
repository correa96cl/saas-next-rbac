import { fastify } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUI from '@fastify/swagger-ui'
import { env } from '@saas/env'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider
} from 'fastify-type-provider-zod'
import { createAccount } from './routes/auth/create-account'
import { authenticateWithPassword } from './routes/auth/auth-with-password'
import fastifyJwt from '@fastify/jwt'
import { getProfile } from './routes/auth/get-profile'
import { errorHandler } from './error-handler'
import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { resetPassword } from './routes/auth/reset-password'
import { authenticateWithGithub } from './routes/auth/auth-with-github'
import { createOrganization } from './routes/orgs/create-organization'
import { getMembership } from '@/http/routes/orgs/get-membership'
import { getOrganization } from './routes/orgs/get-organization'
import { getOrganizations } from './routes/orgs/get-organizations'



const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Next.js SaaS',
      description: 'Full-stack SaaS with multi-tenant & RBAC.',
      version: '1.0.0',
    },
    servers: [],
    components:{
      securitySchemes: {
        bearerAuth:{
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUI, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,

})

app.register(fastifyCors)

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(requestPasswordRecover)
app.register(resetPassword)
app.register(createOrganization)
app.register(authenticateWithGithub)
app.register(getMembership)
app.register(getOrganization)
app.register(getOrganizations)

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log('HTTP server running')
})