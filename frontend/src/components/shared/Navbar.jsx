import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, User2 } from "lucide-react";
import { Button } from "../ui/button";
import { logoutUser } from "@/redux/authThunks";

const Navbar = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((store) => store.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    // FIX 1: Updated header to use a clean white/slate theme
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:px-6 lg:px-8">
        {/* Brand/Logo */}
        <Link to={"/"} className="flex items-center">
          {/* FIX 2: Changed brand color to blue */}
          <span className="text-2xl font-bold font-serif text-sky-800">
            Virasat
          </span>
        </Link>

        {/* Navigation Links & User Menu / Login Buttons */}
        <div className="flex items-center space-x-8">
          <nav className="hidden items-center space-x-8 md:flex">
            {isAuthenticated ? (
              <>
                {/* FIX 3: Updated link colors to a neutral slate/blue */}
                <Link
                  to={"/dashboard"}
                  className="font-medium text-slate-700 hover:text-sky-800 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to={"/memories"}
                  className="font-medium text-slate-700 hover:text-sky-800 transition-colors"
                >
                  Memories
                </Link>
                <Link
                  to={"/circles"}
                  className="font-medium text-slate-700 hover:text-sky-800 transition-colors"
                >
                  Circles
                </Link>
                <Link
                  to={"/gallery"}
                  className="font-medium text-slate-700 hover:text-sky-800 transition-colors"
                >
                  Gallery
                </Link>
                <Link
                  to={"/family"}
                  className="font-medium text-slate-700 hover:text-sky-800 transition-colors"
                >
                  Family
                </Link>
              </>
            ) : (
              <>
                {/* FIX 4: Updated button colors to match the new theme */}
                <Link
                  to={"/login"}
                  className="bg-sky-600 hover:bg-sky-700 text-white rounded-xl px-5 py-2 text-sm font-medium shadow-md transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  to={"/signup"}
                  className="bg-slate-100 text-sky-800 hover:bg-slate-200 rounded-xl px-5 py-2 text-sm font-medium shadow-md transition-colors duration-300"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* User Avatar Popover */}
          {isAuthenticated && user && (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage
                    src={user.profile?.profilePhoto}
                    alt={user.fullName}
                  />
                  {/* FIX 5: Updated popover colors */}
                  <AvatarFallback className="bg-sky-100 text-sky-800 font-bold">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-white border border-slate-200">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage
                      src={user.profile?.profilePhoto}
                      alt={user.fullName}
                    />
                    <AvatarFallback className="bg-sky-100 text-sky-800 font-bold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sky-900">
                      {user.fullName}
                    </h4>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col my-2 mt-4 text-slate-600">
                  <div className="flex w-fit items-center gap-2 cursor-pointer hover:text-sky-800">
                    <User2 size={16} />
                    <Button
                      asChild
                      variant="link"
                      className="p-0 text-slate-600 hover:text-sky-800"
                    >
                      <Link to={"/profile"}>View Profile</Link>
                    </Button>
                  </div>
                  <div
                    onClick={handleLogout}
                    className="flex w-fit items-center gap-2 cursor-pointer hover:text-sky-800"
                  >
                    <LogOut size={16} />
                    <Button
                      variant="link"
                      className="p-0 text-slate-600 hover:text-sky-800 cursor-pointer"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
