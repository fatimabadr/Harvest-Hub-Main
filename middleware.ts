import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";


const protectedRoutes: string[] = [
  "/dashboard/farmer",
  "/subscriptions/create",
  "/dashboard/farmer/products",
  "/dashboard/farmer/packages",
  "/dashboard/farmer/orders",
  "/dashboard/farmer/settings",
];


const farmerOnlyRoutes: string[] = [
  "/dashboard/farmer",
  "/subscriptions/create",
  "/dashboard/farmer/products",
  "/dashboard/farmer/packages",
  "/dashboard/farmer/orders",
  "/dashboard/farmer/settings",
];

const customerOnlyRoutes: string[] = [
  "/subscriptions",
  "/subscription-delivery-details",
  "/subscription-confirmation",
  "/cart",
  "/shop-new",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") || 
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/registration-type" ||
    pathname === "/user-registration" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password"
  ) {
    return NextResponse.next();
  }

  
  const isFarmerOnlyRoute = farmerOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isCustomerOnlyRoute = customerOnlyRoutes.some((route) =>
    pathname.startsWith(route)
  );

  
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  
  const token = request.cookies.get("token")?.value || 
    request.headers.get("authorization")?.replace("Bearer ", "");

  
  if (isProtectedRoute || isFarmerOnlyRoute) {
    if (!token) {
      
      if (isFarmerOnlyRoute) {
        return NextResponse.redirect(new URL("/login/farmer", request.url));
      }
      return NextResponse.redirect(new URL("/registration-type", request.url));
    }

    try {
      
      const jwtSecret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        userId?: string;
        email: string;
        accountType: string;
      };

      
      if (isCustomerOnlyRoute && decoded.accountType === "farmer") {
        return NextResponse.redirect(new URL("/dashboard/farmer", request.url));
      }

      
      if (isFarmerOnlyRoute && decoded.accountType !== "farmer") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      
      return NextResponse.next();
    } catch (error) {
      
      const response = isFarmerOnlyRoute 
        ? NextResponse.redirect(new URL("/login/farmer", request.url))
        : NextResponse.redirect(new URL("/registration-type", request.url));

      
      response.cookies.delete("token");

      return response;
    }
  }

  
  if (isCustomerOnlyRoute && token) {
    try {
      const jwtSecret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, jwtSecret) as {
        id: string;
        userId?: string;
        email: string;
        accountType: string;
      };

      
      if (decoded.accountType === "farmer") {
        return NextResponse.redirect(new URL("/dashboard/farmer", request.url));
      }
    } catch (error) {
      
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (public image files)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
