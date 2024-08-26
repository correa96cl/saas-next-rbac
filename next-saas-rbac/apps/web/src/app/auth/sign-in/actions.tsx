'use server'

import { HTTPError } from 'ky'
import { z } from 'zod'
import { cookies } from 'next/headers'

import { signInWithPassword } from "@/http/sign-in-with-password"
import { redirect } from 'next/navigation'
import { acceptInvite } from '@/http/accept-invite'


const signInSchema = z.object({
    email: z.string().email({ message: 'Please, provide a valid e-mail address ' }),
    password: z.string().min(1, { message: 'Please, provide a valid password' }),
})


export async function signInWithEmailAndPassword(data: FormData) {
    const result = signInSchema.safeParse(Object.fromEntries(data))

    if (!result.success) {
        const errors = result.error.flatten().fieldErrors


        return { success: false, message: null, errors }
    }

    const { email, password } = result.data


    try {
        const { token } = await signInWithPassword({ email, password, })

        cookies().set('token', token, {
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        const inviteId = cookies().get('inviteId')?.value

        if (inviteId) {
          try {
            await acceptInvite(inviteId)
            cookies().delete('inviteId')
          } catch (e) {
            console.log(e)
          }
        }

    } catch (err) {

        if (err instanceof HTTPError) {
            const { message } = await err.response.json() as { message: string }

            return { success: false, message, errors: null }
        }

        console.error(err)

        return {
            success: false,
            message: 'Something went wrong. Please, try again later.',
            errors: null
        }

    }

    return { success: true, message: null, errors: null }
}