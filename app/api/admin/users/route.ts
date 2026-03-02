import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import CustomCard from "@/models/CustomCard";

// GET /api/admin/users — List all users (Admin only)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json(
                { success: false, message: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }

        await connectDB();

        // Get all users, sorted passing newest first
        const users = await User.find()
            .select("-password -resetToken -resetTokenExpiry")
            .sort({ created_at: -1 })
            .lean();

        // Get custom card counts for all users (optimization: aggregate instead of loop)
        const customCardCounts = await CustomCard.aggregate([
            { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]);

        const countMap = new Map();
        customCardCounts.forEach(c => countMap.set(c._id.toString(), c.count));

        const enhancedUsers = users.map(user => ({
            ...user,
            customCardCount: countMap.get(user._id?.toString()) || 0
        }));

        return NextResponse.json({
            success: true,
            data: {
                users: enhancedUsers,
                total: enhancedUsers.length,
            },
        });
    } catch (error) {
        console.error("Admin user list error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong fetching users." },
            { status: 500 }
        );
    }
}
