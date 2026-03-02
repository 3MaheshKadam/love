import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

// ⚠️ DEV-ONLY ENDPOINT — Controlled by ALLOW_DEV_SUBSCRIPTION env flag
// In production, subscription will be managed by Google Play Billing webhook
export async function POST(req: Request) {
    // Only allow when explicitly enabled via env flag
    if (process.env.ALLOW_DEV_SUBSCRIPTION !== "true") {
        return NextResponse.json(
            { success: false, message: "This endpoint is disabled" },
            { status: 403 }
        );
    }

    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { status } = await req.json();

        if (!status || !["free", "premium"].includes(status)) {
            return NextResponse.json(
                { success: false, message: "Status must be 'free' or 'premium'" },
                { status: 400 }
            );
        }

        await connectDB();
        const user = await User.findOneAndUpdate(
            { email: session.user.email },
            { subscription_status: status },
            { new: true }
        );

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Subscription updated to ${status}`,
            data: { subscription_status: user.subscription_status },
        });
    } catch (error) {
        console.error("Subscription update error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong." },
            { status: 500 }
        );
    }
}
