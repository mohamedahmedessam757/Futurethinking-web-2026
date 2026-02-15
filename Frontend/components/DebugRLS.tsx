import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const DebugRLS = () => {
    const [user, setUser] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const checkData = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Get Current User
            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            setUser(currentUser);

            // 2. Fetch Consultation Services directly
            if (currentUser) {
                const { data: servicesData, error: dbError } = await supabase
                    .from('consultation_services')
                    .select('*');

                if (dbError) throw dbError;
                setServices(servicesData || []);
            }
        } catch (err: any) {
            console.error('Debug Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkData();
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-black/90 text-white p-8 overflow-auto font-mono text-sm ltr" dir="ltr">
            <h1 className="text-2xl font-bold text-red-500 mb-4">📢 SUPER DEBUGGER</h1>
            <button
                onClick={() => window.location.reload()}
                className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded font-bold"
            >
                Close (Reload)
            </button>
            <button
                onClick={checkData}
                className="bg-blue-600 px-4 py-2 rounded font-bold mb-6 hover:bg-blue-700"
            >
                Refresh Data
            </button>

            <div className="grid grid-cols-2 gap-8">
                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                    <h2 className="text-xl font-bold mb-2 text-green-400">👤 Current User</h2>
                    {user ? (
                        <pre>{JSON.stringify({
                            id: user.id,
                            email: user.email,
                            role: user.role
                        }, null, 2)}</pre>
                    ) : (
                        <p className="text-red-400">No user logged in!</p>
                    )}
                </div>

                <div className="bg-gray-900 p-4 rounded border border-gray-700">
                    <h2 className="text-xl font-bold mb-2 text-yellow-400">📦 Consultation Services Table</h2>
                    {loading && <p className="animate-pulse">Loading...</p>}
                    {error && <p className="text-red-500 font-bold bg-red-900/20 p-2">{error}</p>}

                    {!loading && !error && (
                        <>
                            <p className="mb-2">Total Rows Found: <span className="font-bold text-xl">{services.length}</span></p>
                            {services.length > 0 ? (
                                <div className="space-y-2">
                                    {services.map(s => (
                                        <div key={s.id} className="p-2 bg-black/50 border border-gray-800 rounded">
                                            <p><span className="text-gray-500">ID:</span> {s.id}</p>
                                            <p><span className="text-gray-500">Title:</span> {s.title}</p>
                                            <p>
                                                <span className="text-gray-500">Consultant ID:</span>
                                                <span className={s.consultant_id === user?.id ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                                    {' '}{s.consultant_id}
                                                </span>
                                            </p>
                                            <p><span className="text-gray-500">Status:</span> {s.status}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No services found. If you have data in Supabase, RLS is hiding it.</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebugRLS;
