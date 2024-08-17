import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {


    const redirectUrl = request.nextUrl.clone()

    cookies().delete('token');

    redirectUrl.pathname = '/auth/sign-in'

    return NextResponse.redirect(redirectUrl)
}