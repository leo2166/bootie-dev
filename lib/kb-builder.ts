import path from 'path';
import fs from 'fs';

/**
 * Genera knowledge-base.json desde archivos Markdown
 * Replicación de la lógica de scripts/build-kb.js
 */

const keywordPatterns: Record<string, string[]> = {
    'nomina': ['nomina', 'cantv', 'pago', 'pagar', 'pagan', 'paga', 'fecha', 'cobro', 'calendario', 'cronograma', 'quincena', 'bono'],
    'pago': ['pago', 'pagar', 'pagan', 'fecha', 'cuando', 'dia'],
    'reembolso': ['reembolsos', 'gastos', 'médicos', 'medico', 'gasto', 'factura', 'salud', 'dinero'],
    'medicina': ['medicamento', 'medicamentos', 'medicina', 'farmacia', 'receta'],
    'consulta': ['consulta', 'doctor', 'médico', 'medico'],
    'cirugia': ['cirugía', 'cirugia', 'quirúrgico', 'quirurgico', 'operación', 'operacion'],
    'examen': ['examen', 'exámenes', 'laboratorio', 'estudio', 'estudios'],
    'carta': ['carta', 'aval'],
    'seguro': ['seguro', 'cobertura', 'clinica', 'clínica', 'hospital'],
    'contacto': ['contactos', 'contacto', 'telefono', 'teléfono', 'numero', 'número', 'llamada', 'correo', 'email', 'ubicacion', 'ubicación'],
    'atencion': ['atención', 'atencion', 'jubilado', 'jubilados', 'servicio'],
    'emergencia': ['emergencia', 'emergencias', 'urgencia', '0800', 'movilnet'],
    'fecha': ['fecha', 'fechas', 'cuando', 'cuándo', 'dia', 'día', 'mes'],
    'feriado': ['feriado', 'festivo', 'fiesta', 'carnaval'],
    '2026': ['2026'],
    '2027': ['2027']
};

const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function detectKeywords(filename: string, content: string, titulo: string): string[] {
    const keywords = new Set<string>();
    const lowerFilename = filename.toLowerCase();
    const lowerContent = content.toLowerCase();
    const lowerTitulo = titulo.toLowerCase();

    // Detectar por nombre de archivo
    for (const [category, words] of Object.entries(keywordPatterns)) {
        if (lowerFilename.includes(category)) {
            words.forEach(w => keywords.add(w));
        }
    }

    // Detectar por título
    for (const [category, words] of Object.entries(keywordPatterns)) {
        if (lowerTitulo.includes(category)) {
            words.forEach(w => keywords.add(w));
        }
    }

    // Detectar por contenido
    for (const [category, words] of Object.entries(keywordPatterns)) {
        for (const word of words) {
            if (lowerContent.includes(word)) {
                keywords.add(word);
            }
        }
    }

    // Detectar meses
    for (const mes of meses) {
        if (lowerContent.includes(mes)) {
            keywords.add(mes);
        }
    }

    // Palabras del título
    const stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'al', 'a', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'y', 'o', 'u'];
    const tituloWords = lowerTitulo
        .replace(/[^\w\sáéíóúñü]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));

    tituloWords.forEach(w => keywords.add(w));

    // Filtrar keywords muy cortas
    return Array.from(keywords).filter(k => k.length >= 3).sort();
}

function extractTitle(content: string): string {
    // Buscar H1
    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) {
        return titleMatch[1].trim();
    }

    // Buscar H2
    const h2Match = content.match(/^##\s+(.+)/m);
    if (h2Match) {
        return h2Match[1].trim();
    }

    return '';
}

export function buildKnowledgeBase(documentsDir: string, outputFile: string): {
    success: boolean;
    message: string;
    stats?: { documentCount: number };
} {
    try {
        // Verificar directorio
        if (!fs.existsSync(documentsDir)) {
            return { success: false, message: `Directorio no encontrado: ${documentsDir}` };
        }

        // Leer archivos .md
        const files = fs.readdirSync(documentsDir)
            .filter(f => f.endsWith('.md'))
            .sort();

        if (files.length === 0) {
            return { success: false, message: 'No se encontraron archivos .md en documents/' };
        }

        const sheets: Record<string, any> = {};

        for (const file of files) {
            const filePath = path.join(documentsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const key = path.basename(file, '.md');

            // Extraer título
            const extractedTitle = extractTitle(content);
            const titulo = extractedTitle || key.replace(/-/g, ' ').toUpperCase();

            // Detectar keywords
            const keywords = detectKeywords(key, content, titulo);

            sheets[key] = {
                titulo: titulo.toUpperCase(),
                contenido: content,
                keywords
            };
        }

        // Construir objeto final
        const kb = {
            sheets,
            lastUpdated: new Date().toISOString()
        };

        // Guardar archivo JSON
        fs.writeFileSync(outputFile, JSON.stringify(kb, null, 2), 'utf-8');

        return {
            success: true,
            message: 'Knowledge base actualizada exitosamente',
            stats: {
                documentCount: Object.keys(sheets).length,
                totalDocs: Object.keys(sheets).length,
                totalChunks: 0 // No chunking implemented yet
            }
        };
    } catch (error: any) {
        return {
            success: false,
            message: `Error: ${error.message}`
        };
    }
}
