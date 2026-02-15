
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return {};

        const content = fs.readFileSync(envPath, 'utf-8');
        const env: Record<string, string> = {};

        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Error reading .env.local:', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
    // Try process.env as fallback
    if (!process.env.VITE_SUPABASE_URL) process.exit(1);
}

const finalUrl = supabaseUrl || process.env.VITE_SUPABASE_URL!;
const finalKey = supabaseKey || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(finalUrl, finalKey);

async function main() {
    console.log('🔍 Checking Supabase Buckets...');

    // List Buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error.message);
    } else {
        console.log(`✅ Buckets found: ${buckets.length}`);
        buckets.forEach(b => console.log(` - ${b.name} (public: ${b.public})`));

        const bookFiles = buckets.find(b => b.name === 'book-files');
        if (!bookFiles) {
            console.error('❌ "book-files" bucket is MISSING!');
        } else {
            console.log('✅ "book-files" bucket exists.');
        }
    }

    console.log('\n🔍 Checking Latest Book Preview URL...');
    const { data: books, error: bookError } = await supabase
        .from('books')
        .select('title, preview_url')
        .order('created_at', { ascending: false })
        .limit(1);

    if (bookError) {
        console.error('❌ Error fetching books:', bookError.message);
    } else if (books && books.length > 0) {
        const book = books[0];
        console.log(`📘 Latest Book: "${book.title}"`);
        console.log(`🔗 Preview URL: ${book.preview_url || 'NONE'}`);

        if (book.preview_url) {
            console.log('   Testing accessibility...');
            try {
                // Check if it's a valid URL first
                new URL(book.preview_url);

                const res = await fetch(book.preview_url, { method: 'HEAD' });
                console.log(`   Status: ${res.status} ${res.statusText}`);
                if (res.status === 200) {
                    console.log('   ✅ URL is accessible!');
                } else {
                    console.log('   ❌ URL is NOT accessible!');
                }
            } catch (e: any) {
                console.error('   ❌ Failed to fetch URL:', e.message);
            }
        }
    } else {
        console.log('⚠️ No books found.');
    }
}

main().catch(console.error);
