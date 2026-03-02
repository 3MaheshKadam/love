import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import CustomCard, { MAX_CUSTOM_CARDS } from "@/models/CustomCard";
import { filterContent } from "@/lib/profanity-filter";

// GET /api/user/custom-cards — List user's custom cards
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
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

        // Optional filter by mode
        const { searchParams } = new URL(req.url);
        const mode = searchParams.get("mode");

        const query: Record<string, unknown> = { userId: user._id };
        if (mode) {
            query.mode = mode;
        }

        const cards = await CustomCard.find(query).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: {
                cards,
                count: cards.length,
                limit: MAX_CUSTOM_CARDS,
                remaining: MAX_CUSTOM_CARDS - cards.length,
            },
        });
    } catch (error) {
        console.error("Custom cards fetch error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong." },
            { status: 500 }
        );
    }
}

// POST /api/user/custom-cards — Create a custom card (Premium only)
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
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

        // Premium check
        if (user.subscription_status !== "premium") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Custom cards are a Premium feature. Upgrade to create your own cards!",
                    data: { premiumRequired: true },
                },
                { status: 403 }
            );
        }

        const { mode, category, type, text } = await req.json();

        // Validate mode
        const validModes = ["truthOrDare", "spinWheel", "scratchReveal", "deepTalk", "challenge", "emotionalBond"];
        if (!mode || !validModes.includes(mode)) {
            return NextResponse.json(
                { success: false, message: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
                { status: 400 }
            );
        }

        // Validate category (required for truthOrDare)
        if (mode === "truthOrDare") {
            const validCategories = ["cute", "romantic", "bold", "deep", "midnightMood"];
            if (!category || !validCategories.includes(category)) {
                return NextResponse.json(
                    { success: false, message: `Category required for Truth or Dare. Must be: ${validCategories.join(", ")}` },
                    { status: 400 }
                );
            }

            const validTypes = ["truth", "dare"];
            if (!type || !validTypes.includes(type)) {
                return NextResponse.json(
                    { success: false, message: "Type must be 'truth' or 'dare' for Truth or Dare cards" },
                    { status: 400 }
                );
            }
        }

        // Profanity & injection filter
        const filterResult = filterContent(text);
        if (!filterResult.clean) {
            return NextResponse.json(
                { success: false, message: filterResult.reason },
                { status: 400 }
            );
        }

        // Check card limit
        const existingCount = await CustomCard.countDocuments({ userId: user._id });
        if (existingCount >= MAX_CUSTOM_CARDS) {
            return NextResponse.json(
                {
                    success: false,
                    message: `You've reached the maximum of ${MAX_CUSTOM_CARDS} custom cards. Delete some to create new ones.`,
                    data: { limitReached: true, count: existingCount, limit: MAX_CUSTOM_CARDS },
                },
                { status: 429 }
            );
        }

        // Create card
        const card = await CustomCard.create({
            userId: user._id,
            mode,
            category: mode === "truthOrDare" ? category : undefined,
            type: mode === "truthOrDare" ? type : undefined,
            text: text.trim(),
        });

        return NextResponse.json(
            {
                success: true,
                message: "Custom card created!",
                data: {
                    card,
                    remaining: MAX_CUSTOM_CARDS - existingCount - 1,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Custom card create error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong." },
            { status: 500 }
        );
    }
}
