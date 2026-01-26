const fs = require('fs');
const path = require('path');

const DOCUMENTS_DIR = path.resolve(__dirname, '../documents');
const OUTPUT_FILE = path.resolve(__dirname, '../knowledge-base.json');

// Mapeo de keywords por tipo de documento y palabras comunes
const keywordPatterns = {
    // Nómina y pagos
    'nomina': ['nomina', 'cantv', 'pago', 'pagar', 'pagan', 'paga', 'fecha', 'cobro', 'calendario', 'cronograma', 'quincena', 'bono'],
    'pago': ['pago', 'pagar', 'pagan', 'fecha', 'cuando', 'dia'],

    // Reembolsos
    'reembolso': ['reembolsos', 'gastos', 'médicos', 'medico', 'gasto', 'factura', 'salud', 'dinero'],
    'medicina': ['medicamento', 'medicamentos', 'medicina', 'farmacia', 'receta'],
    'consulta': ['consulta', 'doctor', 'médico', 'medico'],
    'cirugia': ['cirugía', 'cirugia', 'quirúrgico', 'quirurgico', 'operación', 'operacion'],
    'examen': ['examen', 'exámenes', 'laboratorio', 'estudio', 'estudios'],

    // Carta aval
    'carta': ['carta', 'aval'],
    'seguro': ['seguro', 'cobertura', 'clinica', 'clínica', 'hospital'],

    // Contactos
    'contacto': ['contactos', 'contacto', 'telefono', 'teléfono', 'numero', 'número', 'llamada', 'correo', 'email', 'ubicacion', 'ubicación'],
    'atencion': ['atención', 'atencion', 'jubilado', 'jubilados', 'servicio'],
    'emergencia': ['emergencia', 'emergencias', 'urgencia', '0800', 'movilnet'],

    // Fechas
    'fecha': ['fecha', 'fechas', 'cuando', 'cuándo', 'dia', 'día', 'mes'],
    'feriado': ['feriado', 'festivo', 'fiesta', 'carnaval'],

    // Años comunes
    '2026': ['2026'],
    '2027': ['2027']
};

// Meses del año para detección
const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Detecta keywords inteligentemente basándose en:
 * 1. Nombre del archivo
 * 2. Contenido del documento
 * 3. Título del documento
 */
function detectKeywords(filename, content, titulo) {
    const keywords = new Set();
    const lowerFilename = filename.toLowerCase();
    const lowerContent = content.toLowerCase();
    const lowerTitulo = titulo.toLowerCase();

    // 1. Detectar por nombre de archivo
    for (const [category, words] of Object.entries(keywordPatterns)) {
        if (lowerFilename.includes(category)) {
            words.forEach(w => keywords.add(w));
        }
    }

    // 2. Detectar por título
    for (const [category, words] of Object.entries(keywordPatterns)) {
        if (lowerTitulo.includes(category)) {
            words.forEach(w => keywords.add(w));
        }
    }

    // 3. Detectar por contenido (solo palabras clave importantes)
    for (const [category, words] of Object.entries(keywordPatterns)) {
        for (const word of words) {
            if (lowerContent.includes(word)) {
                keywords.add(word);
            }
        }
    }

    // 4. Detectar meses mencionados
    for (const mes of meses) {
        if (lowerContent.includes(mes)) {
            keywords.add(mes);
        }
    }

    // 5. Agregar palabras del título (sin artículos ni preposiciones)
    const stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'al', 'a', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'y', 'o', 'u'];
    const tituloWords = lowerTitulo
        .replace(/[^\w\sáéíóúñü]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));

    tituloWords.forEach(w => keywords.add(w));

    // 6. Filtrar keywords muy cortas (menos de 3 caracteres)
    const filteredKeywords = Array.from(keywords).filter(k => k.length >= 3);

    return filteredKeywords.sort();
}

/**
 * Extrae el título del documento markdown
 */
function extractTitle(content) {
    // Buscar el primer encabezado H1 (# Título)
    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) {
        return titleMatch[1].trim();
    }

    // Si no hay H1, buscar H2
    const h2Match = content.match(/^##\s+(.+)/m);
    if (h2Match) {
        return h2Match[1].trim();
    }

    // Si no hay ningún encabezado, usar el nombre del archivo
    return '';
}

/**
 * Construye la base de conocimientos desde archivos Markdown
 */
async function buildKnowledgeBase() {
    console.log('🏗️  CONSTRUYENDO KNOWLEDGE BASE\n');
    console.log('═'.repeat(70));

    // Verificar que exista el directorio de documentos
    if (!fs.existsSync(DOCUMENTS_DIR)) {
        console.error(`❌ Error: Directorio no encontrado: ${DOCUMENTS_DIR}`);
        process.exit(1);
    }

    // Leer archivos .md
    const files = fs.readdirSync(DOCUMENTS_DIR)
        .filter(f => f.endsWith('.md'))
        .sort();

    if (files.length === 0) {
        console.error(`❌ Error: No se encontraron archivos .md en ${DOCUMENTS_DIR}`);
        console.log('\n💡 Ejecuta primero: node scripts/convert-docx-to-md.js');
        process.exit(1);
    }

    console.log(`📚 Archivos encontrados: ${files.length}\n`);

    const sheets = {};

    for (const file of files) {
        const filePath = path.join(DOCUMENTS_DIR, file);
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

        console.log(`✅ ${key}`);
        console.log(`   📝 Título: ${titulo}`);
        console.log(`   🔑 Keywords (${keywords.length}): ${keywords.slice(0, 8).join(', ')}${keywords.length > 8 ? '...' : ''}`);
        console.log('');
    }

    // Construir objeto final
    const kb = {
        sheets,
        lastUpdated: new Date().toISOString()
    };

    // Guardar archivo JSON
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(kb, null, 2), 'utf-8');

    console.log('═'.repeat(70));
    console.log(`✨ Knowledge base creada exitosamente!`);
    console.log(`📄 Archivo: ${path.basename(OUTPUT_FILE)}`);
    console.log(`📊 Documentos procesados: ${Object.keys(sheets).length}`);
    console.log(`📅 Última actualización: ${new Date().toLocaleString('es-ES')}`);
    console.log('\n💡 Reinicia el servidor para que los cambios surtan efecto:');
    console.log('   npm run dev');
    console.log('');
}

// Ejecutar
buildKnowledgeBase().catch(error => {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
});
