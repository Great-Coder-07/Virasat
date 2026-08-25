import React, { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Home from "./components/Home";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import Dashboard from "./components/Dashboard";
import Gallery from "./components/Gallery";
import Family from "./components/Family";
import JoinFamily from "./components/JoinFamily";
import Spinner from "./components/shared/Spinner";

import { getFamilyDetails } from "./redux/familyThunks";
import Memories from "./components/Memories";
import Circles from "./components/Circles";
import { getUserCircles } from "./redux/circleThunks";
import ProtectedRoute from "./components/ProtectedRoutes";
import VerifyOtp from "./components/auth/VerifyOtp";
import Profile from "./components/Profile";
import { fetchMemories } from "./redux/memoryThunks";
import { fetchCurrentUser } from "./redux/authThunks";

const appRouter = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-otp", element: <VerifyOtp /> },
  { path: "/join-family", element: <JoinFamily /> }, // Corrected path name
  {
    element: <ProtectedRoute />, // Wrap protected routes
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/gallery", element: <Gallery /> },
      { path: "/family", element: <Family /> },
      { path: "/memories", element: <Memories /> },
      { path: "/profile", element: <Profile /> },
      { path: "/circles", element: <Circles /> }, // Corrected path name
    ],
  },
]);

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, checked } = useSelector((state) => state.auth);
  // 1. Get the loading state and cache from slices
  const {
    loading: familyLoading,
    loaded: familyLoaded,
    lastFetched: familyLast,
  } = useSelector((state) => state.family);
  const { loaded: circlesLoaded, lastFetched: circlesLast } = useSelector(
    (state) => state.circle
  );

  // Boot: hydrate auth from secure /me endpoint
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    // If the user is authenticated on initial load...
    if (isAuthenticated) {
      const TTL = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();

      // Gate family details
      if (!familyLoaded || now - (familyLast || 0) >= TTL) {
        dispatch(getFamilyDetails());
      }

      // Gate user circles
      if (!circlesLoaded || now - (circlesLast || 0) >= TTL) {
        dispatch(getUserCircles());
      }

      // Always fetch memories for dashboard recent activity
      dispatch(
        fetchMemories({
          searchTerm: "",
          filters: {},
          circleId: "null",
          sort: "desc",
        })
      );
    }
  }, [
    isAuthenticated,
    dispatch,
    familyLoaded,
    familyLast,
    circlesLoaded,
    circlesLast,
  ]);

  // 2. Conditionally render the spinner while family data is being fetched
  if (isAuthenticated && familyLoading) {
    return <Spinner />;
  }
  return (
    // Your main app is rendered after the initial fetch is complete
    <RouterProvider router={appRouter} />
  );
};

export default App;
