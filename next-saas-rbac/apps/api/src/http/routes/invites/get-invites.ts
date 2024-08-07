

import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getInvites(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['Invites'],
          summary: 'Get all organizartion invites',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }) ,
          response: {
            201: z.object({
             invites: z.array(
                 z.object({
                    id: z.string().uuid(),
                    role: z.string(),
                    email: z.string().email(),
                    createdAt: z.date(),
                    author: z.object({
                        id: z.string().uuid(),
                        name: z.string().nullable(),
                    }).nullable(),
                 })
             )
            }),
          },
        },
      },
      async (request) => {
        const { slug } = request.params   
        const userId = await request.getCurrentUserId()
        const {organization, membership } = await request.getUserMembership(slug)
        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', 'Invite')) {
            throw new UnauthorizedError('Youre not allowed to obtain all invites')
        }

        const invites = await prisma.invite.findMany({
            where: {
                organizationId: organization.id
            },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                    },
                }
            }
        })

        return {
            invites}

    }
    )
}