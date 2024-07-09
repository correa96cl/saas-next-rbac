import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from '@/lib/prisma'
import { hash } from "bcryptjs"

export async function createAccount(app: FastifyInstance) {

    app.withTypeProvider<ZodTypeProvider>().post('/users', {
        schema: {
            tags: ['Auth'],
            summary: 'Create a new account',
            body: z.object({
                name: z.string(),
                email: z.string().email(),
                password: z.string().min(6)
            })
        }
    }, async (request, reply) => {
        const { name, email, password } = request.body
        const userWithSameEmail = await prisma.user.findUnique({
            where: {
                email
            }

        })

        if (userWithSameEmail) {
            return reply.status(409).send({
                message: 'User already exists'
            })
        }

        const [, domain] = email.split('@')

        const autoJoinOrganization = await prisma.organization.findFirst({
            where: {
                shouldAttachUsersByDomain: true,
                domain
            }
        })

        const passwordHash = await hash(password, 6)

        await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                member_on: autoJoinOrganization ? {
                    create : {
                        organizationId: autoJoinOrganization.id,
                    },
                }: undefined,
            },
        })
        return reply.status(201).send()
    })

}