import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./shared/Navbar";
import { createCircle } from "@/redux/circleThunks";
import { useNavigate } from "react-router";
import { CreateCircleModal } from "./CreateCircleModal";
import { AnimatePresence } from "framer-motion";
import axios from "axios";
import { FAMILY_API_ENDPOINT } from "@/utils/constant";
import { fetchMemories } from "@/redux/memoryThunks";
import { getUserCircles } from "@/redux/circleThunks";
import { getFamilyDetails } from "@/redux/familyThunks";
import { Loader2 } from "lucide-react";

// --- Icons updated with the new color theme ---
const ClockIcon = () => <span className="text-sky-500">🕒</span>;
const LightbulbIcon = () => <span className="text-green-500">💡</span>;
const UsersIcon = () => <span className="text-blue-500">👨‍👩‍👧‍👦</span>;
const CircleIcon = () => <span className="mr-2">👥</span>;

const getFormattedDate = () => {
  const date = new Date();
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "long" });
  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";
  return `${month} ${day}${suffix}`;
};
// Sample family members data (In a real app, this would come from Redux or an API)

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    familyData,
    loaded: familyLoaded,
    loading: familyLoading,
  } = useSelector((state) => state.family);
  const {
    items: memories,
    loaded: memoriesLoaded,
    loading: memoriesLoading,
  } = useSelector((state) => state.memories);
  const {
    items: circles,
    loaded: circlesLoaded,
    loading: circlesLoading,
  } = useSelector((state) => state.circle);
  const handleExportPdf = async () => {
    try {
      const params = {
        onlyMilestones: "false",
        excludeCircles: "true",
        sort: "asc",
        includeTags: "true",
      };
      const response = await axios.get(`${FAMILY_API_ENDPOINT}/export-pdf`, {
        params,
        responseType: "blob",
        withCredentials: true,
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const familyName = familyData?.familyName || "Family_Trunk";
      a.download = `${familyName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      // Optional: surface a toast if your app uses it
    }
  };
  const today = getFormattedDate();

  // --- STATE MANAGEMENT FOR CIRCLE CREATION ---
  const [isCircleModalOpen, setIsCircleModalOpen] = useState(false);

  // Ensure data is loaded for Recent Activity and Overview
  useEffect(() => {
    const id = setInterval(() => {
      dispatch(
        fetchMemories({
          searchTerm: "",
          filters: {},
          circleId: "null",
          sort: "desc",
        })
      );
    }, 60000);
    return () => clearInterval(id);
  }, [dispatch]);

  const familyMembers = familyData?.members || [];
  const recentUploads = useMemo(() => {
    const getTs = (m) =>
      new Date(m?.createdAt || m?.updatedAt || m?.date || 0).getTime();
    return [...(memories || [])]
      .filter(Boolean)
      .sort((a, b) => getTs(b) - getTs(a))
      .slice(0, 5);
  }, [memories]);

  // Story prompts: light motivation to add stories
  const prompts = [
    "Share a family tradition that always makes you smile.",
    "What was the best advice your grandmother gave you?",
    "Tell us about a photo that means a lot to your family.",
    "Describe a meal that brings your family together.",
    "What's a small moment you never want to forget?",
  ];
  const [promptIndex, setPromptIndex] = useState(0);
  const nextPrompt = () => setPromptIndex((i) => (i + 1) % prompts.length);

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            {/* 2. New Text Colors: Using sky and slate for better contrast */}
            <h1 className="text-3xl font-bold font-serif text-sky-800">
              Welcome back, {user?.fullName || "Friend"}!
            </h1>
            <p className="text-slate-600">
              Here's what's happening in your family's haven.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 3. New Button Colors: A vibrant blue for the primary action */}
            <button
              onClick={() => setIsCircleModalOpen(true)}
              className="flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 cursor-pointer"
            >
              <CircleIcon />
              Create a Private Circle
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              title="Export a PDF of your family's memories"
            >
              📄 Export PDF
            </button>
          </div>
        </header>

        {/* --- Dashboard Grid with updated card styles --- */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Family Overview (replaces On This Day) */}
          <section className="lg:col-span-2 lg:row-span-2 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon />
              <h2 className="text-xl font-bold text-sky-800">
                Family Overview
              </h2>
            </div>
            {(!familyLoaded && familyLoading) ||
            (!circlesLoaded && circlesLoading) ||
            (!memoriesLoaded && memoriesLoading) ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-sky-700">
                    {familyMembers.length}
                  </span>
                  <span className="text-slate-700">Members</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-green-700">
                    {memories.length}
                  </span>
                  <span className="text-slate-700">Memories</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-blue-700">
                    {circles.length}
                  </span>
                  <span className="text-slate-700">Circles</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-700">
                    {recentUploads.length}
                  </span>
                  <span className="text-slate-700">Recent Uploads</span>
                </div>
              </div>
            )}
          </section>

          {/* Story Prompts (encourage uploads) */}
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <LightbulbIcon />
              <h2 className="text-xl font-bold text-sky-800">Story Prompts</h2>
            </div>
            <div className="space-y-4">
              <p className="text-lg font-serif italic text-slate-800">
                “{prompts[promptIndex]}”
              </p>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-lg bg-sky-100 py-2 text-sky-800 transition hover:bg-sky-200 cursor-pointer"
                  onClick={nextPrompt}
                >
                  Next Prompt
                </button>
                <button
                  className="flex-1 rounded-lg bg-sky-600 py-2 text-white transition hover:bg-sky-700 cursor-pointer"
                  onClick={() => navigate("/memories")}
                >
                  Share Your Story
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <UsersIcon />
              <h2 className="text-xl font-bold text-sky-800">
                Recent Activity
              </h2>
            </div>
            {!memoriesLoaded && memoriesLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 text-sky-600 animate-spin" />
              </div>
            ) : (
              <ul className="space-y-3 text-sm text-slate-700">
                {recentUploads.length === 0 ? (
                  <li className="text-slate-500">No recent uploads.</li>
                ) : (
                  recentUploads.map((m) => (
                    <li key={m._id} className="flex items-center gap-2">
                      <span className="font-semibold">
                        {m.author?.fullName || "Someone"}
                      </span>
                      added{" "}
                      <span className="font-semibold">
                        {m.mediaURLs?.length || 1}
                      </span>{" "}
                      {m.mediaURLs?.length === 1 ? "item " : "items "}
                      to "{m.title}" on{" "}
                      {new Date(
                        m.createdAt || m.updatedAt || m.date
                      ).toLocaleString()}
                      .
                    </li>
                  ))
                )}
              </ul>
            )}
          </section>

          {/* Quick Actions - full width row under grid */}
          <section className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <LightbulbIcon />
              <h2 className="text-xl font-bold text-sky-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                className="w-full rounded-lg bg-green-100 py-2 text-green-800 transition hover:bg-green-200 cursor-pointer"
                onClick={handleExportPdf}
              >
                Export Family PDF
              </button>
              <button
                className="w-full rounded-lg bg-emerald-100 py-2 text-emerald-800 transition hover:bg-emerald-200 cursor-pointer"
                onClick={() => navigate("/memories")}
              >
                View All Memories
              </button>
            </div>
          </section>
        </div>
      </main>

      <AnimatePresence>
        {isCircleModalOpen && (
          <CreateCircleModal
            isOpen={isCircleModalOpen}
            onClose={() => setIsCircleModalOpen(false)}
            familyMembers={familyMembers}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
