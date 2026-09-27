import { createContext, useContext, useState, useEffect } from "react";

const DEFAULT_PROFILE = {
  name: "Sowmiya",
  initials: "SM",
  email: "Sowmiya@gmail.com",
  phone: "+91 98765 43210",
  apartment: "Apartment A-402",
  building: "Block A",
  floor: "4th Floor",
  meterId: "WM-A101-2026",
  accountType: "Resident Household",
  residentSince: "January 2024",
  accountStatus: "Active",
  quota: "25.0 KL / month",
  occupants: "4 Family Members",
};

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("userProfile");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure initials match name if not explicitly set
        if (parsed.name && !parsed.initials) {
          parsed.initials = parsed.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        }
        return { ...DEFAULT_PROFILE, ...parsed };
      } catch (e) {
        console.error("Failed to parse stored user profile", e);
      }
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (fields) => {
    setProfile((prev) => {
      const updated = { ...prev, ...fields };
      if (fields.name) {
        const parts = fields.name.trim().split(" ");
        updated.initials =
          parts.length > 1
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
            : parts[0].slice(0, 2).toUpperCase();
      }
      return updated;
    });
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
