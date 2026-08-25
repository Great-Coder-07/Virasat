import cloudinary from "../utils/cloudinary.js";
import streamifier from "streamifier";
import { Memory } from "../models/memory.model.js";
import { User } from "../models/user.model.js";
import { Circle } from "../models/circle.model.js";
import { cleanupFailedMemories } from "../utils/memoryCleanup.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadToCloudinary = async (file, folder) => {
    const isVideo = (file.mimetype || "").startsWith("video/");
    const options = {
        folder,
        resource_type: isVideo ? "video" : "image",
        timeout: 600000,
    };

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
};

const uploadWithRetry = async (file, folder, maxRetries = 3) => {
    let attempt = 0;

    while (true) {
        try {
            return await uploadToCloudinary(file, folder);
        } catch (error) {
            attempt += 1;
            if (attempt > maxRetries) throw error;

            const backoff = 500 * Math.pow(2, attempt - 1);
            console.warn(
                `Cloudinary upload failed (attempt ${attempt}/${maxRetries}). Retrying in ${backoff}ms...`,
                error?.message || error
            );
            await sleep(backoff);
        }
    }
};

export const createMemory = async (req, res) => {
    let newMemory;

    try {
        const { title, story, date, tags, circleId, isMilestone } = req.body;
        const files = Array.isArray(req.files) ? req.files : [];
        const userId = req.id;

        if (!title || !date || files.length === 0) {
            return res.status(400).json({
                message: "Title, date, and at least one file are required.",
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        if (!user.family) {
            return res.status(400).json({
                message: "Join or create a family before adding memories.",
            });
        }

        newMemory = await Memory.create({
            family: user.family,
            author: userId,
            title,
            story,
            date,
            tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
            type: "mixed",
            circleId: circleId || null,
            mediaURLs: [],
            status: "processing",
            isMilestone: isMilestone === "true",
        });

        const folder = `virasat/${user.family}/memories`;
        const uploadedResults = [];

        for (const file of files) {
            uploadedResults.push(await uploadWithRetry(file, folder, 3));
        }

        const formattedMedia = uploadedResults.map((result) => ({
            url: result.secure_url,
            type: result.resource_type,
        }));

        newMemory = await Memory.findByIdAndUpdate(
            newMemory._id,
            {
                mediaURLs: formattedMedia,
                status: "completed",
            },
            { new: true }
        ).populate("author", "fullName");

        if (circleId) {
            await Circle.findByIdAndUpdate(circleId, {
                $addToSet: { memories: newMemory._id },
            });
        }

        return res.status(201).json({
            success: true,
            message: "Memory uploaded successfully.",
            memory: newMemory,
        });
    } catch (error) {
        if (newMemory?._id) {
            await Memory.findByIdAndDelete(newMemory._id);
        }

        console.error("Error creating memory:", error?.message || error);
        return res.status(error?.http_code || 500).json({
            message: error?.message || "Memory upload failed.",
        });
    }
};

export const getTimelineEvents = async (req, res) => {
    try {
        const user = req.user;
        const { sort } = req.query;
        const sortOrder = sort === "desc" ? "desc" : "asc";

        await cleanupFailedMemories(user.family);

        const timelineEvents = await Memory.find({
            family: user.family,
            isMilestone: true,
            $or: [
                { circleId: undefined },
                { circleId: { $exists: false } },
            ],
        })
            .populate("author", "fullName")
            .sort({ date: sortOrder });

        return res.status(200).json({
            success: true,
            events: timelineEvents,
        });
    } catch (error) {
        console.error("Error fetching timeline events:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
