import mongoose, { Document, Schema } from 'mongoose';

export interface ISubgroup extends Document {
    name: string;
    groupId: mongoose.Types.ObjectId;
    academicYear: string;
}

const SubgroupSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
        academicYear: { type: String, required: true },
    },
    { timestamps: true }
);

// Compound index to ensure unique session names within a specific group and year
SubgroupSchema.index({ name: 1, groupId: 1, academicYear: 1 }, { unique: true });

const Subgroup = mongoose.model<ISubgroup>('Subgroup', SubgroupSchema);
export default Subgroup;
