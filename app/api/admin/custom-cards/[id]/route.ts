import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import CustomCard from "@/models/CustomCard";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/admin/custom-cards/[id] — Force delete a user's custom card (Moderation)
export async function DELETE(req: Request, { params }: RouteParams) {
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
            return NextResponse.json({ success: false, message: "Card ID is required" }, { status: 400 });
        }

        await connectDB();

        // 1. Force delete the card
        const card = await CustomCard.findByIdAndDelete(id);
        if (!card) {
            return NextResponse.json({ success: false, message: "Card not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Custom card (ID: ${id}) permanently removed by admin.`,
            data: { card },
        });
    } catch (error) {
        console.error("Admin card delete error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong moderating the card." },
            { status: 500 }
        );
    }
}
