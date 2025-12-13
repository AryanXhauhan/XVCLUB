'use client';

import { useState } from 'react';

interface Shade {
    name: string;
    code: string;
}

interface ShadeSelectorProps {
    shades: Shade[];
    onSelect: (shade: string) => void;
    selectedShade?: string;
}

export default function ShadeSelector({ shades, onSelect, selectedShade }: ShadeSelectorProps) {
    return (
        <div>
            <h2 className="text-lg text-xvc-black mb-3">Select Shade</h2>
            <div className="flex gap-4">
                {shades.map((shade) => (
                    <button
                        key={shade.name}
                        onClick={() => onSelect(shade.name)}
                        className={`w-12 h-12 rounded-full border-2 smooth-transition ${
                            selectedShade === shade.name
                                ? 'border-xvc-black scale-110'
                                : 'border-xvc-taupe hover:border-xvc-black'
                        }`}
                        style={{ backgroundColor: shade.code }}
                        title={shade.name}
                        aria-label={`Select shade ${shade.name}`}
                    />
                ))}
            </div>
            {selectedShade && (
                <p className="text-sm text-xvc-graphite mt-2">Selected: {selectedShade}</p>
            )}
        </div>
    );
}

