import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import CustomCard from "@/models/CustomCard";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/user/custom-cards/[id] — Delete a custom card
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "Card ID is required" },
                { status: 400 }
            );
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Only allow deleting own cards
        const card = await CustomCard.findOneAndDelete({
            _id: id,
            userId: user._id,
        });

        if (!card) {
            return NextResponse.json(
                { success: false, message: "Card not found or not owned by you" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Custom card deleted",
        });
    } catch (error) {
        console.error("Custom card delete error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong." },
            { status: 500 }
        );
    }
}
