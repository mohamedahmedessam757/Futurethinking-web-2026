import { useState } from 'react';
import { motion } from 'framer-motion';
import { wavespeedService } from '../../../services/wavespeed';

export default function WavespeedTest() {
    const [status, setStatus] = useState<Record<string, string | null>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [results, setResults] = useState<Record<string, any>>({});

    const runTest = async (type: 'text' | 'image' | 'video' | 'voice') => {
        setLoading(prev => ({ ...prev, [type]: true }));
        setStatus(prev => ({ ...prev, [type]: 'Running...' }));

        try {
            let result;
            if (type === 'text') {
                result = await wavespeedService.generateText([{ role: 'user', content: 'Say "Wavespeed is active" in Arabic' }]);
                setStatus(prev => ({ ...prev, [type]: 'Success ✅' }));
                setResults(prev => ({ ...prev, [type]: result }));
            }
            if (type === 'image') {
                result = await wavespeedService.generateImage('A futuristic golden city');
                setStatus(prev => ({ ...prev, [type]: 'Success ✅' }));
                setResults(prev => ({ ...prev, [type]: result }));
            }
            if (type === 'video') {
                result = await wavespeedService.generateVideo('A cat typing on a keyboard', 6);
                setStatus(prev => ({ ...prev, [type]: 'Success ✅' }));
                setResults(prev => ({ ...prev, [type]: result }));
            }
            if (type === 'voice') {
                result = await wavespeedService.generateVoice('Wavespeed audio test successful', 'Ethan');
                setStatus(prev => ({ ...prev, [type]: 'Success ✅' }));
                setResults(prev => ({ ...prev, [type]: result }));
            }
        } catch (error: any) {
            console.error(error);
            setStatus(prev => ({ ...prev, [type]: `Failed ❌: ${error.message}` }));
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-brand-orange-light">
                Wavespeed AI Verification
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Text Test */}
                <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">DeepSeek Text</h3>
                        <button
                            onClick={() => runTest('text')}
                            disabled={loading.text}
                            className="px-3 py-1 bg-brand-gold text-black rounded hover:bg-white transition disabled:opacity-50"
                        >
                            {loading.text ? 'Testing...' : 'Test Now'}
                        </button>
                    </div>
                    {status.text && <p className="text-sm text-gray-400 mb-2">{status.text}</p>}
                    {results.text && <p className="p-2 bg-black/30 rounded text-green-400 text-sm font-mono">{results.text}</p>}
                </div>

                {/* Image Test */}
                <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">Nano Banana Image</h3>
                        <button
                            onClick={() => runTest('image')}
                            disabled={loading.image}
                            className="px-3 py-1 bg-brand-gold text-black rounded hover:bg-white transition disabled:opacity-50"
                        >
                            {loading.image ? 'Testing...' : 'Test Now'}
                        </button>
                    </div>
                    {status.image && <p className="text-sm text-gray-400 mb-2">{status.image}</p>}
                    {results.image && <img src={results.image} alt="Test" className="w-full h-32 object-cover rounded border border-brand-gold/20" />}
                </div>

                {/* Video Test */}
                <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">Hailuo Video</h3>
                        <button
                            onClick={() => runTest('video')}
                            disabled={loading.video}
                            className="px-3 py-1 bg-brand-gold text-black rounded hover:bg-white transition disabled:opacity-50"
                        >
                            {loading.video ? 'Testing...' : 'Test Now'}
                        </button>
                    </div>
                    {status.video && <p className="text-sm text-gray-400 mb-2">{status.video}</p>}
                    {results.video && (
                        <video controls className="w-full rounded border border-brand-gold/20">
                            <source src={results.video} type="video/mp4" />
                        </video>
                    )}
                </div>

                {/* Voice Test */}
                <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-white">Flash v2 Voice</h3>
                        <button
                            onClick={() => runTest('voice')}
                            disabled={loading.voice}
                            className="px-3 py-1 bg-brand-gold text-black rounded hover:bg-white transition disabled:opacity-50"
                        >
                            {loading.voice ? 'Testing...' : 'Test Now'}
                        </button>
                    </div>
                    {status.voice && <p className="text-sm text-gray-400 mb-2">{status.voice}</p>}
                    {results.voice && (
                        <audio controls className="w-full mt-2">
                            <source src={results.voice} type="audio/mpeg" />
                        </audio>
                    )}
                </div>
            </div>
        </div>
    );
}
