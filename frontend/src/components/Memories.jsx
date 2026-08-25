import React from "react";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector, useDispatch } from "react-redux";
import { Loader2, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { UploadMemoryModal } from "@/components/UploadMemoryModal";
import { PlusCircle } from "lucide-react";
import { fetchMemories } from "@/redux/memoryThunks"; // Your Redux thunk
import { FAMILY_API_ENDPOINT } from "@/utils/constant";
import Navbar from "./shared/Navbar";

// ====================================================================
// 1. Tag Autocomplete Component (Backend-powered & Debounced)
// ====================================================================
const TagAutocomplete = ({ onTagSelect }) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSuggestions = useCallback(async (prefix) => {
    if (!prefix) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${FAMILY_API_ENDPOINT}/tags/autocomplete`,
        {
          params: { prefix },
          withCredentials: true,
        }
      );
      setSuggestions(response.data);
    } catch (error) {
      console.error("Failed to fetch tag suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
    return () => clearTimeout(handler);
  }, [inputValue, fetchSuggestions]);

  const handleSelect = (tag) => {
    onTagSelect(tag);
    setInputValue(tag); // Show the selected tag in the input
    setSuggestions([]);
  };

  return (
    <div className="relative z-20">
      <div className="relative">
        <input
          type="text"
          placeholder="Filter by tag..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full p-2 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-400"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>
      {suggestions.length > 0 && (
        <motion.ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {suggestions.map((tag) => (
            <li
              key={tag}
              onClick={() => handleSelect(tag)}
              className="px-4 py-2 cursor-pointer hover:bg-rose-50"
            >
              {tag}
            </li>
          ))}
        </motion.ul>
      )}
    </div>
  );
};

// ====================================================================
// 2. Filter Bar Component
// ====================================================================
const FilterBar = ({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onTagSelect,
  members = [],
  sortOrder,
  onSortChange,
}) => (
  <motion.div
    className="relative z-20 mb-8 p-4 bg-white/60 backdrop-blur-md rounded-xl shadow-md"
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <input
        type="text"
        placeholder="Search memories..."
        value={searchTerm}
        onChange={onSearchChange}
        className="w-full p-2 border border-rose-200 rounded-lg"
      />
      <select
        name="type"
        value={filters.type}
        onChange={onFilterChange}
        className="p-2 border border-rose-200 rounded-lg cursor-pointer"
      >
        <option value="all">All Types</option>
        <option value="photo">Photos</option>
        <option value="video">Videos</option>
        <option value="story">Stories</option>
      </select>
      <select
        name="member"
        value={filters.member}
        onChange={onFilterChange}
        className="p-2 border border-rose-200 rounded-lg cursor-pointer"
      >
        <option value="all">All Members</option>
        {members.map((m) => (
          <option key={m._id} value={m._id}>
            {m.fullName}
          </option>
        ))}
      </select>
      <TagAutocomplete onTagSelect={onTagSelect} />
      <select
        name="sort"
        value={sortOrder}
        onChange={(e) => onSortChange(e.target.value)}
        className="p-2 border border-rose-200 rounded-lg"
      >
        <option value="desc">Recent to Oldest</option>
        <option value="asc">Oldest to Recent</option>
      </select>
    </div>
  </motion.div>
);

// ====================================================================
// 3. Memory Card and Modal Components
// ====================================================================

const MemoryCard = ({ memory, onCardClick }) => {
  const isProcessing = memory.status === "processing";
  const hasFailed = memory.status === "failed";
  const isUnavailable = isProcessing || hasFailed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col ${
        isUnavailable ? "cursor-not-allowed filter grayscale" : "cursor-pointer"
      }`}
      onClick={() => !isUnavailable && onCardClick(memory)}
    >
      <div className="relative w-full h-48 overflow-hidden">
        {isUnavailable ? (
          <img
            src={`https://placehold.co/600x400/fecdd3/b91c1c?text=${
              hasFailed ? "Upload+Failed" : "Processing..."
            }`}
            alt={hasFailed ? "Upload failed" : "Processing"}
            className="w-full h-full object-cover"
          />
        ) : (
          (() => {
            const first = memory.mediaURLs?.[0];
            if (!first) return null;
            if (first.type === "video") {
              return (
                <div className="relative w-full h-full">
                  <video
                    src={first.url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                    /* Do not autoplay or loop; pause until card click opens modal */
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/40 rounded-full p-3">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <img
                src={first.url}
                alt={memory.title}
                className="w-full h-full object-cover"
              />
            );
          })()
        )}

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
        {hasFailed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-center text-sm font-medium text-white">
            Upload failed. Please try adding this memory again.
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold font-serif text-rose-800">
          {memory.title}
        </h3>
        <p className="text-sm text-rose-600">
          {memory.author?.fullName || "..."} -{" "}
          {new Date(memory.date).toLocaleDateString()}
        </p>
        <div className="mt-2 flex flex-wrap gap-1 pt-2 border-t border-rose-100 flex-grow content-start">
          {memory.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-rose-100 text-rose-800 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export const MemoryDetailModal = ({ memory, onClose }) => {
  const media = Array.isArray(memory.mediaURLs) ? memory.mediaURLs : [];
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // highlights autoplay for images only

  const hasMultiple = media.length > 1;

  const goPrev = useCallback(() => {
    if (!media.length) return;
    setIndex((i) => (i - 1 + media.length) % media.length);
  }, [media.length]);

  const goNext = useCallback(() => {
    if (!media.length) return;
    setIndex((i) => (i + 1) % media.length);
  }, [media.length]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext, onClose]);

  // Autoplay highlights for images only
  useEffect(() => {
    if (!isPlaying || !media.length) return;
    const current = media[index];
    // Only auto-advance for images; videos require user action
    if (current?.type !== "image") return;
    const id = setTimeout(goNext, 2500);
    return () => clearTimeout(id);
  }, [isPlaying, index, media, goNext]);

  // Ensure index in range when memory changes
  useEffect(() => {
    if (index >= media.length) setIndex(0);
  }, [media.length, index]);

  const current = media[index];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-3xl lg:max-w-4xl bg-white rounded-2xl p-5 lg:p-6 relative max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl font-bold text-rose-700"
        >
          &times;
        </button>

        <h2 className="text-2xl lg:text-3xl font-bold font-serif text-rose-800 mb-2 pr-10">
          {memory.title}
        </h2>
        <p className="text-sm lg:text-md text-rose-600 mb-4">
          {memory.author.fullName} -{" "}
          {new Date(memory.date).toLocaleDateString()}
        </p>

        {/* Viewer */}
        <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full flex items-center justify-center"
            >
              {current?.type === "video" ? (
                <video
                  src={current.url}
                  controls
                  className="max-w-full max-h-full rounded-lg"
                  playsInline
                />
              ) : current ? (
                <img
                  src={current.url}
                  alt={`${memory.title}-${index}`}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : null}
            </motion.div>
          </AnimatePresence>

          {/* Prev/Next controls */}
          {hasMultiple && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Highlights play/pause (images only autoplay) */}
          {hasMultiple && (
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="absolute bottom-2 left-2 px-3 py-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 text-sm inline-flex items-center gap-1"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </button>
          )}
        </div>

        {/* Thumbnails */}
        {hasMultiple && (
          <div className="mt-3 flex gap-2 overflow-x-auto py-1">
            {media.map((m, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`relative h-16 w-24 flex-shrink-0 rounded-md overflow-hidden border ${
                  index === i ? "border-rose-600" : "border-transparent"
                }`}
                aria-label={`Go to item ${i + 1}`}
              >
                {m.type === "video" ? (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Play className="h-6 w-6 text-gray-700" />
                  </div>
                ) : (
                  <img
                    src={m.url}
                    alt={`thumb-${i}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 pb-2">
          <hr className="border-rose-100 mb-3" />
          <h3 className="text-lg font-semibold text-rose-800 mb-2">Story</h3>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {memory.story && memory.story.trim().length > 0
              ? memory.story
              : "No story written yet."}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ====================================================================
// 4. Main Archive Page Component
// ====================================================================
export default function ArchivePage() {
  const dispatch = useDispatch();
  const { items: memories, loading } = useSelector((state) => state.memories);
  const members = useSelector(
    (state) => state.family.familyData?.members || []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "all",
    member: "all",
    tag: "all",
  });
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const handler = setTimeout(() => {
      dispatch(
        fetchMemories({
          searchTerm,
          filters,
          circleId: "null",
          sort: sortOrder,
        })
      ); // Adjust circleId as needed
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, filters, sortOrder, dispatch]);

  useEffect(() => {
    if (!memories.some((memory) => memory.status === "processing")) return;

    const intervalId = setInterval(() => {
      dispatch(
        fetchMemories({
          searchTerm,
          filters,
          circleId: "null",
          sort: sortOrder,
        })
      );
    }, 5000);

    return () => clearInterval(intervalId);
  }, [memories, searchTerm, filters, sortOrder, dispatch]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-100 via-pink-50 to-amber-50">
      <Navbar />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* FIX 1: Add a persistent "Add Memory" button */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold font-serif text-rose-800">
            The Archive
          </h1>
          <motion.button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-md font-medium text-white shadow-lg transition-colors duration-300 hover:bg-rose-700 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <PlusCircle size={20} />
            Add Memory
          </motion.button>
        </div>

        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          filters={filters}
          onFilterChange={(e) =>
            setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
          }
          onTagSelect={(tag) => setFilters((prev) => ({ ...prev, tag }))}
          members={members}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
        />

        {loading && memories.length === 0 ? (
          <div className="flex justify-center items-center mt-16">
            <Loader2 className="h-12 w-12 text-rose-500 animate-spin" />
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {memories.map((memory) => (
                  <MemoryCard
                    key={memory._id}
                    memory={memory}
                    onCardClick={setSelectedMemory}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {!loading && memories.length === 0 && (
              <div className="text-center mt-16">
                <h3 className="text-2xl font-semibold text-rose-800">
                  Your Archive is Empty
                </h3>
                <p className="text-rose-600 mt-2 mb-6">
                  Start preserving your family's history by adding your first
                  memory.
                </p>
                {/* The main button is now in the header, so this is a simplified CTA */}
                <motion.button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-4 text-lg font-medium text-white shadow-lg cursor-pointer"
                >
                  <PlusCircle />
                  Upload a Memory
                </motion.button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FIX 2: Move modal presence checks to the top level */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadMemoryModal onClose={() => setIsUploadModalOpen(false)} />
        )}
      </AnimatePresence>
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
