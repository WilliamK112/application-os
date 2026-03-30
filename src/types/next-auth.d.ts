import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      timezone?: string;
    };
  }

  interface User {
    id: string;
    timezone?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    timezone?: string;
  }
}
