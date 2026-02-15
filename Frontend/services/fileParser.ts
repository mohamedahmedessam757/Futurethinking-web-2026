// File Parser Service
// Complete document parsing for PDF, DOCX, PPTX, TXT with AI-ready extraction

import { supabase } from '../lib/supabase';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ParseResult {
    success: boolean;
    content?: string;
    structuredContent?: StructuredContent;
    error?: string;
    metadata?: FileMetadata;
}

export interface FileMetadata {
    fileName: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    wordCount?: number;
    characterCount?: number;
    hasImages?: boolean;
    hasHeadings?: boolean;
    language?: string;
}

export interface StructuredContent {
    title?: string;
    headings: HeadingItem[];
    sections: ContentSection[];
    images: ImageInfo[];
    tables: TableInfo[];
    bulletPoints: string[];
    numberedLists: string[][];
}

export interface HeadingItem {
    level: number; // 1-6
    text: string;
    position: number;
}

export interface ContentSection {
    heading?: string;
    content: string;
    type: 'text' | 'list' | 'table' | 'code' | 'quote';
}

export interface ImageInfo {
    index: number;
    alt?: string;
    caption?: string;
    base64?: string;
}

export interface TableInfo {
    headers: string[];
    rows: string[][];
}

export interface ParseOptions {
    extractImages?: boolean;
    extractTables?: boolean;
    extractStructure?: boolean;
    preserveFormatting?: boolean;
    maxPages?: number;
    language?: 'ar' | 'en' | 'auto';
}

// ============================================
// SUPPORTED FILE TYPES
// ============================================

const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.txt', '.rtf', '.md'];
const SUPPORTED_MIMES: Record<string, string[]> = {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    doc: ['application/msword'],
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    ppt: ['application/vnd.ms-powerpoint'],
    txt: ['text/plain'],
    rtf: ['application/rtf', 'text/rtf'],
    md: ['text/markdown', 'text/plain']
};

// ============================================
// FILE PARSER SERVICE CLASS
// ============================================

class FileParserService {
    private pdfWorkerLoaded: boolean = false;
    private mammothLoaded: boolean = false;

    constructor() {
        // Check for available libraries
        this.checkLibraries();
    }

    // ============================================
    // CORE PARSING METHODS
    // ============================================

    /**
     * Parse any supported file format
     */
    async parseFile(file: File, options?: ParseOptions): Promise<ParseResult> {
        const extension = this.getExtension(file.name).toLowerCase();

        const metadata: FileMetadata = {
            fileName: file.name,
            fileType: extension,
            fileSize: file.size
        };

        // Validate file
        if (!this.isSupported(file)) {
            return {
                success: false,
                error: `نوع الملف غير مدعوم: ${extension}. الأنواع المدعومة: ${SUPPORTED_EXTENSIONS.join(', ')}`,
                metadata
            };
        }

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            return {
                success: false,
                error: 'حجم الملف أكبر من 50 ميجابايت',
                metadata
            };
        }

        try {
            let content = '';
            let structuredContent: StructuredContent | undefined;

            switch (extension) {
                case '.txt':
                case '.md':
                    content = await this.parseTextFile(file);
                    break;

                case '.pdf':
                    const pdfResult = await this.parsePDF(file, options);
                    content = pdfResult.content || '';
                    structuredContent = pdfResult.structuredContent;
                    metadata.pageCount = pdfResult.pageCount;
                    break;

                case '.docx':
                case '.doc':
                    const docResult = await this.parseDocx(file, options);
                    content = docResult.content || '';
                    structuredContent = docResult.structuredContent;
                    break;

                case '.pptx':
                case '.ppt':
                    const pptResult = await this.parsePptx(file, options);
                    content = pptResult.content || '';
                    structuredContent = pptResult.structuredContent;
                    metadata.pageCount = pptResult.slideCount;
                    break;

                case '.rtf':
                    content = await this.parseRTF(file);
                    break;

                default:
                    content = await this.parseTextFile(file);
            }

            // Update metadata
            metadata.wordCount = this.countWords(content);
            metadata.characterCount = content.length;
            metadata.hasHeadings = structuredContent?.headings?.length > 0;
            metadata.language = this.detectLanguage(content);

            return {
                success: true,
                content,
                structuredContent,
                metadata
            };

        } catch (error: any) {
            console.error('File parsing error:', error);
            return {
                success: false,
                error: error.message || 'حدث خطأ أثناء قراءة الملف',
                metadata
            };
        }
    }

    // ============================================
    // TEXT FILE PARSING
    // ============================================

    /**
     * Parse plain text or markdown file
     */
    private async parseTextFile(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target?.result as string;
                resolve(content || '');
            };

            reader.onerror = () => {
                reject(new Error('فشل في قراءة الملف النصي'));
            };

            // Try UTF-8 first
            reader.readAsText(file, 'UTF-8');
        });
    }

    // ============================================
    // PDF PARSING
    // ============================================

    /**
     * Parse PDF file using pdf.js
     */
    private async parsePDF(
        file: File,
        options?: ParseOptions
    ): Promise<{ content: string; structuredContent?: StructuredContent; pageCount?: number }> {

        // Check if pdf.js is available
        const pdfjsLib = (window as any).pdfjsLib;

        if (!pdfjsLib) {
            // Fallback message
            return {
                content: this.getPDFFallbackMessage(file.name),
                pageCount: 0
            };
        }

        // Fix: Explicitly set worker source if missing (resolves InvalidPDFException)
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

            let fullText = '';
            const headings: HeadingItem[] = [];
            const sections: ContentSection[] = [];

            const maxPages = options?.maxPages || pdf.numPages;

            for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                let pageText = '';
                let lastY: number | null = null;

                for (const item of textContent.items) {
                    const textItem = item as any;

                    // Detect line breaks based on Y position
                    if (lastY !== null && Math.abs(textItem.transform[5] - lastY) > 10) {
                        pageText += '\n';
                    }

                    pageText += textItem.str;

                    // Detect potential headings (larger font size)
                    if (textItem.height > 14 && textItem.str.trim().length > 0) {
                        headings.push({
                            level: textItem.height > 20 ? 1 : 2,
                            text: textItem.str.trim(),
                            position: fullText.length + pageText.length
                        });
                    }

                    lastY = textItem.transform[5];
                }

                fullText += pageText + '\n\n';
            }

            // Extract structure if requested
            let structuredContent: StructuredContent | undefined;
            if (options?.extractStructure) {
                structuredContent = this.extractStructure(fullText, headings);
            }

            return {
                content: this.cleanText(fullText),
                structuredContent,
                pageCount: pdf.numPages
            };

        } catch (error: any) {
            console.error('PDF parsing error:', error);
            return {
                content: this.getPDFFallbackMessage(file.name),
                pageCount: 0
            };
        }
    }

    // ============================================
    // DOCX PARSING
    // ============================================

    /**
     * Parse DOCX file using mammoth.js
     */
    private async parseDocx(
        file: File,
        options?: ParseOptions
    ): Promise<{ content: string; structuredContent?: StructuredContent }> {

        // Check if mammoth is available
        const mammoth = (window as any).mammoth;

        if (!mammoth) {
            return {
                content: this.getDocxFallbackMessage(file.name)
            };
        }

        try {
            const arrayBuffer = await file.arrayBuffer();

            // Extract raw text
            const textResult = await mammoth.extractRawText({ arrayBuffer });
            const content = textResult.value;

            // Extract with HTML for structure detection
            let structuredContent: StructuredContent | undefined;

            if (options?.extractStructure) {
                const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
                structuredContent = this.parseHtmlStructure(htmlResult.value);
            }

            return {
                content: this.cleanText(content),
                structuredContent
            };

        } catch (error: any) {
            console.error('DOCX parsing error:', error);
            return {
                content: this.getDocxFallbackMessage(file.name)
            };
        }
    }

    // ============================================
    // PPTX PARSING
    // ============================================

    /**
     * Parse PowerPoint file
     */
    private async parsePptx(
        file: File,
        options?: ParseOptions
    ): Promise<{ content: string; structuredContent?: StructuredContent; slideCount?: number }> {

        // PowerPoint parsing requires JSZip + custom XML parsing
        // For now, provide extraction instructions

        try {
            // Check if JSZip is available for PPTX parsing
            const JSZip = (window as any).JSZip;

            if (JSZip) {
                const arrayBuffer = await file.arrayBuffer();
                const zip = await JSZip.loadAsync(arrayBuffer);

                let fullText = '';
                const slideFiles = Object.keys(zip.files).filter(
                    name => name.match(/ppt\/slides\/slide\d+\.xml/)
                );

                // Sort slides by number
                slideFiles.sort((a, b) => {
                    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
                    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
                    return numA - numB;
                });

                for (const slideFile of slideFiles) {
                    const slideXml = await zip.file(slideFile)?.async('string');
                    if (slideXml) {
                        const slideText = this.extractTextFromXml(slideXml);
                        if (slideText) {
                            fullText += `\n--- شريحة ${slideFiles.indexOf(slideFile) + 1} ---\n`;
                            fullText += slideText + '\n';
                        }
                    }
                }

                return {
                    content: this.cleanText(fullText),
                    slideCount: slideFiles.length
                };
            }

            // Fallback
            return {
                content: this.getPptxFallbackMessage(file.name),
                slideCount: 0
            };

        } catch (error: any) {
            console.error('PPTX parsing error:', error);
            return {
                content: this.getPptxFallbackMessage(file.name),
                slideCount: 0
            };
        }
    }

    // ============================================
    // RTF PARSING
    // ============================================

    /**
     * Parse RTF file
     */
    private async parseRTF(file: File): Promise<string> {
        const rawContent = await this.parseTextFile(file);

        // Basic RTF to text conversion
        let text = rawContent
            // Remove RTF headers
            .replace(/\{\\rtf1[^}]*\}/g, '')
            // Remove font tables
            .replace(/\{\\fonttbl[^}]*\}/g, '')
            // Remove color tables
            .replace(/\{\\colortbl[^}]*\}/g, '')
            // Remove control words
            .replace(/\\[a-z]+\d* ?/gi, '')
            // Remove braces
            .replace(/[{}]/g, '')
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim();

        return text;
    }

    // ============================================
    // STRUCTURE EXTRACTION
    // ============================================

    /**
     * Extract structured content from text
     */
    private extractStructure(text: string, headings: HeadingItem[]): StructuredContent {
        const sections: ContentSection[] = [];
        const bulletPoints: string[] = [];
        const numberedLists: string[][] = [];

        // Extract bullet points
        const bulletRegex = /^[\s]*[•\-\*]\s*(.+)$/gm;
        let match;
        while ((match = bulletRegex.exec(text)) !== null) {
            bulletPoints.push(match[1].trim());
        }

        // Extract numbered lists
        const numberedRegex = /^[\s]*(\d+)[.\)]\s*(.+)$/gm;
        let currentList: string[] = [];
        let lastNumber = 0;

        while ((match = numberedRegex.exec(text)) !== null) {
            const num = parseInt(match[1]);
            if (num === 1 || num <= lastNumber) {
                if (currentList.length > 0) {
                    numberedLists.push([...currentList]);
                }
                currentList = [];
            }
            currentList.push(match[2].trim());
            lastNumber = num;
        }
        if (currentList.length > 0) {
            numberedLists.push(currentList);
        }

        // Create sections from headings
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            const nextHeading = headings[i + 1];

            const startPos = heading.position;
            const endPos = nextHeading?.position || text.length;

            const sectionContent = text.slice(startPos, endPos).trim();

            sections.push({
                heading: heading.text,
                content: sectionContent,
                type: 'text'
            });
        }

        // Detect title (first h1 or first line)
        const title = headings.find(h => h.level === 1)?.text ||
            text.split('\n')[0]?.trim().slice(0, 100);

        return {
            title,
            headings,
            sections,
            images: [],
            tables: [],
            bulletPoints,
            numberedLists
        };
    }

    /**
     * Parse HTML structure from mammoth output
     */
    private parseHtmlStructure(html: string): StructuredContent {
        const headings: HeadingItem[] = [];
        const sections: ContentSection[] = [];
        const bulletPoints: string[] = [];

        // Create temporary DOM element
        const div = document.createElement('div');
        div.innerHTML = html;

        // Extract headings
        const headingElements = div.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headingElements.forEach((el, index) => {
            const level = parseInt(el.tagName.charAt(1));
            headings.push({
                level,
                text: el.textContent?.trim() || '',
                position: index
            });
        });

        // Extract list items
        const listItems = div.querySelectorAll('li');
        listItems.forEach(li => {
            bulletPoints.push(li.textContent?.trim() || '');
        });

        // Extract paragraphs as sections
        const paragraphs = div.querySelectorAll('p');
        paragraphs.forEach(p => {
            const content = p.textContent?.trim();
            if (content && content.length > 10) {
                sections.push({
                    content,
                    type: 'text'
                });
            }
        });

        return {
            title: headings[0]?.text,
            headings,
            sections,
            images: [],
            tables: [],
            bulletPoints,
            numberedLists: []
        };
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Check if file type is supported
     */
    isSupported(file: File): boolean {
        const extension = this.getExtension(file.name).toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(extension);
    }

    /**
     * Get file extension
     */
    private getExtension(fileName: string): string {
        const lastDot = fileName.lastIndexOf('.');
        return lastDot !== -1 ? fileName.slice(lastDot) : '';
    }

    /**
     * Clean extracted text
     */
    private cleanText(text: string): string {
        return text
            // Normalize whitespace
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Remove excessive newlines
            .replace(/\n{3,}/g, '\n\n')
            // Trim each line
            .split('\n')
            .map(line => line.trim())
            .join('\n')
            // Remove null characters
            .replace(/\0/g, '')
            .trim();
    }

    /**
     * Count words in text
     */
    private countWords(text: string): number {
        return text.split(/\s+/).filter(word => word.length > 0).length;
    }

    /**
     * Detect language (Arabic vs English)
     */
    private detectLanguage(text: string): 'ar' | 'en' | 'mixed' {
        const arabicPattern = /[\u0600-\u06FF]/;
        const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
        const latinChars = (text.match(/[a-zA-Z]/g) || []).length;

        if (arabicChars > latinChars * 2) return 'ar';
        if (latinChars > arabicChars * 2) return 'en';
        return 'mixed';
    }

    /**
     * Extract text from XML (for PPTX)
     */
    private extractTextFromXml(xml: string): string {
        // Simple XML text extraction
        const textMatches = xml.match(/<a:t>([^<]*)<\/a:t>/g) || [];
        return textMatches
            .map(match => match.replace(/<\/?a:t>/g, ''))
            .filter(text => text.trim().length > 0)
            .join(' ');
    }

    /**
     * Check available parsing libraries
     */
    private checkLibraries(): void {
        if (typeof window !== 'undefined') {
            this.pdfWorkerLoaded = !!(window as any).pdfjsLib;
            this.mammothLoaded = !!(window as any).mammoth;
        }
    }

    // ============================================
    // FALLBACK MESSAGES
    // ============================================

    private getPDFFallbackMessage(fileName: string): string {
        return `[محتوى ملف PDF: ${fileName}]

لقراءة ملفات PDF تلقائياً، يرجى التأكد من تحميل مكتبة pdf.js.

الحلول البديلة:
1. انسخ والصق المحتوى يدوياً
2. حول الملف إلى نص عادي (.txt)
3. استخدم أداة تحويل PDF إلى نص أونلاين`;
    }

    private getDocxFallbackMessage(fileName: string): string {
        return `[محتوى ملف Word: ${fileName}]

لقراءة ملفات Word تلقائياً، يرجى التأكد من تحميل مكتبة mammoth.js.

الحلول البديلة:
1. انسخ والصق المحتوى يدوياً من Word
2. احفظ الملف كنص عادي (.txt)
3. احفظ الملف كملف PDF`;
    }

    private getPptxFallbackMessage(fileName: string): string {
        return `[محتوى ملف PowerPoint: ${fileName}]

لقراءة ملفات PowerPoint، يرجى:
1. نسخ ولصق محتوى الشرائح يدوياً
2. تصدير العرض كملف PDF
3. تصدير العرض كملف نصي`;
    }

    // ============================================
    // PUBLIC UTILITIES
    // ============================================

    /**
     * Get supported file types description
     */
    getSupportedTypesDescription(): string {
        return 'PDF, DOCX, PPTX, TXT, RTF, MD';
    }

    /**
     * Get accept attribute for file inputs
     */
    getAcceptAttribute(): string {
        return SUPPORTED_EXTENSIONS.join(',');
    }

    /**
     * Get library status
     */
    getLibraryStatus(): { pdf: boolean; docx: boolean } {
        return {
            pdf: this.pdfWorkerLoaded,
            docx: this.mammothLoaded
        };
    }

    /**
     * Upload parsed file to Supabase
     */
    async uploadToSupabase(
        file: File,
        userId: string
    ): Promise<{ success: boolean; url?: string; error?: string }> {
        try {
            const fileName = `source_${Date.now()}_${file.name}`;
            const filePath = `${userId}/sources/${fileName}`;

            const { data, error } = await supabase.storage
                .from('ai-course-assets')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: true
                });

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('ai-course-assets')
                .getPublicUrl(filePath);

            return {
                success: true,
                url: urlData.publicUrl
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// ============================================
// EXPORT SINGLETON
// ============================================

const fileParserService = new FileParserService();
export default fileParserService;
