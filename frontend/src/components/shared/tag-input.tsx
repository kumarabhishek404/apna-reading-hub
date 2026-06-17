"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

export function TagInput({ value, onChange, id = "tags" }: TagInputProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Tags</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Startup, AI, Product (comma separated)"
      />
      <p className="text-xs text-stone-500">Separate tags with commas</p>
    </div>
  );
}
