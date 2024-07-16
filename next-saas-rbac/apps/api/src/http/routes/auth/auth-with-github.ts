import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod"
import { BadRequestError } from "../_errors/bad-request-error";
import en from "zod/locales/en.js";
import { env } from "@saas/env";

export async function authenticateWithGithub(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post('/sessions/github', {
        schema: {
            tags: ['auth'],
            summary: 'Login with github',
            body: z.object({
                code: z.string(),
            }), response: {
                201: z.object({
                    token: z.string(),
                })
            }
        }
    }, async (request, reply) => {
        const { code } = request.body

        const githubOAuthURL = new URL(`https://github.com/login/oauth/access_token`)

        githubOAuthURL.searchParams.set('client_id', env.GITHUB_OAUTH_CLIENT_ID)
        githubOAuthURL.searchParams.set('client_secret', env.GITHUB_OAUTH_CLIENT_SECRET)
        githubOAuthURL.searchParams.set('redirect_url', env.GITHUB_OAUTH_CLIENT_REDIRECT_URI)
        githubOAuthURL.searchParams.set('code', code)

        const githubAccessTokenResponse = await fetch(githubOAuthURL, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            },
        })


        const githubAccessTokenDate = await githubAccessTokenResponse.json()

        const { access_token: githubAccessToken } = z.object({
            access_token: z.string(),
            token_type: z.literal('bearer'),
            scope: z.string(),
        }).parse(githubAccessTokenDate)

        const githubUserResponse = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${githubAccessToken}`
            }
        })

        const githubUserData = await githubAccessTokenResponse.json()

        const { id: githubId, name, email, avatar_url: avatarUrl } = z.object({
            id: z.number().int().transform(String),
            email: z.string().nullable(),
            name: z.string().nullable(),
            avatar_url: z.string().url(),
        }).parse(githubUserData)


        if (email === null) {
            throw new BadRequestError('Your Github account must have an e-mail to authenticate.')
        }

        let user = await prisma.user.findUnique({
            where: {
                email
            }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    name,
                    email,
                    avatarUrl,
                }
            })
        }

        let account = await prisma.account.findUnique({
            where: {
                provider_userId: {
                    provider: 'GITHUB',
                    userId: user.id
                }
            }
        })

        if (!account) {
            account = await prisma.account.create({
                data: {
                    provider: 'GITHUB',
                    providerAccountId: githubId,
                    userId: user.id
                }
            })
        }

        const token = await reply.jwtSign({
            sub: user.id,
        }, {
            sign: {
                expiresIn: '7d',
            }
        })

        return reply.status(201).send({ token })


    })
}