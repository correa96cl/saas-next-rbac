import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'
import { getUserPermissions } from '@/utils/get-user-permissions'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { BadRequestError } from '../_errors/bad-request-error'

export async function getProjects(app: FastifyInstance) {
    app
        .withTypeProvider<ZodTypeProvider>()
        .register(auth)
        .post(
            '/organizations/:orgSlug/projects/:projectSlug',
            {
                schema: {
                    tags: ['Projects'],
                    summary: 'Get project details',
                    security: [{ bearerAuth: [] }],
                    params: z.object({
                        orgSlug: z.string(),
                        projectSlug: z.string().uuid(),
                    }),
                    response: {
                        200: z.object({
                            project: z.object({
                                id: z.string().uuid(),
                                name: z.string(),
                                description: z.string(),
                                slug: z.string(),
                                organizationId: z.string().uuid(),
                                ownerId: z.string().uuid(),
                                avatarUrl: z.string().nullable(),
                                owner: z.object({
                                    id: z.string().uuid(),
                                    name: z.string().nullable(),
                                    avatarUrl: z.string().nullable(),
                                }),

                            })
                        })
                    },
                },
            },
            async (request, reply) => {
                const { projectSlug, orgSlug } = request.params
                const userId = await request.getCurrentUserId()
                const { organization, membership } = await request.getUserMembership(orgSlug)
                const { cannot } = getUserPermissions(userId, membership.role)

                if (cannot('get', 'Project')) {
                    throw new UnauthorizedError('Youre not allowed to see a project')
                }

                const project = await prisma.project.findUnique({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        slug: true,
                        organizationId: true,
                        ownerId: true,
                        avatarUrl: true,
                        owner: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true
                            }
                        }
                    },
                    where: {
                        slug: projectSlug,
                        organizationId: organization.id
                    }
                })

                if (!project){
                    throw new BadRequestError('Project not found')
                }

                return reply.send({ project })
            },
        )
}