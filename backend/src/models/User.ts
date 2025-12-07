import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin' | 'proctor';
    avatarUrl?: string;
    bio?: string;
    phoneNumber?: string;
    address?: string;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ['student', 'teacher', 'admin', 'proctor'],
            default: 'student',
        },
        avatarUrl: { type: String },
        bio: { type: String },
        phoneNumber: { type: String },
        address: { type: String },
    },
    { timestamps: true },
);

// Encrypt password using bcrypt
UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
