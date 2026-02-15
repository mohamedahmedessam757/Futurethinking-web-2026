import React, { useState } from 'react';
import { wavespeedService } from '../../../services/wavespeed';
import videoService from '../../../services/video';
import voiceService from '../../../services/voice';
import { Sparkles, Image, Video, Mic, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const WavespeedTest: React.FC = () => {
    const [status, setStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({
        text: 'idle',
        image: 'idle',
        video: 'idle',
        voice: 'idle'
    });
    const [outputs, setOutputs] = useState<Record<string, any>>({});

    const testText = async () => {
        setStatus(prev => ({ ...prev, text: 'loading' }));
        try {
            const res = await wavespeedService.generateText([{ role: 'user', content: 'Say "Hello Wavespeed" in JSON format: {"message": "..."}' }]);
            setOutputs(prev => ({ ...prev, text: res }));
            setStatus(prev => ({ ...prev, text: 'success' }));
        } catch (e: any) {
            setOutputs(prev => ({ ...prev, text: e.message }));
            setStatus(prev => ({ ...prev, text: 'error' }));
        }
    };

    const testImage = async () => {
        setStatus(prev => ({ ...prev, image: 'loading' }));
        try {
            const res = await videoService.generateVicseeImages(['A futuristic golden neural network brain']);
            if (res.success && res.imageUrls) {
                setOutputs(prev => ({ ...prev, image: res.imageUrls[0] }));
                setStatus(prev => ({ ...prev, image: 'success' }));
            } else {
                throw new Error(res.error || 'No image returned');
            }
        } catch (e: any) {
            setOutputs(prev => ({ ...prev, image: e.message }));
            setStatus(prev => ({ ...prev, image: 'error' }));
        }
    };

    const testVideo = async () => {
        setStatus(prev => ({ ...prev, video: 'loading' }));
        try {
            const res = await videoService.generateShortVideo('A spinning 3D golden coin', { duration: 4 });
            if (res.success && res.videoUrl) {
                setOutputs(prev => ({ ...prev, video: res.videoUrl }));
                setStatus(prev => ({ ...prev, video: 'success' }));
            } else {
                throw new Error(res.error || 'No video returned');
            }
        } catch (e: any) {
            setOutputs(prev => ({ ...prev, video: e.message }));
            setStatus(prev => ({ ...prev, video: 'error' }));
        }
    };

    const testVoice = async () => {
        setStatus(prev => ({ ...prev, voice: 'loading' }));
        try {
            const res = await voiceService.generateVoice('This is a test of the Wavespeed voice system.');
            if (res.success && res.audioUrl) {
                setOutputs(prev => ({ ...prev, voice: res.audioUrl }));
                setStatus(prev => ({ ...prev, voice: 'success' }));
            } else {
                throw new Error(res.error || 'No audio returned');
            }
        } catch (e: any) {
            setOutputs(prev => ({ ...prev, voice: e.message }));
            setStatus(prev => ({ ...prev, voice: 'error' }));
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto bg-[#0f172a] text-white rounded-3xl border border-white/10 shadow-2xl">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <Sparkles className="text-brand-gold" />
                Wavespeed AI Verification
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Text Test */}
                <TestCard
                    title="Text Generation (DeepSeek)"
                    icon={Sparkles}
                    status={status.text}
                    onRun={testText}
                    output={outputs.text && <pre className="text-xs bg-black/50 p-2 rounded overflow-auto h-20">{outputs.text}</pre>}
                />

                {/* Image Test */}
                <TestCard
                    title="Image Generation (Nano/Flux)"
                    icon={Image}
                    status={status.image}
                    onRun={testImage}
                    output={outputs.image && status.image === 'success' ? <img src={outputs.image} className="w-full h-32 object-cover rounded" /> : <div className="text-xs text-red-400">{outputs.image}</div>}
                />

                {/* Voice Test */}
                <TestCard
                    title="Voice Generation (ElevenLabs)"
                    icon={Mic}
                    status={status.voice}
                    onRun={testVoice}
                    output={outputs.voice && status.voice === 'success' ? <audio controls src={outputs.voice} className="w-full mt-2" /> : <div className="text-xs text-red-400">{outputs.voice}</div>}
                />

                {/* Video Test */}
                <TestCard
                    title="Video Generation (Hailuo)"
                    icon={Video}
                    status={status.video}
                    onRun={testVideo}
                    output={outputs.video && status.video === 'success' ? <video controls src={outputs.video} className="w-full h-32 object-cover rounded" /> : <div className="text-xs text-red-400">{outputs.video}</div>}
                />
            </div>
        </div>
    );
};

const TestCard: React.FC<{ title: string; icon: any; status: string; onRun: () => void; output: React.ReactNode }> = ({ title, icon: Icon, status, onRun, output }) => (
    <div className="bg-[#1e293b] p-6 rounded-xl border border-white/5 hover:border-brand-gold/30 transition-colors">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
                    <Icon size={20} />
                </div>
                <h3 className="font-bold">{title}</h3>
            </div>
            <StatusBadge status={status} />
        </div>

        <div className="min-h-[100px] mb-4 bg-black/30 rounded-lg p-2 flex items-center justify-center">
            {status === 'idle' ? <span className="text-gray-500 text-sm">Ready to test</span> : output}
        </div>

        <button
            onClick={onRun}
            disabled={status === 'loading'}
            className="w-full py-2 bg-brand-gold hover:bg-yellow-500 text-brand-navy font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
            {status === 'loading' && <Loader2 className="animate-spin" size={16} />}
            {status === 'loading' ? 'Running API...' : 'Run Test'}
        </button>
    </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const styles = {
        idle: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        success: 'bg-green-500/10 text-green-400 border-green-500/20',
        error: 'bg-red-500/10 text-red-400 border-red-500/20'
    };

    return (
        <span className={`px-2 py-1 rounded text-xs border ${styles[status as keyof typeof styles] || styles.idle} capitalize`}>
            {status}
        </span>
    );
};

export default WavespeedTest;
