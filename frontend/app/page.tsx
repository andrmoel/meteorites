'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TooltipProps } from 'recharts';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://ov2v50dhb3.execute-api.eu-central-1.amazonaws.com';

type PriceEntry = {
    date: string;
    averagePricePerGrammInUsd: number;
    pricePerGrammHigh: number;
    pricePerGrammLow: number;
    numberOfSamples: number;
};

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    const entry = payload[0].payload as PriceEntry;
    return (
        <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 4, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}>
            <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600 }}>{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey as string} style={{ margin: '0.2rem 0', color: p.color }}>
                    {p.name}: ${(p.value as number).toFixed(2)}
                </p>
            ))}
            <p style={{ margin: '0.4rem 0 0', color: '#666', borderTop: '1px solid #eee', paddingTop: '0.4rem' }}>
                Samples: {entry.numberOfSamples}
            </p>
        </div>
    );
}

export default function Home() {
    const [name, setName] = useState('Tarda');
    const [input, setInput] = useState('Tarda');
    const [data, setData] = useState<PriceEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [catalogue, setCatalogue] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/meteorites`)
            .then((res) => res.json() as Promise<string[]>)
            .then(setCatalogue)
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!name) return;
        setLoading(true);
        setError(null);
        fetch(`${API_BASE}/meteorites/${encodeURIComponent(name)}`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json() as Promise<PriceEntry[]>;
            })
            .then(setData)
            .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unknown error'))
            .finally(() => setLoading(false));
    }, [name]);

    const filtered = input.length > 0
        ? catalogue.filter((n) => n.toLowerCase().includes(input.toLowerCase())).slice(0, 10)
        : [];

    const highlight = (text: string, query: string) => {
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text;
        return (
            <>
                {text.slice(0, idx)}
                <mark style={{ background: '#fef08a', padding: 0 }}>{text.slice(idx, idx + query.length)}</mark>
                {text.slice(idx + query.length)}
            </>
        );
    };

    const selectSuggestion = (suggestion: string) => {
        setInput(suggestion);
        setName(suggestion);
        setShowSuggestions(false);
    };

    const commit = () => {
        setName(input.trim());
        setShowSuggestions(false);
    };

    return (
        <main style={{ maxWidth: 900, margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1 style={{ marginBottom: '0.25rem' }}>Meteorite Price Tracker</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>Average price per gram (USD) over time</p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
                        onKeyDown={(e) => e.key === 'Enter' && commit()}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Meteorite name"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '1rem', border: '1px solid #ccc', borderRadius: 4, width: '100%', boxSizing: 'border-box' }}
                    />
                    {showSuggestions && filtered.length > 0 && (
                        <ul style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            margin: 0,
                            padding: 0,
                            listStyle: 'none',
                            border: '1px solid #ccc',
                            borderTop: 'none',
                            borderRadius: '0 0 4px 4px',
                            background: '#fff',
                            zIndex: 10,
                            maxHeight: 240,
                            overflowY: 'auto',
                        }}>
                            {filtered.map((suggestion) => (
                                <li
                                    key={suggestion}
                                    onMouseDown={() => selectSuggestion(suggestion)}
                                    style={{ padding: '0.5rem 0.75rem', cursor: 'pointer' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                                >
                                    {highlight(suggestion, input)}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <button
                    onClick={commit}
                    style={{ padding: '0.5rem 1.25rem', fontSize: '1rem', cursor: 'pointer', borderRadius: 4, border: '1px solid #ccc' }}
                >
                    Search
                </button>
            </div>

            {loading && <p>Loading…</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {!loading && !error && data.length === 0 && <p style={{ color: '#666' }}>No data found for "{name}".</p>}

            {!loading && data.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis unit=" $" />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="averagePricePerGrammInUsd" name="Avg $/g" stroke="#6366f1" dot={false} strokeWidth={2} />
                        <Line type="monotone" dataKey="pricePerGrammHigh" name="High $/g" stroke="#22c55e" dot={false} strokeDasharray="4 2" />
                        <Line type="monotone" dataKey="pricePerGrammLow" name="Low $/g" stroke="#ef4444" dot={false} strokeDasharray="4 2" />
                    </LineChart>
                </ResponsiveContainer>
            )}
        </main>
    );
}
