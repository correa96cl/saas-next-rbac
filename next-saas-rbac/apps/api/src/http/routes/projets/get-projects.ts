import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getProjects(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .get(
            '/organizations/:slug/projects',
            {
                schema: {
                    tags: ['Projects'],
                    summary: 'Get all organization projects',
                    security: [{ bearerAuth: [] }],
                    params: z.object({
                        slug: z.string(),
                        projectSlug: z.string().uuid(),
                    }),
                    response: {
                        200: z.object({
                            projects: z.array(
                                z.object({
                                    id: z.string().uuid(),
                                    name: z.string(),
                                    description: z.string(),
                                    slug: z.string(),
                                    organizationId: z.string().uuid(),
                                    ownerId: z.string().uuid(),
                                    avatarUrl: z.string().url().nullable(),
                                    createdAt: z.date(),
                                    owner: z.object({
                                        id: z.string().uuid(),
                                        name: z.string().nullable(),
                                        avatarUrl: z.string().url().nullable(),
                                    }),

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

                if (cannot('get', 'Project')) {
                    throw new UnauthorizedError('Youre not allowed to see organizations projects ')
                }

                const projects = await prisma.project.findMany({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        slug: true,
                        organizationId: true,
                        ownerId: true,
                        avatarUrl: true,
                        createdAt: true,
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true
                            }
                        }
                    },
                    where: {
                        organizationId: organization.id
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                })


                return reply.send({ projects })
            },
        )
}