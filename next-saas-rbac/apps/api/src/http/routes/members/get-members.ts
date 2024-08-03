import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'
import { roleSchema } from '@saas/auth'

export async function getMembers(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            '/organizations/:slug/members',
            {
                schema: {
                    tags: ['Members'],
                    summary: 'Get all members',
                    security: [{ bearerAuth: [] }],
                    params: z.object({
                        slug: z.string(),
                        projectSlug: z.string().uuid(),
                    }),
                    response: {
                        200: z.object({
                            members: z.array(
                                z.object({
                                    id: z.string().uuid(),
                                    userId: z.string().uuid(),
                                    role: roleSchema,
                                    name: z.string().nullable(),
                                    avatarUrl: z.string().url().nullable(),
                                    email: z.string().email(),
                                })

                            )
                        })
                    },
                },
            },
            async (request, reply) => {
                const { slug } = request.params
                const userId = await request.getCurrentUserId()
                const { organization, membership } = await request.getUserMembership(slug)
                const { cannot } = getUserPermissions(userId, membership.role)

                if (cannot('get', 'User')) {
                    throw new UnauthorizedError('Youre not allowed to see organizations members ')
                }

                const members = await prisma.member.findMany({
                    select: {
                        id: true,
                        role: true,
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true
                            }
                        }
                    },
                    where: {
                        organizationId: organization.id
                    },
                    orderBy: {
                        role: 'desc'
                    }
                })

                const membersWithRoles = members.map(
                    ({ user: { id: userId, ...user }, ...member }) => {
                        return {
                            ...member,
                            ...user,
                            userId,
                        }
                    },
                )

                return reply.send({ members: membersWithRoles })
            },
        )
}