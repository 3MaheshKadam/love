import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    provider: "google" | "email";
    role: "user" | "admin";
    subscription_status: "free" | "premium";
    daily_play_count: number;
    last_played_at: Date | null;
    resetToken?: string;
    resetTokenExpiry?: Date;
    created_at: Date;
}

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: false, // Not required for Google sign-in
    },
    provider: {
        type: String,
        enum: ["google", "email"],
        default: "email",
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    subscription_status: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
    },
    daily_play_count: {
        type: Number,
        default: 0,
    },
    last_played_at: {
        type: Date,
        default: null,
    },
    resetToken: {
        type: String,
        default: undefined,
    },
    resetTokenExpiry: {
        type: Date,
        default: undefined,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
