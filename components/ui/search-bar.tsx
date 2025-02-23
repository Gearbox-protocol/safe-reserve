"use client";

import { useState } from "react";
import { Input } from "./input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SearchBar({
  onChange,
  placeholder = "Search...",
  className = "w-64",
  children,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onChange(query);
  };

  return (
    <div className="flex justify-between items-center mb-6 mb-2 mt-6">
      <div className={`relative ${className}`}>
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearch}
          className="pl-10"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          size={18}
        />
      </div>
      {children}
    </div>
  );
}
