import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./shared/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User, Mail, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import axios from "axios";
import { FAMILY_API_ENDPOINT } from "@/utils/constant";
import { InviteMemberPopover } from "./InviteMemberPopover";
import { MemoryDetailModal } from "./Memories";

const getRoleIcon = (role) => {
  switch (role) {
    case "Chronicler":
      return <Crown className="h-4 w-4 text-amber-500" />;
    case "Admin":
      return <Shield className="h-4 w-4 text-sky-500" />;
    default:
      return <User className="h-4 w-4 text-gray-400" />;
  }
};

const handleViewMemoriesForUser = (userId) => {
  axios
    .get(`${FAMILY_API_ENDPOINT}/memories/user/${userId}`, {
      withCredentials: true,
    })
    .then((response) => {
      // Handle the response data (e.g., display memories)
      console.log("User memories:", response.data.memories);
    })
    .catch((error) => {
      console.error("Error fetching user memories:", error);
    });
};

const MemberCard = ({ member, currentUserRole, onCardClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between p-4 bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-rose-100 cursor-pointer"
    onClick={() => onCardClick(member)} // 1. Make the card clickable
  >
    <div className="flex items-center gap-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={member.profile?.profilePhoto} alt={member.fullName} />
        <AvatarFallback className="bg-rose-200 text-rose-700">
          {member.fullName[0]}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-rose-900">{member.fullName}</p>
        <div className="flex items-center gap-2 text-sm text-rose-600">
          <Mail className="h-4 w-4" />
          <span>{member.email}</span>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Badge variant="outline" className="flex items-center gap-1">
        {getRoleIcon(member.role)}
        {member.role}
      </Badge>
      {currentUserRole === "Chronicler" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* 2. Stop propagation to prevent card click when menu is clicked */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem>Change Role</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              Remove Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  </motion.div>
);

const MemberDetailSidebar = ({ member, onClose, onMemoryClick }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-fetch archive-only memories when sidebar opens or member changes
  useEffect(() => {
    let active = true;
    setMemories([]);
    setLoading(true);
    setError("");

    axios
      .get(`${FAMILY_API_ENDPOINT}/memories/user/${member._id}`, {
        params: { excludeCircles: "true", sort: "desc" },
        withCredentials: true,
      })
      .then((response) => {
        if (!active) return;
        setMemories(response.data.memories || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || "Failed to fetch memories");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [member]);

  return (
    <motion.div
      className="fixed top-0 right-0 h-full w-full max-w-sm bg-rose-50/80 backdrop-blur-md shadow-lg z-50 border-l border-rose-200 overflow-y-auto"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 180 }}
    >
      <div className="p-6 text-center flex flex-col items-center">
        <button
          className="absolute top-4 left-4 text-rose-600 hover:text-rose-800 text-3xl"
          onClick={onClose}
        >
          &times;
        </button>
        <Avatar className="h-24 w-24 mt-8 border-4 border-white shadow-lg">
          <AvatarImage
            src={member.profile?.profilePhoto}
            alt={member.fullName}
          />
          <AvatarFallback className="bg-rose-200 text-rose-800 text-3xl">
            {member.fullName[0]}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-3xl font-bold font-serif text-rose-800 mt-4">
          {member.fullName}
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant="secondary"
            className="flex items-center gap-1.5 text-md"
          >
            {getRoleIcon(member.role)}
            {member.role}
          </Badge>
        </div>
        <p className="text-rose-700 mt-4">{member.email}</p>

        {/* Render loading, error, or memories */}
        {loading && (
          <div className="mt-6 grid grid-cols-2 gap-3 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white/60 border border-rose-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="mt-4 w-full grid grid-cols-2 gap-3">
            {memories.length === 0 ? (
              <p className="col-span-2 text-rose-600 text-center">
                No archive memories yet.
              </p>
            ) : (
              memories.map((mem) => {
                const thumb = mem.mediaURLs?.[0];
                return (
                  <div
                    key={mem._id}
                    className="bg-white rounded-lg border border-rose-100 overflow-hidden shadow-sm cursor-pointer group"
                    onClick={() => onMemoryClick && onMemoryClick(mem)}
                    title={mem.title}
                  >
                    <div className="relative h-28 w-full bg-gray-100">
                      {thumb ? (
                        thumb.type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-gray-600">Video</span>
                          </div>
                        ) : (
                          <img
                            src={thumb.url}
                            alt={mem.title}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No media
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-semibold text-rose-800 truncate">
                        {mem.title}
                      </p>
                      <p className="text-xs text-rose-600">
                        {new Date(mem.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ====================================================================
// Main Component
// ====================================================================

export default function FamilyMembers() {
  const { familyData } = useSelector((state) => state.family);
  const { user: currentUser } = useSelector((state) => state.auth);

  // 3. Add state to manage the selected member and selected memory
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemory, setSelectedMemory] = useState(null);

  const currentUserInFamily = familyData?.members?.find(
    (m) => m._id === currentUser._id
  );
  const currentUserRole = currentUserInFamily?.role;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
      <Navbar />
      <main className="container mx-auto max-w-4xl py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold font-serif text-rose-800 text-center">
            Our Family Members
          </h1>
          <p className="text-rose-700 text-center mt-2">
            Everyone who is a part of the "{familyData?.familyName || "Family"}"
            trunk.
          </p>
          {/*  Conditionally render the button based on the user's role */}
          {currentUserRole === "Chronicler" && (
            <div className="text-center md:text-right">
              <InviteMemberPopover />
            </div>
          )}
        </motion.div>

        <motion.div
          className="mt-8 space-y-4"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          animate="visible"
        >
          {(familyData?.members || []).map((member) => (
            <MemberCard
              key={member._id}
              member={member}
              currentUserRole={currentUserRole}
              onCardClick={setSelectedMember} // 4. Pass the click handler
            />
          ))}
        </motion.div>
      </main>

      {/* 5. Conditionally render the sidebar */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDetailSidebar
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onMemoryClick={setSelectedMemory}
          />
        )}
      </AnimatePresence>

      {/* Memory slideshow modal (reuses the shared MemoryDetailModal) */}
      <AnimatePresence>
        {selectedMemory && (
          <MemoryDetailModal
            memory={selectedMemory}
            onClose={() => setSelectedMemory(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
