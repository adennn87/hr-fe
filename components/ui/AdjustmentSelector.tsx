"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export type AdjustmentType = {
  id: string;
  name: string;
  type: "ADD" | "DEDUCT";
};

export type SelectedAdjustment = {
  typeId: string;
  amount: number;
  note?: string;
  name: string;
  type: "ADD" | "DEDUCT";
};

export type AdjustmentSelectorProps = {
  adjustmentTypes: AdjustmentType[];
  value: SelectedAdjustment[]; // source of truth from parent
  onChange: (data: SelectedAdjustment[]) => void; // returns full array of SelectedAdjustment
};

export default function AdjustmentSelector({
  adjustmentTypes,
  value,
  onChange,
}: AdjustmentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAdjustments = useMemo(
    () =>
      adjustmentTypes.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, adjustmentTypes]
  );

  // Add adjustment
  const addAdjustment = (adj: AdjustmentType) => {
    if (value.some((a) => a.typeId === adj.id)) return;
    onChange([...value, { typeId: adj.id, amount: 0, note: "", name: adj.name, type: adj.type }]);
  };

  // Remove adjustment
  const removeAdjustment = (typeId: string) => {
    onChange(value.filter((a) => a.typeId !== typeId));
  };

  // Update amount or note
  const updateAdjustment = (typeId: string, key: "amount" | "note", val: any) => {
    onChange(
      value.map((a) => (a.typeId === typeId ? { ...a, [key]: val } : a))
    );
  };

  return (
    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-blue-600 font-semibold text-sm uppercase tracking-wider">
          Payroll Adjustments
        </div>

        <button
          type="button"
          className="text-sm text-blue-600"
          onClick={() => setOpen(!open)}
        >
          Add adjustment
        </button>
      </div>

      {open && (
        <div className="bg-white border rounded-lg p-3 space-y-3">
          <Input
            placeholder="Search adjustment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredAdjustments.map((adj) => (
              <div
                key={adj.id}
                onClick={() => addAdjustment(adj)}
                className="flex justify-between items-center p-2 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <span className="text-sm">{adj.name}</span>
                <span
                  className={`text-xs ${adj.type === "ADD" ? "text-green-600" : "text-red-600"}`}
                >
                  {adj.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((adj) => (
            <div
              key={adj.typeId}
              className="flex items-center gap-3 bg-white border rounded-md p-3"
            >
              <div className="min-w-[140px]">
                <div className="text-sm font-medium">{adj.name}</div>
                <div className={`text-xs ${adj.type === "ADD" ? "text-green-600" : "text-red-600"}`}>{adj.type}</div>
              </div>

              <Input
                type="number"
                placeholder="Amount"
                className="w-32"
                value={adj.amount}
                onChange={(e) => updateAdjustment(adj.typeId, "amount", Number(e.target.value))}
              />

              <Input
                placeholder="Note"
                className="flex-1"
                value={adj.note || ""}
                onChange={(e) => updateAdjustment(adj.typeId, "note", e.target.value)}
              />

              <button
                type="button"
                className="text-red-500 text-sm"
                onClick={() => removeAdjustment(adj.typeId)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}