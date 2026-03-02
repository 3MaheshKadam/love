import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/admin/subscription/[id] — Admin override user's subscription
export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        // Admin gate
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        const { id } = await params;
        if (!id) {
            return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
        }

        // Prevent self-modification
        if (id === session.user.id) {
            return NextResponse.json(
                { success: false, message: "Cannot modify your own subscription from the admin portal." },
                { status: 400 }
            );
        }

        const { status } = await req.json();

        if (status !== "free" && status !== "premium") {
            return NextResponse.json(
                { success: false, message: "Invalid status. Must be 'free' or 'premium'." },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findById(id);
        if (!user) {
            return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        user.subscription_status = status;
        await user.save();

        return NextResponse.json({
            success: true,
            message: `User ${user.email} subscription manually updated to ${status}.`,
            data: { userId: user._id, subscription_status: user.subscription_status }
        });

    } catch (error) {
        console.error("Admin subscription update error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong updating subscription." },
            { status: 500 }
        );
    }
}
