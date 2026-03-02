import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: Request) {
    try {
        // Rate limit: 5 attempts per 15 minutes
        const rateLimitResult = rateLimit("signup", req, RATE_LIMITS.SIGNUP);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { success: false, message: "Too many signup attempts. Please try again later." },
                { status: 429 }
            );
        }

        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { success: false, message: "Name, email, and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "An account with this email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            provider: "email",
        });

        return NextResponse.json(
            {
                success: true,
                message: "Account created successfully",
                user: { id: user._id, name: user.name, email: user.email },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
