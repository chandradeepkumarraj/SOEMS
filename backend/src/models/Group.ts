import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    description?: string;
    departmentProctorId?: mongoose.Types.ObjectId;
}

const GroupSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
        departmentProctorId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const Group = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
