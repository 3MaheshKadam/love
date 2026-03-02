import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomCard extends Document {
    userId: mongoose.Types.ObjectId;
    mode: "truthOrDare" | "spinWheel" | "scratchReveal" | "deepTalk" | "challenge" | "emotionalBond";
    category?: "cute" | "romantic" | "bold" | "deep" | "midnightMood";
    type?: "truth" | "dare";
    text: string;
    createdAt: Date;
}

const CustomCardSchema = new Schema<ICustomCard>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    mode: {
        type: String,
        enum: ["truthOrDare", "spinWheel", "scratchReveal", "deepTalk", "challenge", "emotionalBond"],
        required: true,
    },
    category: {
        type: String,
        enum: ["cute", "romantic", "bold", "deep", "midnightMood"],
        required: false,
    },
    type: {
        type: String,
        enum: ["truth", "dare"],
        required: false,
    },
    text: {
        type: String,
        required: true,
        maxlength: 200,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound index for fast user queries
CustomCardSchema.index({ userId: 1, mode: 1 });

const CustomCard: Model<ICustomCard> =
    mongoose.models.CustomCard || mongoose.model<ICustomCard>("CustomCard", CustomCardSchema);

export default CustomCard;

// Max custom cards per user
export const MAX_CUSTOM_CARDS = 30;
