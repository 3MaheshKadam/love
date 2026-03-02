import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-options";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import CustomCard from "@/models/CustomCard";
import {
    gameContent,
    shuffleArray,
    getRandomItems,
    GAME_MODES,
    FREE_DAILY_LIMIT,
    type GameMode,
    type GameCard,
} from "@/lib/game-content";

// URL mode → DB mode name mapping
const MODE_TO_DB: Record<string, string> = {
    "truth-or-dare": "truthOrDare",
    "spin-wheel": "spinWheel",
    "scratch-reveal": "scratchReveal",
    "deep-talk": "deepTalk",
    "challenge": "challenge",
    "emotional-bond": "emotionalBond",
};

interface RouteParams {
    params: Promise<{ mode: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { mode } = await params;

        // Validate game mode
        if (!GAME_MODES.includes(mode as GameMode)) {
            return NextResponse.json(
                { success: false, message: `Invalid game mode. Available: ${GAME_MODES.join(", ")}` },
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

        const isPremium = user.subscription_status === "premium";

        // ── Daily play limit check (free users) ──
        // Uses date comparison (not midnight cron) — works correctly for global users
        if (!isPremium) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastPlayed = user.last_played_at ? new Date(user.last_played_at) : null;

            // Reset counter if date changed (new day)
            if (!lastPlayed) {
                user.daily_play_count = 0;
            } else {
                const lastPlayedDay = new Date(lastPlayed);
                lastPlayedDay.setHours(0, 0, 0, 0);
                if (lastPlayedDay.getTime() < today.getTime()) {
                    user.daily_play_count = 0;
                }
            }

            if (user.daily_play_count >= FREE_DAILY_LIMIT) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `You've used all ${FREE_DAILY_LIMIT} free plays for today. Upgrade to Premium for unlimited access!`,
                        data: { limitReached: true, playsRemaining: 0 },
                    },
                    { status: 429 }
                );
            }

            // Atomically increment play count to prevent race conditions
            await User.updateOne(
                { _id: user._id },
                {
                    $inc: { daily_play_count: 1 },
                    $set: { last_played_at: new Date() }
                }
            );
            // Update local object for the response below
            user.daily_play_count += 1;
        }

        // ── Get content for the requested mode ──
        let content: GameCard[] = [];
        let meta: Record<string, unknown> = {};

        const { searchParams } = new URL(req.url);
        const category = searchParams.get("category");

        switch (mode as GameMode) {
            case "truth-or-dare": {
                const validCategories = ["cute", "romantic", "bold", "deep", "midnightMood"];
                const premiumCategories = ["bold", "midnightMood"];
                const selectedCategory = category && validCategories.includes(category)
                    ? category
                    : "cute";

                // Bold + Midnight Mood categories are premium only — backend enforced
                if (premiumCategories.includes(selectedCategory) && !isPremium) {
                    return NextResponse.json(
                        {
                            success: false,
                            message: `The ${selectedCategory === "midnightMood" ? "Midnight Mood" : "Bold"} category is exclusive to Premium members. Upgrade to unlock!`,
                            data: { premiumRequired: true },
                        },
                        { status: 403 }
                    );
                }

                const builtIn = gameContent.truthOrDare[selectedCategory as keyof typeof gameContent.truthOrDare];

                // Merge custom cards for this category
                const customCards = isPremium
                    ? await CustomCard.find({ userId: user._id, mode: "truthOrDare", category: selectedCategory })
                    : [];
                const customMapped: GameCard[] = customCards.map((c) => ({
                    id: `custom_${c._id}`,
                    text: c.text,
                    type: c.type as "truth" | "dare",
                    isCustom: true,
                })) as GameCard[];

                content = shuffleArray([...builtIn, ...customMapped]);
                meta = {
                    category: selectedCategory,
                    availableCategories: isPremium
                        ? validCategories
                        : validCategories.filter((c) => !premiumCategories.includes(c)),
                    customCardCount: customMapped.length,
                };
                break;
            }

            case "spin-wheel": {
                const customSW = isPremium
                    ? await CustomCard.find({ userId: user._id, mode: "spinWheel" })
                    : [];
                const customSWMapped: GameCard[] = customSW.map((c) => ({
                    id: `custom_${c._id}`,
                    text: c.text,
                    isCustom: true,
                })) as GameCard[];
                content = shuffleArray([...gameContent.spinWheel, ...customSWMapped]);
                break;
            }

            case "scratch-reveal": {
                const customSR = isPremium
                    ? await CustomCard.find({ userId: user._id, mode: "scratchReveal" })
                    : [];
                const customSRMapped: GameCard[] = customSR.map((c) => ({
                    id: `custom_${c._id}`,
                    text: c.text,
                    isCustom: true,
                })) as GameCard[];
                content = getRandomItems([...gameContent.scratchReveal, ...customSRMapped], 5);
                break;
            }

            case "deep-talk": {
                const customDT = isPremium
                    ? await CustomCard.find({ userId: user._id, mode: "deepTalk" })
                    : [];
                const customDTMapped: GameCard[] = customDT.map((c) => ({
                    id: `custom_${c._id}`,
                    text: c.text,
                    isCustom: true,
                })) as GameCard[];
                content = shuffleArray([...gameContent.deepTalk, ...customDTMapped]);
                break;
            }

            case "challenge": {
                const customFC = isPremium
                    ? await CustomCard.find({ userId: user._id, mode: "challenge" })
                    : [];
                const customFCMapped: GameCard[] = customFC.map((c) => ({
                    id: `custom_${c._id}`,
                    text: c.text,
                    isCustom: true,
                })) as GameCard[];
                content = getRandomItems([...gameContent.fiveMinChallenge, ...customFCMapped], 1);
                meta = { timerDuration: 300 };
                break;
            }

            case "emotional-bond": {
                const customEB = isPremium
                    ? await CustomCard.find({ userId: user._id, mode: "emotionalBond" })
                    : [];
                const customEBMapped: GameCard[] = customEB.map((c) => ({
                    id: `custom_${c._id}`,
                    text: c.text,
                    isCustom: true,
                })) as GameCard[];
                content = shuffleArray([...gameContent.emotionalBond, ...customEBMapped]);
                break;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                mode,
                isPremium,
                playsRemaining: isPremium ? "unlimited" : Math.max(0, FREE_DAILY_LIMIT - user.daily_play_count),
                content,
                ...meta,
            },
        });
    } catch (error) {
        console.error("Game API error:", error);
        return NextResponse.json(
            { success: false, message: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
