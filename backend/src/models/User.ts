import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBaseUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'teacher' | 'admin' | 'proctor';
    avatarUrl?: string;
    bio?: string;
    phoneNumber?: string;
    address?: string;
    institution?: string;
    createdAt: Date;
    updatedAt: Date;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
    matchSecurityAnswer: (answer: string, hashedAnswer: string) => Promise<boolean>;
}

export interface IStudent extends IBaseUser {
    rollNo: string;
    groupId: mongoose.Types.ObjectId;
    subgroupId?: mongoose.Types.ObjectId;
}

export interface IStaff extends IBaseUser {
    securityQuestions: Array<{ question: string; answer: string }>;
    groupId?: mongoose.Types.ObjectId;
    managedGroups: mongoose.Types.ObjectId[];
    departmentProctors: Array<{ groupId: mongoose.Types.ObjectId; proctorId: mongoose.Types.ObjectId }>;
}

export interface ITeacher extends IStaff {
    defaultProctorId?: mongoose.Types.ObjectId;
}

// Superset interface for general usage where the specific role might not be known
export interface IUser extends IBaseUser {
    rollNo?: string;
    groupId?: mongoose.Types.ObjectId;
    subgroupId?: mongoose.Types.ObjectId;
    defaultProctorId?: mongoose.Types.ObjectId;
    securityQuestions?: Array<{ question: string; answer: string }>;
    managedGroups?: mongoose.Types.ObjectId[];
    departmentProctors?: Array<{ groupId: mongoose.Types.ObjectId; proctorId: mongoose.Types.ObjectId }>;
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
    managedGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    departmentProctors: [
        {
            groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
            proctorId: { type: Schema.Types.ObjectId, ref: 'User' },
        },
    ],
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    proctoringPresets: {
        enableFaceDetection: { type: Boolean, default: true },
        enableVoiceDetection: { type: Boolean, default: true },
        enableGazeTracking: { type: Boolean, default: false },
        enableTabLock: { type: Boolean, default: true },
        enableFullscreen: { type: Boolean, default: true },
        enableInputLock: { type: Boolean, default: true },
        violationThreshold: { type: Number, default: 5 },
        performanceSettings: {
            gazeYawThreshold: { type: Number, default: 40 },
            faceScoreThreshold: { type: Number, default: 0.45 },
            audioRMSThreshold: { type: Number, default: 0.010 },
            violationCooldownMs: { type: Number, default: 15000 }
        }
    }
});

export const Teacher = User.discriminator('teacher', new mongoose.Schema({
    defaultProctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    managedGroups: [{ type: Schema.Types.ObjectId, ref: 'Group' }],
    proctoringPresets: {
        enableFaceDetection: { type: Boolean, default: true },
        enableVoiceDetection: { type: Boolean, default: true },
        enableGazeTracking: { type: Boolean, default: false },
        enableTabLock: { type: Boolean, default: true },
        enableFullscreen: { type: Boolean, default: true },
        enableInputLock: { type: Boolean, default: true },
        violationThreshold: { type: Number, default: 5 },
        performanceSettings: {
            gazeYawThreshold: { type: Number, default: 40 },
            faceScoreThreshold: { type: Number, default: 0.45 },
            audioRMSThreshold: { type: Number, default: 0.010 },
            violationCooldownMs: { type: Number, default: 15000 }
        }
    }
}));
export const Admin = User.discriminator('admin', StaffSchema);
export const Proctor = User.discriminator('proctor', StaffSchema);

export default User;
