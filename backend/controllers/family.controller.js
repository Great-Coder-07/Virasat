import { User } from '../models/user.model.js';
import { Family } from '../models/family.model.js'; // Assuming you have a Family model
import jwt from 'jsonwebtoken';
import transporter from '../config/mailer.js'; // Import the transporter
import dotenv from 'dotenv';
import { Memory } from '../models/memory.model.js';
import { jsPDF } from 'jspdf';
import mongoose from 'mongoose';
import { cleanupFailedMemories } from '../utils/memoryCleanup.js';
dotenv.config();


// This should be named createFamily to be more descriptive

export const createFamily = async (req, res) => {
    try {
        // 1. Get logged in user ID from middleware (secure)
        const chroniclerId = req.id;
        const { familyName, description } = req.body;

        // 2. Validate input
        if (!familyName || !chroniclerId) {
            return res.status(400).json({
                success: false,
                message: "Family name is required and user must be authenticated."
            });
        }

        const chronicler = await User.findById(chroniclerId).populate('family')
        if (chronicler.family !== null) {
            return res.status(403).json({ message: "User already has a family", success: false })
        }
        // 3. Create new family document
        let family = await Family.create({
            familyName,
            description,
            chronicler: chroniclerId,
            members: [chroniclerId]
        });

        // 4. Update user to link to family and set role
        chronicler.updateOne({
            family: family._id,
            role: 'Chronicler'
        });

        // 5. Populate members & chronicler before sending back response
        family = await Family.findById(family._id)
            .populate('members', 'fullName email role profile')
            .populate('chronicler', 'fullName email role profile');

        // 6. Send response
        return res.status(201).json({
            success: true,
            message: "Family created successfully.",
            family
        });

    } catch (error) {
        console.error("Error in createFamily:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A family with this name already exists."
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

export const sendInvite = async (req, res) => {
    try {
        const { email, role } = req.body;
        // 1. Get the logged-in USER's ID from auth middleware.
        const userId = req.id;

        // 2. Find the user in the database to get their associated family ID.
        const user = await User.findById(userId);
        if (!user || !user.family) {
            return res.status(404).json({ message: "User not found or does not belong to a family.", success: false });
        }
        const familyId1 = user.family;

        // 3. Use the correct familyId to find the family AND populate the chronicler's details.
        const family = await Family.findById(familyId1).populate('chronicler', 'fullName');
        if (!family) {
            return res.status(404).json({ message: "Family not found", success: false });
        }

        // 4. Create the unique invitation token.
        const token = jwt.sign(
            { email, familyId: family._id, role: role || 'Viewer' },
            process.env.JWT_INVITE_KEY,
            { expiresIn: '3d' }
        );

        // 5. Create the invitation URL.
        const inviteLink = `http://localhost:5173/join-family?token=${token}`;

        // 6. Define the email content. Now you can safely access the chronicler's name.
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: `You're invited to join the ${family.familyName} Family Trunk!`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Hello!</h2>
                    <p>You have been invited by <strong>${family.chronicler.fullName}</strong> to join the <strong>"${family.familyName}"</strong> Family Trunk.</p>
                    <p>This is a private space to share and preserve your family's stories and memories.</p>
                    <p>To accept your invitation, please click the button below:</p>
                    <a href="${inviteLink}" style="background-color: #db2777; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Join the Family</a>
                    <p>This link will expire in 3 days.</p>
                </div>
            `
        };

        // 7. Send the email.
        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            message: `Invitation sent successfully to ${email}`,
            success: true
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

export const getFamilyDetails = async (req, res) => {
    try {
        // 1. Get the logged-in user's ID
        const userId = req.id;

        // 2. Find the user and check if they exist
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // 3. Check if the user is linked to any family
        if (!user.family) {
            return res.status(200).json({
                success: true,
                message: "User does not belong to any family.",
                family: null
            });
        }

        // 4. Fetch and populate family details (members + chronicler)
        const family = await Family.findById(user.family)
            .populate('members', 'fullName email role profile')
            .populate('chronicler', 'fullName email role profile');

        // 5. Handle deleted/missing family document
        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found or may have been deleted."
            });
        }

        // 6. Return populated family details
        return res.status(200).json({
            success: true,
            message: "Family details fetched successfully.",
            family
        });

    } catch (error) {
        console.error("Error in getFamilyDetails:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};


export const updateFamily = async (req, res) => {
    try {
        const familyId = req.id; // comes from auth middleware
        const { familyName, description } = req.body;
        const family = await Family.findByIdAndUpdate(familyId, { familyName, description }, { new: true });
        if (!family) {
            return res.status(404).json({
                message: "Family not found",
                success: false
            });
        }
        return res.status(200).json({
            message: "Family updated successfully",
            success: true,
            family
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}

export const deleteFamily = async (req, res) => {
    try {
        const familyId = req.id; // comes from auth middleware  
        const family = await Family.findByIdAndDelete(familyId);
        if (!family) {
            return res.status(404).json({
                message: "Family not found",
                success: false
            });
        }
        return res.status(200).json({
            message: "Family deleted successfully",
            success: true
        });
    }
    catch (error) {
        console.log(error)
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        })
    }
}

export const acceptInvite = async (req, res) => {
    try {
        const userId = req.id; // From auth middleware
        const { token } = req.body;

        // 1. Validate token existence
        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required."
            });
        }

        // 2. Verify and decode the invitation token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_INVITE_KEY);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired invitation link."
            });
        }

        const { email, familyId, role } = decoded;
        console.log("Decoded invite token:", decoded);

        // 3. Find the user and check if the email matches
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.email !== email) {
            return res.status(403).json({
                success: false,
                message: "Invitation not intended for this user. Please log out and try again."
            });
        }

        // 4. Find the family
        const family = await Family.findById(familyId);
        if (!family) {
            return res.status(404).json({
                success: false,
                message: "Family not found."
            });
        }

        // 5. Check if already a member
        if (family.members.includes(userId)) {
            // ✅ Populate before sending back to frontend even in this case
            const populatedFamily = await Family.findById(familyId)
                .populate('members', 'fullName email role profile')
                .populate('chronicler', 'fullName email role profile');

            return res.status(200).json({
                success: true,
                message: "You are already a member of this family.",
                family: populatedFamily
            });
        }

        // 6. Add user to family members
        family.members.push(userId);
        await family.save();

        // 7. Link user to family and assign role
        user.family = family._id;
        user.role = role || 'Viewer';
        await user.save();

        // 8. Populate full family data to send to frontend
        const updatedFamily = await Family.findById(familyId)
            .populate('members', 'fullName email role profile')
            .populate('chronicler', 'fullName email role profile');

        // 9. Respond with structured JSON
        return res.status(200).json({
            success: true,
            message: `Successfully joined the ${updatedFamily.familyName} family!`,
            family: updatedFamily
        });

    } catch (error) {
        console.error("Error in acceptInvite:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

//controller for memories

export const getMemories = async (req, res) => {
    try {
        const userId = req.id;
        const user = await User.findById(userId);
        if (!user || !user.family) {
            return res.status(404).json({ message: "User or family not found." });
        }

        // Get the optional circleId from the query
        const { search, type, member, tag, circleId, sort } = req.query;
        let query = { family: user.family };

        // Background uploads cannot resume after a server restart. Mark old
        // placeholders as failed so clients do not poll forever.
        const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
        await Memory.updateMany(
            {
                family: user.family,
                status: 'processing',
                createdAt: { $lt: staleBefore }
            },
            { $set: { status: 'failed' } }
        );
        await cleanupFailedMemories(user.family);

        // FIX: Simplified and more robust logic for handling circleId
        if (circleId && circleId !== 'null') {
            // If a specific circleId is provided, filter for it
            query.circleId = circleId;
        } else {
            // Otherwise, fetch memories that are NOT in any circle (for the main archive)
            query.circleId = null;
        }
        // 3. Dynamically add filters to the query if they exist
        if (type && type !== 'all') {
            query.type = type;
        }
        if (member && member !== 'all') {
            // Filter by author ObjectId (member id)
            query.author = member;
        }
        if (tag && tag !== 'all') {
            query.tags = tag;
        }
        // 4. Add the search term to the query using a case-insensitive regex
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { title: { $regex: searchRegex } },
                { story: { $regex: searchRegex } },
            ];
        }

        // 5. Execute the query, populate author, and sort (default newest first)
        const sortOrder = sort === 'asc' ? 'asc' : 'desc';
        const memories = await Memory.find(query)
            .populate("author", "fullName")
            .sort({ date: sortOrder });

        return res.status(200).json({
            success: true,
            memories
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


export const getMemoriesByUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { excludeCircles = 'true', sort = 'desc' } = req.query;
        const requestingUser = await User.findById(req.id).select('family');

        // Validate the ID format first (to avoid CastError)
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        if (!requestingUser?.family) {
            return res.status(404).json({
                success: false,
                message: "User or family not found.",
            });
        }

        await cleanupFailedMemories(requestingUser.family);

        // Base query: authored by user and completed only
        const query = { author: userId, status: 'completed' };

        // Exclude circle-tied memories by default (archive-only)
        if (excludeCircles === 'true') {
            query.$or = [{ circleId: null }, { circleId: { $exists: false } }];
        }

        const memories = await Memory.find(query)
            .populate("author", "fullName email")
            .sort({ date: sort === 'asc' ? 'asc' : 'desc' });

        return res.status(200).json({
            success: true,
            count: memories.length,
            memories,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

//For autocomplete tags

export const getTagSuggestions = async (req, res) => {
    try {
        const userId = req.id;
        const { prefix } = req.query; // Get the user's typed input

        if (!prefix) {
            return res.status(200).json([]); // Return empty array if no prefix
        }

        const user = await User.findById(userId);
        if (!user || !user.family) {
            return res.status(404).json({ message: "User or family not found." });
        }

        // Create a case-insensitive regular expression from the user's input
        const regex = new RegExp(`^${prefix}`, 'i');

        // Use .distinct() to find all unique tags that match the regex
        // within the user's family
        const tags = await Memory.distinct('tags', {
            family: user.family,
            tags: { $regex: regex }
        });

        // Also search aiTags and merge the results
        const aiTags = await Memory.distinct('aiTags', {
            family: user.family,
            aiTags: { $regex: regex }
        });

        // Combine, get unique results, and limit to 10
        const combinedResults = [...new Set([...tags, ...aiTags])];
        const suggestions = combinedResults.slice(0, 10);

        return res.status(200).json(suggestions);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getPdfExport = async (req, res) => {
    try {
        const user = req.user;
        const family = await Family.findById(user.family);

        const {
            onlyMilestones = 'false',
            excludeCircles = 'true',
            sort = 'asc',
            includeTags = 'true',
        } = req.query;

        // 1. Build query
        const query = { family: user.family, status: 'completed' };
        if (onlyMilestones === 'true') query.isMilestone = true;
        if (excludeCircles === 'true') {
            query.$or = [{ circleId: null }, { circleId: { $exists: false } }];
        }

        // 2. Fetch memories
        const memories = await Memory.find(query)
            .populate('author', 'fullName')
            .sort({ date: sort === 'desc' ? 'desc' : 'asc' });

        if (!memories || memories.length === 0) {
            return res.status(404).json({ message: 'No memories to export.' });
        }

        // 3. Create PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // Cover page
        doc.setFontSize(24);
        doc.text(`The ${family.familyName} Family Trunk`, pageWidth / 2, 40, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Exported on ${new Date().toLocaleString()}`, pageWidth / 2, 50, { align: 'center' });
        doc.text(`Entries: ${memories.length}${onlyMilestones === 'true' ? ' (milestones only)' : ''}`, pageWidth / 2, 58, { align: 'center' });

        // Footer page number helper
        const addFooter = () => {
            const pageNo = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.text(`${pageNo}`, pageWidth - 12, pageHeight - 8);
        };
        addFooter();

        // Content pages
        let y = 75;
        doc.setFontSize(12);
        memories.forEach((m, idx) => {
            if (y > pageHeight - 30) {
                doc.addPage();
                addFooter();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.setFontSize(16);
            doc.text(m.title || 'Untitled', 15, y);
            y += 7;

            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            const dateStr = m.date ? new Date(m.date).toLocaleDateString() : '';
            const byline = `By ${m.author?.fullName || 'Unknown'}${dateStr ? ' on ' + dateStr : ''}`;
            doc.text(byline, 15, y);
            y += 6;

            if (includeTags === 'true') {
                const tags = Array.isArray(m.tags) && m.tags.length ? `Tags: ${m.tags.join(', ')}` : '';
                if (tags) {
                    const tagsLines = doc.splitTextToSize(tags, 180);
                    doc.text(tagsLines, 15, y);
                    y += tagsLines.length * 4 + 2;
                }
            }

            doc.setFontSize(12);
            const story = m.story || 'No story written.';
            const lines = doc.splitTextToSize(story, 180);
            lines.forEach((line) => {
                if (y > pageHeight - 20) {
                    doc.addPage();
                    addFooter();
                    y = 20;
                }
                doc.text(line, 15, y);
                y += 6;
            });
            y += 6;
        });

        // 4. Send as Buffer
        const pdfArrayBuffer = doc.output('arraybuffer');
        const buffer = Buffer.from(pdfArrayBuffer);
        const filename = `${family.familyName}_Trunk.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.end(buffer);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
