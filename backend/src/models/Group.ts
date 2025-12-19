import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
    name: string;
    description?: string;
}

const GroupSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String },
    },
    { timestamps: true }
);

const Group = mongoose.model<IGroup>('Group', GroupSchema);
export default Group;
