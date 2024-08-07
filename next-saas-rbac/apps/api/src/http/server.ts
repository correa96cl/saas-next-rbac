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
import { updateOrganization } from './routes/orgs/update-organization'
import { shutdownOrganization } from './routes/orgs/shutdown-organization'
import { transferOrganization } from './routes/orgs/transfer-organization'
import { createProject } from './routes/projets/create-project'
import { removeProject } from './routes/projets/remove-project'
import { getProject } from './routes/projets/get-project'
import { getProjects } from './routes/projets/get-projects'
import { updateProject } from './routes/projets/update-project'
import { getMembers } from './routes/members/get-members'
import { updateMembers } from './routes/members/update-members'
import { removeMembers } from './routes/members/remove-mambers'
import { register } from 'module'
import { createInvite } from './routes/invites/create-invite'
import { getInvite } from './routes/invites/get-invite'
import { getInvites } from './routes/invites/get-invites'
import { acceptInvite } from './routes/invites/accept-invite'
import { rejectInvite } from './routes/invites/reject-invite'
import { removeInvite } from './routes/invites/remove-invite'
import { getPendingInvites } from './routes/invites/get-pending-invite'
import { getOrganizationBilling } from './routes/billing/get-organization-billing'



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
app.register(updateOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)
app.register(createProject)
app.register(removeProject)
app.register(getProject)
app.register(getProjects)
app.register(updateProject)
app.register(getMembers)
app.register(updateMembers)
app.register(removeMembers)
app.register(createInvite)
app.register(getInvite)
app.register(getInvites)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(removeInvite)
app.register(getPendingInvites)
app.register(getOrganizationBilling)

app.listen({ port: env.SERVER_PORT }).then(() => {
  console.log('HTTP server running')
})