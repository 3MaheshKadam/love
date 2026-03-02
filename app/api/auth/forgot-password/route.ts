import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// In Phase 1, we log the reset link to console.
// Phase 2: integrate email service (SendGrid, Resend, etc.)
export async function POST(req: Request) {
    try {
        // Rate limit: 3 attempts per 15 minutes
        const rateLimitResult = rateLimit("forgot-password", req, RATE_LIMITS.FORGOT_PASSWORD);
        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                { success: false, message: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user || user.provider === "google") {
            return NextResponse.json({
                success: true,
                message: "If an account exists with this email, a reset link has been sent.",
            });
        }

        // Generate reset token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Hash token before storing (never store raw tokens in DB)
        const hashedToken = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        user.resetToken = hashedToken;
        user.resetTokenExpiry = resetExpiry;
        await user.save();

        // Phase 1: Log raw token to console (only in dev)
        // Phase 2: Send actual email
        if (process.env.NODE_ENV === "development") {
            const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
            console.log(`\n🔐 Password Reset Link for ${email}:\n${resetUrl}\n`);
        }

        return NextResponse.json({
            success: true,
            message: "If an account exists with this email, a reset link has been sent.",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
