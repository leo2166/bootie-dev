import * as dotenv from "dotenv";
import dns from 'node:dns';
import path from "path";
import fs from "fs";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Forzar IPv4 para evitar problemas con VPN/CANTV
dns.setDefaultResultOrder('ipv4first');

interface KnowledgeBase {
    documents: {
        name: string;
        content: string;
        chunks: string[];
    }[];
    lastUpdated: string;
}

// Extraer texto de un PDF usando pdfjs
async function extractTextFromPDF(pdfPath: string): Promise<string> {
    console.log(`📂 Cargando archivo PDF: ${pdfPath}`);
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    console.log(`📊 Bytes leídos: ${data.length}`);

    const pdf = await pdfjsLib.getDocument({ data }).promise;
    console.log(`📄 Páginas encontradas: ${pdf.numPages}`);

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        console.log(`📖 Procesando página ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        console.log(`   - Items de texto en página ${i}: ${textContent.items.length}`);

        const pageText = textContent.items
            .map((item: any) => {
                if ('str' in item) return item.str;
                return "";
            })
            .join(" ");

        if (pageText.trim().length > 0) {
            console.log(`   ✅ Texto extraído de página ${i} (${pageText.length} caracteres)`);
        } else {
            console.warn(`   ⚠️ Página ${i} parece estar vacía de texto.`);
        }

        fullText += pageText + "\n\n";
    }

    return fullText;
}

// Dividir texto en chunks más pequeños para mejor búsqueda
function splitIntoChunks(text: string, chunkSize: number = 1500): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = "";

    for (const paragraph of paragraphs) {
        if (currentChunk.length + paragraph.length > chunkSize) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = paragraph;
        } else {
            currentChunk += "\n\n" + paragraph;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

async function extractAndSave() {
    const documentsDir = path.join(process.cwd(), "documents");
    const knowledgeFile = path.join(process.cwd(), "knowledge-base.json");

    // Verificar que existe la carpeta documents
    if (!fs.existsSync(documentsDir)) {
        console.error("❌ La carpeta 'documents/' no existe.");
        process.exit(1);
    }

    // Leer archivos de la carpeta
    const files = fs.readdirSync(documentsDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return [".pdf", ".txt", ".md"].includes(ext);
    });

    if (files.length === 0) {
        console.error("❌ No se encontraron archivos en la carpeta 'documents/'");
        process.exit(1);
    }

    console.log(`📄 Encontrados ${files.length} archivos para procesar:`);
    files.forEach(file => console.log(`   - ${file}`));
    console.log("");

    const knowledgeBase: KnowledgeBase = {
        documents: [],
        lastUpdated: new Date().toISOString()
    };

    for (const file of files) {
        const filePath = path.join(documentsDir, file);
        const ext = path.extname(file).toLowerCase();

        console.log(`📖 Procesando: ${file}...`);

        let content = "";

        if (ext === ".pdf") {
            content = await extractTextFromPDF(filePath);
        } else {
            content = fs.readFileSync(filePath, "utf-8");
        }

        // Limpiar el texto
        content = content
            .replace(/\s+/g, " ")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        const chunks = splitIntoChunks(content);

        knowledgeBase.documents.push({
            name: file,
            content: content.substring(0, 5000), // Resumen para contexto
            chunks
        });

        console.log(`✅ Procesado: ${file} (${chunks.length} chunks)`);
    }

    // Guardar base de conocimiento
    fs.writeFileSync(knowledgeFile, JSON.stringify(knowledgeBase, null, 2));

    const totalChunks = knowledgeBase.documents.reduce((acc, doc) => acc + doc.chunks.length, 0);

    console.log("\n🎉 ¡Base de conocimiento creada!");
    console.log(`📊 Total de documentos: ${knowledgeBase.documents.length}`);
    console.log(`📊 Total de chunks: ${totalChunks}`);
    console.log(`💾 Guardado en: knowledge-base.json`);
    console.log("\n✅ ¡Listo! Ahora Bootie puede responder preguntas usando esta base de conocimiento.");
}

extractAndSave();
