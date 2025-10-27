#!/bin/bash

echo "🚀 Instalando optimizaciones de Lighthouse para deb8..."
echo ""

# Instalar dependencia de compresión en el servidor
echo "📦 Instalando compression en el servidor..."
cd server
npm install compression
echo "✅ Compression instalado"
echo ""

# Reconstruir el cliente con las nuevas optimizaciones
echo "🔨 Reconstruyendo el cliente..."
cd ../client
npm run build
echo "✅ Cliente reconstruido"
echo ""

echo "✨ ¡Optimizaciones instaladas correctamente!"
echo ""
echo "📊 Cambios aplicados:"
echo "  ✓ SEO: Meta descripción, robots.txt, sitemap.xml"
echo "  ✓ Accesibilidad: Contraste mejorado, ARIA labels"
echo "  ✓ Rendimiento: Code splitting, lazy loading, compresión"
echo "  ✓ Seguridad: HSTS, CSP, headers de seguridad"
echo ""
echo "🎯 Para desplegar a producción:"
echo "  cd server && npm start"
echo ""
