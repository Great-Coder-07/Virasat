import { Circle } from "../models/circle.model.js";
import { Memory } from "../models/memory.model.js";

export const cleanupFailedMemories = async (familyId) => {
    if (!familyId) return 0;

    const failedMemories = await Memory.find({
        family: familyId,
        status: "failed",
    }).select("_id");

    if (failedMemories.length === 0) return 0;

    const failedMemoryIds = failedMemories.map((memory) => memory._id);

    await Promise.all([
        Memory.deleteMany({ _id: { $in: failedMemoryIds } }),
        Circle.updateMany(
            { memories: { $in: failedMemoryIds } },
            { $pull: { memories: { $in: failedMemoryIds } } }
        ),
    ]);

    return failedMemoryIds.length;
};
