'use server'

import { HTTPError } from 'ky'
import { z } from 'zod'
import { cookies } from 'next/headers'

import { signInWithPassword } from "@/http/sign-in-with-password"
import { redirect } from 'next/navigation'
import { SignUp } from '@/http/sign-up'


const signUpSchema = z.object({
    name: z.string().refine(value => value.split(' ').length > 1, { message: 'Please, provide your full name' }),
    email: z.string().email({ message: 'Please, provide a valid e-mail address ' }),
    password: z.string().min(6, { message: 'Password should be at least 6 characters' }),
    password_confirmation: z.string(),
}).refine(data => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
})


export async function signUpAction(data: FormData) {
    const result = signUpSchema.safeParse(Object.fromEntries(data))

    if (!result.success) {
        const errors = result.error.flatten().fieldErrors


        return { success: false, message: null, errors }
    }

    const { name, email, password } = result.data


    try {
        await SignUp({ name,email, password, })



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