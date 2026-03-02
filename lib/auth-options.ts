import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export const authConfig: NextAuthConfig = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const email = credentials?.email as string;
                const password = credentials?.password as string;

                if (!email || !password) {
                    throw new Error("Please enter email and password");
                }

                await connectDB();

                const user = await User.findOne({ email });
                if (!user) {
                    throw new Error("No account found with this email");
                }

                if (!user.password) {
                    throw new Error("This account uses Google Sign-In. Please sign in with Google.");
                }

                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    callbacks: {
        async signIn({ user, account }) {
            const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
            const isSuperAdmin = superAdminEmail && user.email === superAdminEmail;

            if (account?.provider === "google") {
                await connectDB();
                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    await User.create({
                        name: user.name ?? "User",
                        email: user.email!,
                        provider: "google",
                        role: isSuperAdmin ? "admin" : "user",
                    });
                } else if (isSuperAdmin && existingUser.role !== "admin") {
                    // Auto-upgrade existing user if email matches super admin
                    existingUser.role = "admin";
                    await existingUser.save();
                }
            } else if (account?.provider === "credentials" && isSuperAdmin) {
                // Check missing admin role for credentials user
                await connectDB();
                const existingUser = await User.findOne({ email: user.email });
                if (existingUser && existingUser.role !== "admin") {
                    existingUser.role = "admin";
                    await existingUser.save();
                }
            }
            return true;
        },

        async jwt({ token, user }) {
            if (user) {
                await connectDB();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.userId = dbUser._id.toString();
                    token.role = dbUser.role;
                    token.subscription_status = dbUser.subscription_status;
                }
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.userId as string;
                session.user.role = token.role as "user" | "admin";
                session.user.subscription_status = token.subscription_status as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
