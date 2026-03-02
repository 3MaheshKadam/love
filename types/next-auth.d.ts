import "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            subscription_status: string;
            image?: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId: string;
        subscription_status: string;
    }
}
