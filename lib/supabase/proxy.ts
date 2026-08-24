import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_INSPECTOR_ROUTES = ['/inspector/login'];
const CHANGE_PASSWORD_ROUTE = '/inspector/change-password';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtectedInspectorRoute =
    pathname.startsWith('/inspector') &&
    !PUBLIC_INSPECTOR_ROUTES.includes(pathname);

  if (isProtectedInspectorRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/inspector/login';
    return NextResponse.redirect(url);
  }

  if (isProtectedInspectorRoute && user && pathname !== CHANGE_PASSWORD_ROUTE) {
    const { data: inspector } = await supabase
      .from('inspectors')
      .select('must_change_password')
      .eq('id', user.id)
      .maybeSingle();

    if (inspector?.must_change_password) {
      const url = request.nextUrl.clone();
      url.pathname = CHANGE_PASSWORD_ROUTE;
      return NextResponse.redirect(url);
    }
  }

  return response;
}
