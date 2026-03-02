import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import CustomCard from "@/models/CustomCard";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// DELETE /api/admin/users/[id] — Force delete a user and their data
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const session = await auth();
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

        // Prevent self-deletion via admin route
        if (id === session.user.id) {
            return NextResponse.json(
                { success: false, message: "Cannot delete your own admin account from here." },
                { status: 400 }
            );
        }

        // 2. Delete all their custom cards
        // Using transaction if deploying to a replica set (like MongoDB Atlas)
        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();
        try {
            const user = await User.findByIdAndDelete(id).session(dbSession);
            if (!user) {
                await dbSession.abortTransaction();
                dbSession.endSession();
                return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
            }

            const deleteCardsResult = await CustomCard.deleteMany({ userId: id }).session(dbSession);
            await dbSession.commitTransaction();
            dbSession.endSession();

            return NextResponse.json({
                success: true,
                message: `User ${user.email} and their ${deleteCardsResult.deletedCount || 0} custom cards were permanently deleted.`,
            });
        } catch (txnError) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            throw txnError;
        }
    } catch (error) {
        console.error("Admin user delete error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong deleting the user." },
            { status: 500 }
        );
    }
}
