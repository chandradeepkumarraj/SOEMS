import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin' | 'proctor';
    rollNo?: string;
    avatarUrl?: string;
    bio?: string;
    phoneNumber?: string;
    groupId?: mongoose.Types.ObjectId;
    subgroupId?: mongoose.Types.ObjectId;
    address?: string;
    institution?: string;
    securityQuestions?: Array<{ question: string; answer: string }>;
    createdAt: Date;
    updatedAt: Date;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
    matchSecurityAnswer: (answer: string, hashedAnswer: string) => Promise<boolean>;
}

const options = { discriminatorKey: 'role', timestamps: true };

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        avatarUrl: { type: String },
        phoneNumber: {
            type: String,
            validate: {
                validator: function (v: string) {
                    if (!v) return true;
                    return /^\d{10}$/.test(v);
                },
                message: (props: any) => `${props.value} is not a valid 10-digit phone number!`
            }
        },
        address: { type: String },
        bio: { type: String },
        institution: { type: String },
    },
    options
);

// Encrypt password using bcrypt
UserSchema.pre<IUser>('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.matchSecurityAnswer = async function (answer: string, hashedAnswer: string) {
    return await bcrypt.compare(answer, hashedAnswer);
};

const User = mongoose.model<IUser>('User', UserSchema);

// --- DISCRIMINATORS (Logical Partitioning) ---

// 1. Student Discriminator
export const Student = User.discriminator('student', new mongoose.Schema({
    rollNo: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v: string) {
                if (!v) return true;
                return /^\d{13}$/.test(v);
            },
            message: (props: any) => `${props.value} is not a valid 13-digit roll number!`
        }
    },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    subgroupId: { type: Schema.Types.ObjectId, ref: 'Subgroup' },
}));

// 2. Staff Discriminator (Admin, Teacher, Proctor)
const StaffSchema = new mongoose.Schema({
    securityQuestions: [
        {
            question: { type: String },
            answer: { type: String },
        },
    ],
});

export const Teacher = User.discriminator('teacher', StaffSchema);
export const Admin = User.discriminator('admin', StaffSchema);
export const Proctor = User.discriminator('proctor', StaffSchema);

export default User;
